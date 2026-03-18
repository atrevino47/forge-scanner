// POST /api/cron/followup-sender
// Cron job: processes and sends pending follow-up messages

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';

interface CronFollowupResult {
  processed: number;
  errors: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<CronFollowupResult | ApiError>> {
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

    // TODO: Query pending follow-up messages from database
    // TODO: Send via appropriate channel (email/sms/whatsapp)
    // TODO: Update follow-up status records
    // TODO: Log results for admin visibility

    const mockResult: CronFollowupResult = {
      processed: 0,
      errors: 0,
    };

    return NextResponse.json(mockResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Cron followup-sender failed',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
