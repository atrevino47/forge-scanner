// POST /api/followup/webhook/whatsapp
// Receives inbound WhatsApp Business API webhooks

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';

interface WhatsAppWebhookAck {
  received: true;
}

export async function POST(request: NextRequest): Promise<NextResponse<WhatsAppWebhookAck | ApiError>> {
  try {
    // WhatsApp sends JSON; read as text for signature verification before parsing
    const rawBody = await request.text();

    // TODO: Verify WhatsApp webhook signature
    // TODO: Parse JSON body and extract message content
    // TODO: Route message to AI Sales Agent conversation if applicable

    void rawBody; // Acknowledge usage to satisfy strict mode

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to process WhatsApp webhook',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
