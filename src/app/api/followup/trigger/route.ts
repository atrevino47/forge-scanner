import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { writeVaultEvent } from '@/lib/vault/event-writer';
import { writeQueueEntry } from '@/lib/vault/queue-writer';
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

    const triggerMap: Record<string, 'conversation_abandoned' | 'bounced' | 'no_chat'> = {
      exit_intent: 'conversation_abandoned',
      no_booking: 'conversation_abandoned',
      abandoned_scan: 'bounced',
    };

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

      writeQueueEntry({
        scanId,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        businessName: lead.business_name ?? scan.website_url,
        trigger: triggerMap[reason] ?? 'conversation_abandoned',
        sequencePosition: 1,
        channel: 'email',
        scheduledFor: new Date(Date.now() + 45 * 1000).toISOString(),
        weakestStage: weakest?.stage ?? 'unknown',
        weakestScore: weakest?.summary?.score ?? 0,
        criticalFindings,
        topInsight: weakest?.summary?.headline ?? 'Your funnel has room for improvement',
      });
    }

    const sequenceId = `seq_${crypto.randomUUID()}`;
    const response: TriggerFollowupResponse = {
      scheduled: !!lead.email,
      sequenceId,
      firstMessageAt: lead.email ? new Date(Date.now() + 45 * 1000).toISOString() : null,
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
