// POST /api/payments/webhook
// Receives Stripe webhook events for payment status updates

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';

interface StripeWebhookAck {
  received: true;
}

export async function POST(request: NextRequest): Promise<NextResponse<StripeWebhookAck | ApiError>> {
  try {
    // Read raw body for Stripe signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    // TODO: Verify Stripe webhook signature using stripe.webhooks.constructEvent()
    // TODO: Handle event types:
    //   - payment_intent.succeeded → mark payment as completed, update lead status
    //   - payment_intent.payment_failed → log failure, notify admin
    //   - charge.refunded → update payment record

    void rawBody; // Acknowledge usage to satisfy strict mode
    void signature;

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to process Stripe webhook',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
