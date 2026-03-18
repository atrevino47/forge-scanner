// POST /api/followup/webhook/calcom
// Receives booking webhooks from Cal.com and updates lead / booking / conversation state

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError } from '@/../contracts/api';
import type { BookingSource } from '@/../contracts/types';
import { apiError, validateBody } from '@/lib/api-utils';
import { createServiceClient } from '@/lib/db/client';
import type { DbLead, DbBooking, DbScan } from '@/lib/db/types';

// ── Zod schema ─────────────────────────────────────────────────
const calcomWebhookSchema = z.object({
  triggerEvent: z.enum([
    'BOOKING_CREATED',
    'BOOKING_CANCELLED',
    'BOOKING_RESCHEDULED',
  ]),
  payload: z.object({
    uid: z.string(),
    eventTypeId: z.number(),
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    attendees: z.array(
      z.object({
        email: z.string().email(),
        name: z.string(),
        timeZone: z.string(),
      }),
    ),
    metadata: z.record(z.string(), z.string()).optional(),
  }),
});

type CalcomPayload = z.infer<typeof calcomWebhookSchema>;

// ── Response type ──────────────────────────────────────────────
interface CalcomWebhookAck {
  processed: true;
  bookingId: string;
}

// ── Helpers ────────────────────────────────────────────────────

const VALID_BOOKING_SOURCES: ReadonlySet<string> = new Set<BookingSource>([
  'banner_cta',
  'ai_agent',
  'results_cta',
  'email_link',
  'sms_link',
  'whatsapp_link',
  'voice_call',
]);

function toBookingSource(value: string | undefined): BookingSource {
  if (value && VALID_BOOKING_SOURCES.has(value)) {
    return value as BookingSource;
  }
  return 'banner_cta';
}

// ── Route handler ──────────────────────────────────────────────

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CalcomWebhookAck | ApiError>> {
  // ── 1. Verify webhook secret ─────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CALCOM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[calcom-webhook] CALCOM_WEBHOOK_SECRET env var is not set');
    return apiError('INTERNAL', 'Webhook secret not configured', 500);
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return apiError('UNAUTHORIZED', 'Invalid webhook authorization', 401);
  }

  // ── 2. Parse & validate body ─────────────────────────────────
  let data: CalcomPayload;
  try {
    data = await validateBody(request, calcomWebhookSchema);
  } catch (thrown: unknown) {
    return thrown as NextResponse<ApiError>;
  }

  const { triggerEvent, payload } = data;
  const supabase = createServiceClient();

  try {
    // ── BOOKING_CREATED ──────────────────────────────────────
    if (triggerEvent === 'BOOKING_CREATED') {
      return await handleBookingCreated(supabase, payload);
    }

    // ── BOOKING_CANCELLED ────────────────────────────────────
    if (triggerEvent === 'BOOKING_CANCELLED') {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('cal_event_id', payload.uid);

      return NextResponse.json(
        { processed: true, bookingId: payload.uid },
        { status: 200 },
      );
    }

    // ── BOOKING_RESCHEDULED ──────────────────────────────────
    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      await supabase
        .from('bookings')
        .update({ scheduled_at: payload.startTime })
        .eq('cal_event_id', payload.uid);

      return NextResponse.json(
        { processed: true, bookingId: payload.uid },
        { status: 200 },
      );
    }

    // Should be unreachable thanks to the Zod enum, but satisfy TS exhaustiveness
    return apiError('INVALID_INPUT', `Unknown event: ${triggerEvent as string}`, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[calcom-webhook] Unhandled error:', message);
    return apiError('INTERNAL', 'Failed to process Cal.com webhook', 500, message);
  }
}

// ── BOOKING_CREATED handler ────────────────────────────────────

async function handleBookingCreated(
  supabase: ReturnType<typeof createServiceClient>,
  payload: CalcomPayload['payload'],
): Promise<NextResponse<CalcomWebhookAck | ApiError>> {
  const metadata = payload.metadata;
  const attendeeEmail = payload.attendees[0]?.email;

  if (!attendeeEmail) {
    return apiError(
      'INVALID_INPUT',
      'No attendee email found in webhook payload',
      400,
    );
  }

  // ── Find lead by email ──────────────────────────────────────
  let lead: DbLead | null = null;

  const { data: emailLead } = await supabase
    .from('leads')
    .select('*')
    .eq('email', attendeeEmail)
    .single<DbLead>();

  lead = emailLead;

  // ── Fallback: find by metadata.leadId ────────────────────────
  if (!lead && metadata?.leadId) {
    const { data: metaLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', metadata.leadId)
      .single<DbLead>();

    lead = metaLead;
  }

  if (!lead) {
    return apiError(
      'NOT_FOUND',
      `No lead found for email ${attendeeEmail}`,
      404,
    );
  }

  // ── Resolve scanId ──────────────────────────────────────────
  let scanId: string | null = metadata?.scanId ?? null;

  if (!scanId) {
    const { data: recentScan } = await supabase
      .from('scans')
      .select('id')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single<Pick<DbScan, 'id'>>();

    scanId = recentScan?.id ?? null;
  }

  // ── Create booking record ───────────────────────────────────
  const bookingSource = toBookingSource(metadata?.source);

  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      lead_id: lead.id,
      scan_id: scanId,
      cal_event_id: payload.uid,
      scheduled_at: payload.startTime,
      status: 'scheduled' as DbBooking['status'],
      source: bookingSource,
    })
    .select('id')
    .single<Pick<DbBooking, 'id'>>();

  if (insertError || !booking) {
    console.error('[calcom-webhook] Failed to insert booking:', insertError);
    return apiError('INTERNAL', 'Failed to create booking record', 500);
  }

  // ── Update active conversations to 'booked' ─────────────────
  await supabase
    .from('conversations')
    .update({ status: 'booked' })
    .eq('lead_id', lead.id)
    .eq('status', 'active');

  // ── Cancel pending followups ─────────────────────────────────
  await supabase
    .from('followups')
    .update({ status: 'failed' })
    .eq('lead_id', lead.id)
    .eq('status', 'pending');

  return NextResponse.json(
    { processed: true, bookingId: booking.id },
    { status: 200 },
  );
}
