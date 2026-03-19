import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { streamWithSonnet } from '@/lib/ai/client';
import { buildSalesAgentSystemPrompt } from '@/lib/ai/sales-agent';
import type { ApiError } from '@/../contracts/api';
import type { ChatSSEEvent } from '@/../contracts/events';
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
// GET /api/chat/stream/[convId]
// Server-Sent Events endpoint for AI Sales Agent responses.
// Streams events: typing_start → token (xN) → typing_end → message_complete
// ============================================================

const ParamsSchema = z.object({
  convId: z.string().min(1, 'Conversation ID is required'),
});

// --------------- SSE Helpers ---------------

function formatSSE(event: ChatSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// --------------- Route Handler ---------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ convId: string }> }
): Promise<Response | NextResponse<ApiError>> {
  try {
    const resolvedParams = await params;

    const parsed = ParamsSchema.safeParse(resolvedParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              parsed.error.issues[0]?.message ??
              'A valid conversation ID is required.',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { convId } = parsed.data;
    const supabase = createServiceClient();

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single<DbConversation>();

    if (convError || !conversation) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Conversation ${convId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Fetch the scan for this conversation
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', conversation.scan_id)
      .single<DbScan>();

    if (scanError || !scan) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to retrieve scan data for this conversation.',
            details:
              process.env.NODE_ENV === 'development'
                ? String(scanError)
                : undefined,
          },
        },
        { status: 500 }
      );
    }

    // Fetch lead, funnel stages, screenshots, and messages in parallel
    const [leadResult, stagesResult, screenshotsResult, messagesResult] =
      await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('id', conversation.lead_id)
          .single<DbLead>(),
        supabase
          .from('funnel_stages')
          .select('*')
          .eq('scan_id', conversation.scan_id)
          .returns<DbFunnelStage[]>(),
        supabase
          .from('screenshots')
          .select('*')
          .eq('scan_id', conversation.scan_id)
          .order('created_at', { ascending: true })
          .returns<DbScreenshot[]>(),
        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true })
          .returns<DbMessage[]>(),
      ]);

    if (leadResult.error || !leadResult.data) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to retrieve lead data for this conversation.',
            details:
              process.env.NODE_ENV === 'development'
                ? String(leadResult.error)
                : undefined,
          },
        },
        { status: 500 }
      );
    }

    const lead = leadResult.data;
    const stagesData = stagesResult.data ?? [];
    const screenshotsData = screenshotsResult.data ?? [];
    const messagesData = messagesResult.data ?? [];

    // Build ScanResult for the system prompt
    const scanResult = buildScanResult(scan, stagesData, screenshotsData);

    // Build the system prompt
    const systemPrompt = buildSalesAgentSystemPrompt({
      scanResult,
      businessName: lead.business_name,
      leadName: lead.full_name,
    });

    // Convert messages to the format streamWithSonnet expects
    const chatMessages: Array<{
      role: 'user' | 'assistant';
      content: string;
    }> = messagesData
      .filter(
        (m): m is DbMessage & { role: 'user' | 'assistant' } =>
          m.role === 'user' || m.role === 'assistant'
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // Track client disconnect via request.signal
    const abortSignal = request.signal;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = '';
        let aborted = false;

        // Listen for client disconnect
        const onAbort = () => {
          aborted = true;
        };
        abortSignal.addEventListener('abort', onAbort);

        try {
          // Beat 1 — typing indicator starts
          const typingStartEvent: ChatSSEEvent = { type: 'typing_start' };
          controller.enqueue(encoder.encode(formatSSE(typingStartEvent)));

          // Stream tokens from the AI
          const tokenStream = streamWithSonnet({
            systemPrompt,
            messages: chatMessages,
            maxTokens: 2048,
          });

          for await (const token of tokenStream) {
            if (aborted) {
              break;
            }

            fullResponse += token;

            const tokenEvent: ChatSSEEvent = {
              type: 'token',
              content: token,
            };
            controller.enqueue(encoder.encode(formatSSE(tokenEvent)));
          }

          if (aborted) {
            // Client disconnected — still store what we have if any content was generated
            if (fullResponse.length > 0) {
              await supabase.from('messages').insert({
                conversation_id: convId,
                channel: 'web',
                role: 'assistant',
                content: fullResponse,
              });
            }
            controller.close();
            return;
          }

          // Beat 2 — typing indicator ends
          const typingEndEvent: ChatSSEEvent = { type: 'typing_end' };
          controller.enqueue(encoder.encode(formatSSE(typingEndEvent)));

          // Store the complete assistant message in DB
          const { data: storedMessage } = await supabase
            .from('messages')
            .insert({
              conversation_id: convId,
              channel: 'web',
              role: 'assistant',
              content: fullResponse,
            })
            .select('id')
            .single<{ id: string }>();

          const messageId = storedMessage?.id ?? crypto.randomUUID();

          // Beat 3 — message complete
          const completeEvent: ChatSSEEvent = {
            type: 'message_complete',
            messageId,
            content: fullResponse,
          };
          controller.enqueue(encoder.encode(formatSSE(completeEvent)));

          console.log(
            `[chat/stream] Completed stream for convId=${convId} → messageId=${messageId}, ` +
              `tokens=${fullResponse.length} chars`
          );
        } catch (streamErr) {
          console.error('[chat/stream] Streaming error:', streamErr);

          // Send error event to the client
          const errorEvent: ChatSSEEvent = {
            type: 'error',
            message: 'An error occurred while generating the response.',
          };
          controller.enqueue(encoder.encode(formatSSE(errorEvent)));
        } finally {
          abortSignal.removeEventListener('abort', onAbort);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[chat/stream] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to open chat stream.',
          details:
            process.env.NODE_ENV === 'development' ? String(err) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
