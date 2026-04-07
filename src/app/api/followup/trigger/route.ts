import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { writeVaultEvent } from '@/lib/vault/event-writer';
import { writeQueueEntry } from '@/lib/vault/queue-writer';
import { verifyCsrf } from '@/lib/api-utils';
import type { TriggerFollowupResponse, ApiError } from '@/../contracts/api';
import type { DbScan, DbLead } from '@/lib/db/types';
import type { FunnelStage, StageSummary } from '@/../contracts/types';

const triggerFollowupSchema = z.object({
  scanId: z.string().min(1, 'scanId is required'),
  leadId: z.string().min(1, 'leadId is required'),
  reason: z.enum(['exit_intent', 'no_booking', 'abandoned_scan']),
});

export async function POST(request: NextRequest): Promise<NextResponse<TriggerFollowupResponse | ApiError>> {
  try {
    // Verify request originates from our app (CSRF protection)
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Invalid request origin' } },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();
    const parsed = triggerFollowupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid request body', details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const { scanId, leadId, reason } = parsed.data;
    const supabase = createServiceClient();

    const [scanResult, leadResult] = await Promise.all([
      supabase.from('scans').select('*').eq('id', scanId).single<DbScan>(),
      supabase.from('leads').select('*').eq('id', leadId).single<DbLead>(),
    ]);

    const scan = scanResult.data;
    const lead = leadResult.data;

    if (!scan || !lead) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Scan or lead not found' } },
        { status: 404 },
      );
    }

    writeVaultEvent({
      type: 'lead_exited',
      scanId,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      businessName: lead.business_name,
      websiteUrl: scan.website_url,
      details: { reason },
    });

    const sequenceId = `seq_${crypto.randomUUID()}`;
    const firstMessageAt = new Date(Date.now() + 45 * 1000).toISOString();

    if (lead.email) {
      const { data: stages } = await supabase
        .from('funnel_stages')
        .select('stage, summary')
        .eq('scan_id', scanId)
        .not('summary', 'is', null)
        .returns<Array<{ stage: FunnelStage; summary: StageSummary }>>();

      const weakest = (stages ?? [])
        .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100))[0];

      const criticalFindings = (stages ?? [])
        .flatMap((s) => (s.summary?.findings ?? []).filter((f) => f.type === 'critical'))
        .slice(0, 3)
        .map((f) => f.title);

      // Insert follow-up sequence into DB (3-touch: 45s, 24h, 72h)
      const triggerReasonMap: Record<string, string> = {
        exit_intent: 'exit_intent',
        no_booking: 'no_booking',
        abandoned_scan: 'abandoned_scan',
      };

      const followupRows = [
        { lead_id: leadId, scan_id: scanId, channel: 'email', status: 'pending', reason: triggerReasonMap[reason], scheduled_at: firstMessageAt, sequence_id: sequenceId, sequence_step: 1 },
        { lead_id: leadId, scan_id: scanId, channel: 'email', status: 'pending', reason: triggerReasonMap[reason], scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), sequence_id: sequenceId, sequence_step: 2 },
        { lead_id: leadId, scan_id: scanId, channel: 'email', status: 'pending', reason: triggerReasonMap[reason], scheduled_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), sequence_id: sequenceId, sequence_step: 3 },
      ];

      const { error: followupError } = await supabase.from('followups').insert(followupRows);
      if (followupError) {
        console.error('[followup/trigger] Failed to insert followup rows:', followupError.message);
      }

      // Also write to vault queue for Sales Orchestrator visibility
      const triggerMap: Record<string, 'conversation_abandoned' | 'bounced' | 'no_chat'> = {
        exit_intent: 'conversation_abandoned',
        no_booking: 'conversation_abandoned',
        abandoned_scan: 'bounced',
      };

      writeQueueEntry({
        scanId,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        businessName: lead.business_name ?? scan.website_url,
        trigger: triggerMap[reason] ?? 'conversation_abandoned',
        sequencePosition: 1,
        channel: 'email',
        scheduledFor: firstMessageAt,
        weakestStage: weakest?.stage ?? 'unknown',
        weakestScore: weakest?.summary?.score ?? 0,
        criticalFindings,
        topInsight: weakest?.summary?.headline ?? 'Your funnel has room for improvement',
      });
    }

    const response: TriggerFollowupResponse = {
      scheduled: !!lead.email,
      sequenceId,
      firstMessageAt: lead.email ? firstMessageAt : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[followup/trigger] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to trigger follow-up sequence', details: error instanceof Error ? error.message : undefined } },
      { status: 500 },
    );
  }
}
