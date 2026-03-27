import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { generateInitialMessage } from '@/lib/ai/sales-agent';
import type { StartChatResponse, ApiError } from '@/../contracts/api';
import { writeVaultEvent } from '@/lib/vault/event-writer';
import type {
  DbScan,
  DbLead,
  DbFunnelStage,
  DbScreenshot,
  DbConversation,
  DbMessage,
} from '@/lib/db/types';
import { buildScanResult } from '@/lib/db/mappers';

// ============================================================
// POST /api/chat/start/[scanId]
// Starts a new AI Sales Agent conversation for a given scan.
// Returns a conversationId, SSE stream URL, and a contextual initial message.
// ============================================================

const BodySchema = z.object({
  scanId: z.string().min(1, 'Scan ID is required'),
  leadId: z.string().min(1, 'Lead ID is required'),
});

const ParamsSchema = z.object({
  scanId: z.string().min(1, 'Scan ID is required in URL'),
});

// --------------- Route Handler ---------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<NextResponse<StartChatResponse | ApiError>> {
  try {
    const resolvedParams = await params;

    const paramsParsed = ParamsSchema.safeParse(resolvedParams);
    if (!paramsParsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              paramsParsed.error.issues[0]?.message ??
              'A valid scan ID is required in the URL.',
            details: paramsParsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();

    const bodyParsed = BodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              bodyParsed.error.issues[0]?.message ?? 'Invalid request body',
            details: bodyParsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { scanId } = paramsParsed.data;
    const { leadId } = bodyParsed.data;

    const supabase = createServiceClient();

    // Fetch the scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single<DbScan>();

    if (scanError || !scan) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Scan ${scanId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single<DbLead>();

    if (leadError || !lead) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Lead ${leadId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Check if an active conversation already exists for this scan+lead pair
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('scan_id', scanId)
      .eq('lead_id', leadId)
      .in('status', ['active', 'nurturing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<DbConversation>();

    if (existingConversation) {
      // Fetch the initial assistant message for the existing conversation
      const { data: firstMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', existingConversation.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle<DbMessage>();

      const response: StartChatResponse = {
        conversationId: existingConversation.id,
        streamUrl: `/api/chat/stream/${existingConversation.id}`,
        initialMessage: firstMessage?.content ?? '',
      };

      console.log(
        `[chat/start] Returning existing conversation for scanId=${scanId}, leadId=${leadId} → conversationId=${existingConversation.id}`
      );

      return NextResponse.json(response, { status: 200 });
    }

    // Build ScanResult from DB data for the sales agent
    const [stagesResult, screenshotsResult] = await Promise.all([
      supabase
        .from('funnel_stages')
        .select('*')
        .eq('scan_id', scanId)
        .returns<DbFunnelStage[]>(),
      supabase
        .from('screenshots')
        .select('*')
        .eq('scan_id', scanId)
        .order('created_at', { ascending: true })
        .returns<DbScreenshot[]>(),
    ]);

    const stagesData = stagesResult.data ?? [];
    const screenshotsData = screenshotsResult.data ?? [];

    const scanResult = buildScanResult(scan, stagesData, screenshotsData);

    // Generate the initial contextual message
    const initialMessage = generateInitialMessage({
      scanResult,
      businessName: lead.business_name,
    });

    // Create conversation record
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        scan_id: scanId,
        lead_id: leadId,
        status: 'active',
      })
      .select('*')
      .single<DbConversation>();

    if (convError || !conversation) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to create conversation.',
            details:
              process.env.NODE_ENV === 'development'
                ? String(convError)
                : undefined,
          },
        },
        { status: 500 }
      );
    }

    writeVaultEvent({
      type: 'conversation_started',
      scanId,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      businessName: lead.business_name,
      websiteUrl: scan.website_url,
      chatChannel: 'web',
    });

    // Store the initial assistant message
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      channel: 'web',
      role: 'assistant',
      content: initialMessage,
    });

    if (msgError) {
      console.error(
        '[chat/start] Failed to store initial message:',
        msgError
      );
    }

    console.log(
      `[chat/start] Created conversation for scanId=${scanId}, leadId=${leadId} → conversationId=${conversation.id}`
    );

    const response: StartChatResponse = {
      conversationId: conversation.id,
      streamUrl: `/api/chat/stream/${conversation.id}`,
      initialMessage,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('[chat/start] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to start the conversation. Please try again.',
          details:
            process.env.NODE_ENV === 'development' ? String(err) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
