// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for team-initiated payments during calls

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CreatePaymentIntentResponse, ApiError } from '@/../contracts/api';

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

    // TODO: Verify admin authentication
    // TODO: Create actual Stripe PaymentIntent via Stripe SDK
    // TODO: Store payment record in database

    const mockResponse: CreatePaymentIntentResponse = {
      clientSecret: `pi_mock_${crypto.randomUUID()}_secret_mock`,
      paymentIntentId: `pi_mock_${crypto.randomUUID()}`,
    };

    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
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
