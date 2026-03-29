// POST /api/cron/stale-scans
// Cron job: cleans up scans stuck in non-terminal states.
//
// Scans can get stuck if:
//   - Browserless connection dropped mid-capture
//   - AI analysis timed out
//   - Server restarted during pipeline execution
//
// This cron marks stuck scans as 'failed' and optionally triggers
// follow-up for leads with abandoned scans (they entered a URL but
// never got results — still a warm lead).
//
// Designed to run every 5 minutes via Vercel Cron or QStash.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import type { ApiError } from '@/../contracts/api';

// Scans stuck for longer than this threshold are considered stale
const STALE_THRESHOLD_MINUTES = 15;

interface CronStaleScansResult {
  cleaned: number;
  followupsTriggered: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<CronStaleScansResult | ApiError>> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing cron secret' } },
        { status: 401 },
      );
    }

    const supabase = createServiceClient();
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    // Find scans stuck in non-terminal states created before the cutoff
    const { data: staleScans, error: queryError } = await supabase
      .from('scans')
      .select('id, lead_id, status, created_at')
      .in('status', ['scanning', 'capturing', 'analyzing'])
      .lt('created_at', cutoff);

    if (queryError) {
      console.error('[stale-scans] Query failed:', queryError.message);
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Failed to query stale scans' } },
        { status: 500 },
      );
    }

    if (!staleScans || staleScans.length === 0) {
      return NextResponse.json({ cleaned: 0, followupsTriggered: 0 });
    }

    let cleaned = 0;
    let followupsTriggered = 0;

    for (const scan of staleScans) {
      try {
        // Mark scan as failed
        await supabase
          .from('scans')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', scan.id);

        // Mark any in-progress funnel stages as failed
        await supabase
          .from('funnel_stages')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('scan_id', scan.id)
          .in('status', ['pending', 'capturing', 'analyzing']);

        cleaned++;

        // Check if lead has email — trigger abandoned scan follow-up
        const { data: lead } = await supabase
          .from('leads')
          .select('email')
          .eq('id', scan.lead_id)
          .single();

        if (lead?.email) {
          // Check no existing follow-up sequence for this scan
          const { data: existingFollowups } = await supabase
            .from('followups')
            .select('id')
            .eq('scan_id', scan.id)
            .limit(1);

          if (!existingFollowups || existingFollowups.length === 0) {
            // Create abandoned scan follow-up sequence
            const sequenceId = `seq_${crypto.randomUUID()}`;
            const followupRows = [
              { lead_id: scan.lead_id, scan_id: scan.id, channel: 'email', status: 'pending', reason: 'abandoned_scan', scheduled_at: new Date(Date.now() + 60 * 1000).toISOString(), sequence_id: sequenceId, sequence_step: 1 },
              { lead_id: scan.lead_id, scan_id: scan.id, channel: 'email', status: 'pending', reason: 'abandoned_scan', scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), sequence_id: sequenceId, sequence_step: 2 },
            ];

            const { error: followupError } = await supabase.from('followups').insert(followupRows);
            if (!followupError) {
              followupsTriggered++;
            }
          }
        }
      } catch (scanError) {
        console.error(`[stale-scans] Failed to clean scan ${scan.id}:`, scanError);
      }
    }

    console.log(`[stale-scans] Cleaned: ${cleaned}, Follow-ups triggered: ${followupsTriggered}`);

    return NextResponse.json({ cleaned, followupsTriggered }, { status: 200 });
  } catch (error) {
    console.error('[stale-scans] Fatal error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Cron stale-scans cleanup failed', details: error instanceof Error ? error.message : undefined } },
      { status: 500 },
    );
  }
}
