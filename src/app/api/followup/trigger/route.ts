// POST /api/followup/trigger
// Triggers a follow-up sequence for a lead based on their behavior

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { TriggerFollowupResponse, ApiError } from '@/../contracts/api';

const triggerFollowupSchema = z.object({
  scanId: z.string().min(1, 'scanId is required'),
  leadId: z.string().min(1, 'leadId is required'),
  reason: z.enum(['exit_intent', 'no_booking', 'abandoned_scan']),
});

export async function POST(request: NextRequest): Promise<NextResponse<TriggerFollowupResponse | ApiError>> {
  try {
    const body: unknown = await request.json();
    const parsed = triggerFollowupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // TODO: Implement actual follow-up trigger logic
    const mockResponse: TriggerFollowupResponse = {
      scheduled: true,
      sequenceId: `seq_${crypto.randomUUID()}`,
      firstMessageAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to trigger follow-up sequence',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
