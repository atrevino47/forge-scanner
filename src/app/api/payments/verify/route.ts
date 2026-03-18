// GET /api/payments/verify
// Verifies the status of a Stripe PaymentIntent

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError } from '@/../contracts/api';

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

    // TODO: Retrieve actual PaymentIntent from Stripe
    // TODO: Cross-reference with internal payment record

    const mockResponse: VerifyPaymentResponse = {
      verified: true,
      status: 'succeeded',
      amountCents: 50000,
    };

    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
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
