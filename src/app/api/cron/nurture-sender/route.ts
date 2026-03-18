// POST /api/cron/nurture-sender
// Cron job: sends nurture sequence messages to leads who haven't booked

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';

interface CronNurtureResult {
  sent: number;
  skipped: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<CronNurtureResult | ApiError>> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing cron secret',
          },
        },
        { status: 401 },
      );
    }

    // TODO: Query leads eligible for nurture messages
    // TODO: Determine which nurture step each lead is on
    // TODO: Send via email (Resend) with personalized content
    // TODO: Skip leads who have already booked or opted out
    // TODO: Update nurture sequence state

    const mockResult: CronNurtureResult = {
      sent: 0,
      skipped: 0,
    };

    return NextResponse.json(mockResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Cron nurture-sender failed',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
