// POST /api/cron/stale-scans
// Cron job: cleans up scans stuck in non-terminal states

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';

interface CronStaleScansResult {
  cleaned: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<CronStaleScansResult | ApiError>> {
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

    // TODO: Query scans with status 'scanning' | 'capturing' | 'analyzing' older than threshold
    // TODO: Mark stale scans as 'failed' with reason
    // TODO: Clean up any orphaned screenshot storage files
    // TODO: Optionally trigger follow-up for leads with abandoned scans

    const mockResult: CronStaleScansResult = {
      cleaned: 0,
    };

    return NextResponse.json(mockResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Cron stale-scans cleanup failed',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
