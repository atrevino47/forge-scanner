// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for team-initiated payments during calls

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CreatePaymentIntentResponse, ApiError } from '@/../contracts/api';
import { getStripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/db/client';
import { requireAdminSession } from '@/lib/auth/admin';

const createPaymentIntentSchema = z.object({
  leadId: z.string().min(1, 'leadId is required'),
  scanId: z.string().optional(),
  amountCents: z.number().int().positive('amountCents must be a positive integer'),
  currency: z.string().length(3).default('usd'),
  productType: z.enum(['setup_fee', 'monthly_retainer', 'custom_package']),
  description: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse<CreatePaymentIntentResponse | ApiError>> {
  try {
    const authError = await requireAdminSession(request);
    if (authError) return authError as NextResponse<ApiError>;

    const body: unknown = await request.json();
    const parsed = createPaymentIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid payment intent request',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { leadId, scanId, amountCents, currency, productType, description } = parsed.data;

    // Verify Stripe is configured before proceeding
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Payments are not configured. Set STRIPE_SECRET_KEY in environment variables.',
          },
        },
        { status: 503 },
      );
    }

    // Look up lead email for Stripe metadata
    const db = createServiceClient();
    const { data: lead } = await db
      .from('leads')
      .select('email, business_name')
      .eq('id', leadId)
      .single();

    // Create Stripe PaymentIntent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        leadId,
        scanId: scanId ?? '',
        productType,
        source: 'admin_panel',
      },
      description: description ?? `Forge ${productType.replace(/_/g, ' ')} — ${lead?.business_name ?? 'Unknown'}`,
      receipt_email: lead?.email ?? undefined,
    });

    // Store payment record in database
    await db.from('payments').insert({
      lead_id: leadId,
      scan_id: scanId ?? null,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: amountCents,
      currency,
      product_type: productType,
      description: description ?? null,
      status: 'pending',
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[payments/create-intent] Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to create payment intent',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
