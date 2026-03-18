// POST /api/followup/webhook/sms
// Receives inbound SMS webhooks from Twilio

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';

interface SmsWebhookAck {
  received: true;
}

export async function POST(request: NextRequest): Promise<NextResponse<SmsWebhookAck | ApiError>> {
  try {
    // Twilio sends form-encoded data; read as text to preserve raw body for signature verification
    const rawBody = await request.text();

    // TODO: Verify Twilio signature using X-Twilio-Signature header
    // TODO: Parse form-encoded body and process inbound SMS
    // TODO: Route message to AI Sales Agent conversation if applicable

    void rawBody; // Acknowledge usage to satisfy strict mode

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to process SMS webhook',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
