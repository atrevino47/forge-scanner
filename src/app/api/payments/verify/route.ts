// GET /api/payments/verify
// Verifies the status of a Stripe PaymentIntent

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError } from '@/../contracts/api';
import { getStripe } from '@/lib/stripe/client';

const querySchema = z.object({
  paymentIntentId: z.string().min(1, 'paymentIntentId is required'),
});

interface VerifyPaymentResponse {
  verified: true;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'canceled';
  amountCents: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<VerifyPaymentResponse | ApiError>> {
  try {
    // TODO: Wire admin auth once ADMIN_EMAILS is configured

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      paymentIntentId: searchParams.get('paymentIntentId'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'paymentIntentId query parameter is required',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(parsed.data.paymentIntentId);

    const statusMap: Record<string, VerifyPaymentResponse['status']> = {
      succeeded: 'succeeded',
      processing: 'processing',
      requires_payment_method: 'requires_payment_method',
      canceled: 'canceled',
    };

    return NextResponse.json(
      {
        verified: true,
        status: statusMap[pi.status] ?? 'requires_payment_method',
        amountCents: pi.amount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[payments/verify] Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to verify payment',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
