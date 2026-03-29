// POST /api/payments/webhook
// Receives Stripe webhook events for payment status updates

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';
import { getStripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/db/client';

interface StripeWebhookAck {
  received: true;
}

export async function POST(request: NextRequest): Promise<NextResponse<StripeWebhookAck | ApiError>> {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    let event;
    if (webhookSecret && signature) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In dev/test mode without webhook secret, parse directly
      event = JSON.parse(rawBody) as { type: string; data: { object: { id: string; metadata?: Record<string, string> } } };
    }

    const db = createServiceClient();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        await db
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', pi.id);
        console.log(`[payments/webhook] Payment succeeded: ${pi.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await db
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id);
        console.log(`[payments/webhook] Payment failed: ${pi.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as { id: string; payment_intent?: string };
        if (charge.payment_intent) {
          await db
            .from('payments')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent);
          console.log(`[payments/webhook] Payment refunded: ${charge.payment_intent}`);
        }
        break;
      }

      default:
        console.log(`[payments/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[payments/webhook] Error:', error);
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
