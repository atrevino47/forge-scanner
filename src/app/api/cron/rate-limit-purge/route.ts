// POST /api/cron/rate-limit-purge
// Cron job: delete expired rate_limit rows older than 25h to prevent unbounded growth.
// Registered in vercel.json at "0 4 * * *".

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import type { ApiError } from '@/../contracts/api';

interface PurgeResult {
  deleted: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<PurgeResult | ApiError>> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing cron secret' } },
      { status: 401 },
    );
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('rate_limits')
    .delete({ count: 'exact' })
    .lt('window_start', cutoff);

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Purge failed', details: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: count ?? 0 }, { status: 200 });
}
