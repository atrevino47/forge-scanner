// POST /api/cron/followup-sender
// Cron job: processes pending follow-up emails via Resend.
//
// Queries the followups table for rows where status='pending' and scheduled_at <= now().
// For each pending follow-up:
//   1. Check if lead has booked — if yes, cancel remaining sequence
//   2. Fetch scan results for email personalization context
//   3. Generate email content via Claude Sonnet using position-specific prompts
//   4. Send via Resend
//   5. Update follow-up status in DB
//
// Designed to run every 30 seconds via Vercel Cron or QStash.

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/db/client';
import { buildScanResult } from '@/lib/db/mappers';
import { getEmailFollowupPrompt, type SequencePosition } from '@/lib/prompts/email-followup';
import { analyzeWithSonnet } from '@/lib/ai/client';
import { extractJSON } from '@/lib/ai/client';
import type { ApiError } from '@/../contracts/api';
import type { DbFollowup, DbScan, DbLead, DbFunnelStage, DbScreenshot } from '@/lib/db/types';
import { renderFollowupEmail } from '@/lib/followup/email-template';

const BATCH_SIZE = 10; // Max follow-ups to process per cron invocation
const FROM_EMAIL = 'Forge <insights@forgewith.ai>';
const CALCOM_URL = process.env.NEXT_PUBLIC_CALCOM_EMBED_URL || 'https://cal.com/forge';

interface CronFollowupResult {
  processed: number;
  sent: number;
  cancelled: number;
  errors: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<CronFollowupResult | ApiError>> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing cron secret' } },
        { status: 401 },
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: { code: 'CONFIG_ERROR', message: 'RESEND_API_KEY not configured' } },
        { status: 500 },
      );
    }

    const resend = new Resend(resendKey);
    const supabase = createServiceClient();

    // Query pending follow-ups that are due
    const { data: pendingFollowups, error: queryError } = await supabase
      .from('followups')
      .select('*')
      .eq('status', 'pending')
      .eq('channel', 'email')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(BATCH_SIZE)
      .returns<DbFollowup[]>();

    if (queryError) {
      console.error('[followup-sender] Query failed:', queryError.message);
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Failed to query pending follow-ups' } },
        { status: 500 },
      );
    }

    if (!pendingFollowups || pendingFollowups.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, cancelled: 0, errors: 0 });
    }

    const result: CronFollowupResult = { processed: 0, sent: 0, cancelled: 0, errors: 0 };

    for (const followup of pendingFollowups) {
      result.processed++;

      try {
        await processFollowup(followup, supabase, resend);
        result.sent++;
      } catch (error) {
        if (error instanceof FollowupCancelled) {
          result.cancelled++;
        } else {
          result.errors++;
          console.error(`[followup-sender] Failed to process ${followup.id}:`, error);

          // Mark as failed so we don't retry indefinitely
          await supabase
            .from('followups')
            .update({ status: 'failed', sent_at: new Date().toISOString() })
            .eq('id', followup.id);
        }
      }
    }

    console.log(`[followup-sender] Processed: ${result.processed}, Sent: ${result.sent}, Cancelled: ${result.cancelled}, Errors: ${result.errors}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[followup-sender] Fatal error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Cron followup-sender failed', details: error instanceof Error ? error.message : undefined } },
      { status: 500 },
    );
  }
}

// ============================================================
// Process a single follow-up
// ============================================================

class FollowupCancelled extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'FollowupCancelled';
  }
}

async function processFollowup(
  followup: DbFollowup,
  supabase: ReturnType<typeof createServiceClient>,
  resend: Resend,
): Promise<void> {
  // Step 1: Check if lead has booked — cancel if so
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('lead_id', followup.lead_id)
    .in('status', ['scheduled', 'completed'])
    .limit(1);

  if (bookings && bookings.length > 0) {
    // Lead has booked — cancel this and all remaining follow-ups in the sequence
    await supabase
      .from('followups')
      .update({ status: 'failed', content: 'Cancelled: lead booked' })
      .eq('sequence_id', followup.sequence_id)
      .eq('status', 'pending');

    throw new FollowupCancelled('Lead has booked');
  }

  // Step 2: Fetch lead and scan data
  const [leadResult, scanResult] = await Promise.all([
    supabase.from('leads').select('*').eq('id', followup.lead_id).single<DbLead>(),
    followup.scan_id
      ? supabase.from('scans').select('*').eq('id', followup.scan_id).single<DbScan>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const lead = leadResult.data;
  if (!lead || !lead.email) {
    throw new Error('Lead not found or has no email');
  }

  // Step 3: Build scan result context for email generation
  let scanContext = null;
  if (scanResult?.data) {
    const scan = scanResult.data;
    const [stagesResult, screenshotsResult] = await Promise.all([
      supabase.from('funnel_stages').select('*').eq('scan_id', scan.id).returns<DbFunnelStage[]>(),
      supabase.from('screenshots').select('*').eq('scan_id', scan.id).returns<DbScreenshot[]>(),
    ]);

    scanContext = buildScanResult(
      scan,
      stagesResult.data ?? [],
      screenshotsResult.data ?? [],
    );
  }

  // Step 4: Generate email content via AI
  const position = followup.sequence_step as SequencePosition;

  if (!scanContext) {
    throw new Error('Cannot generate follow-up email without scan context');
  }

  const prompt = getEmailFollowupPrompt(
    scanContext,
    position,
    lead.business_name ?? scanContext.websiteUrl,
    lead.full_name,
    CALCOM_URL,
  );

  const aiResponse = await analyzeWithSonnet({
    systemPrompt: 'You are a senior marketing strategist at Forge (forgewith.ai). Generate follow-up emails that feel personal, data-driven, and consultative. Return ONLY valid JSON.',
    userPrompt: prompt,
    maxTokens: 1024,
  });
  const emailContent = extractJSON<{ subject: string; body: string }>(aiResponse);

  if (!emailContent || !emailContent.subject || !emailContent.body) {
    throw new Error('AI failed to generate valid email content');
  }

  // Step 5: Render branded HTML template and send via Resend
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai';
  const scanUrl = followup.scan_id ? `${appUrl}/scan/${followup.scan_id}` : undefined;

  const html = renderFollowupEmail({
    subject: emailContent.subject,
    body: emailContent.body,
    position,
    businessName: lead.business_name ?? scanContext.websiteUrl,
    calcomUrl: CALCOM_URL,
    scanUrl,
  });

  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: lead.email,
    subject: emailContent.subject,
    html,
    text: emailContent.body,
    tags: [
      { name: 'sequence_id', value: followup.sequence_id },
      { name: 'sequence_step', value: String(followup.sequence_step) },
      { name: 'scan_id', value: followup.scan_id ?? '' },
    ],
  });

  if (sendError) {
    throw new Error(`Resend send failed: ${sendError.message}`);
  }

  // Step 6: Update follow-up status
  await supabase
    .from('followups')
    .update({
      status: 'sent',
      content: JSON.stringify(emailContent),
      sent_at: new Date().toISOString(),
    })
    .eq('id', followup.id);

  console.log(`[followup-sender] Sent step ${position} email to ${lead.email} (sequence ${followup.sequence_id})`);
}
