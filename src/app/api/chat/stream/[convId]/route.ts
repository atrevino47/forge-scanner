import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { streamWithSonnet } from '@/lib/ai/client';
import { buildSalesAgentSystemPrompt } from '@/lib/ai/sales-agent';
import { loadPlaybookSection } from '@/lib/ai/playbook-loader';
import type { ObjectionType } from '@/lib/ai/objection-classifier';
import type { ApiError } from '@/../contracts/api';
import type { ChatSSEEvent } from '@/../contracts/events';
import type { Annotation } from '@/../contracts/types';
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

    // Check if the latest user message has an objection classification
    const latestUserMessage = [...messagesData]
      .reverse()
      .find((m) => m.role === 'user');

    let activeObjectionContext: string | null = null;
    if (latestUserMessage?.metadata) {
      const meta = latestUserMessage.metadata as Record<string, unknown>;
      const objectionType = meta.objection_type as ObjectionType | undefined;
      if (objectionType && objectionType !== 'none' && objectionType !== 'ready_to_book') {
        activeObjectionContext = loadPlaybookSection(objectionType);
      }
    }

    // Count user messages for adaptive intensity
    const messageCount = messagesData.filter((m) => m.role === 'user').length;

    // Build ScanResult for the system prompt
    const scanResult = buildScanResult(scan, stagesData, screenshotsData);

    // Build the system prompt
    const systemPrompt = buildSalesAgentSystemPrompt({
      scanResult,
      businessName: lead.business_name,
      leadName: lead.full_name,
      activeObjectionContext,
      messageCount,
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

          // Stream tokens from the AI with unified marker parsing
          // Detects [DATA_CARD:screenshotId] and [CALCOM_EMBED] markers,
          // strips them from displayed text, and emits corresponding SSE events.
          const tokenStream = streamWithSonnet({
            systemPrompt,
            messages: chatMessages,
            maxTokens: 2048,
          });

          let tokenBuffer = '';
          let calcomEmbedEmitted = false;
          const calcomUrl = process.env.NEXT_PUBLIC_CALCOM_EMBED_URL ?? '';

          const sendTokenText = (text: string) => {
            if (text) {
              controller.enqueue(
                encoder.encode(formatSSE({ type: 'token', content: text }))
              );
            }
          };

          // Process buffer: extract known markers, flush safe text
          const processBuffer = async () => {
            while (true) {
              const bracketOpen = tokenBuffer.indexOf('[');

              if (bracketOpen === -1) {
                // No potential marker — flush everything
                sendTokenText(tokenBuffer);
                tokenBuffer = '';
                return;
              }

              const bracketClose = tokenBuffer.indexOf(']', bracketOpen);

              if (bracketClose === -1) {
                // Incomplete bracket — flush text before '[', hold the rest
                sendTokenText(tokenBuffer.substring(0, bracketOpen));
                tokenBuffer = tokenBuffer.substring(bracketOpen);
                return;
              }

              // Complete bracket pair — check if it's a known marker
              const markerCandidate = tokenBuffer.substring(bracketOpen, bracketClose + 1);
              const dataCardMatch = markerCandidate.match(/^\[DATA_CARD:([^\]]+)\]$/);

              if (dataCardMatch) {
                // Flush text before marker
                sendTokenText(tokenBuffer.substring(0, bracketOpen));

                // Emit data_card event with annotations from DB
                const screenshotId = dataCardMatch[1];
                try {
                  const { data: screenshot } = await supabase
                    .from('screenshots')
                    .select('annotations')
                    .eq('id', screenshotId)
                    .single<{ annotations: Annotation[] }>();

                  if (screenshot) {
                    const dataCardEvent: ChatSSEEvent = {
                      type: 'data_card',
                      screenshotId,
                      annotations: screenshot.annotations ?? [],
                    };
                    controller.enqueue(encoder.encode(formatSSE(dataCardEvent)));
                  }
                } catch {
                  // Invalid screenshotId — skip silently
                }

                tokenBuffer = tokenBuffer.substring(bracketClose + 1);
                continue;
              }

              if (markerCandidate === '[CALCOM_EMBED]') {
                // Flush text before marker
                sendTokenText(tokenBuffer.substring(0, bracketOpen));

                // Emit calcom_embed event (once per conversation)
                if (!calcomEmbedEmitted && calcomUrl) {
                  const calcomEvent: ChatSSEEvent = {
                    type: 'calcom_embed',
                    url: calcomUrl,
                  };
                  controller.enqueue(encoder.encode(formatSSE(calcomEvent)));
                  calcomEmbedEmitted = true;
                }

                tokenBuffer = tokenBuffer.substring(bracketClose + 1);
                continue;
              }

              // Not a known marker — flush through the bracket as normal text
              sendTokenText(tokenBuffer.substring(0, bracketClose + 1));
              tokenBuffer = tokenBuffer.substring(bracketClose + 1);
            }
          };

          for await (const token of tokenStream) {
            if (aborted) {
              break;
            }

            fullResponse += token;
            tokenBuffer += token;
            await processBuffer();
          }

          // Flush any remaining buffer content
          sendTokenText(tokenBuffer);
          tokenBuffer = '';

          // Strip marker text from the stored message
          const cleanResponse = fullResponse
            .replace(/\[DATA_CARD:[^\]]+\]/g, '')
            .replace(/\[CALCOM_EMBED\]/g, '');

          if (aborted) {
            // Client disconnected — still store what we have if any content was generated
            if (cleanResponse.length > 0) {
              await supabase.from('messages').insert({
                conversation_id: convId,
                channel: 'web',
                role: 'assistant',
                content: cleanResponse,
              });
            }
            controller.close();
            return;
          }

          // Beat 2 — typing indicator ends
          const typingEndEvent: ChatSSEEvent = { type: 'typing_end' };
          controller.enqueue(encoder.encode(formatSSE(typingEndEvent)));

          // Store the complete assistant message in DB (markers stripped)
          const { data: storedMessage } = await supabase
            .from('messages')
            .insert({
              conversation_id: convId,
              channel: 'web',
              role: 'assistant',
              content: cleanResponse,
            })
            .select('id')
            .single<{ id: string }>();

          const messageId = storedMessage?.id ?? crypto.randomUUID();

          // Beat 3 — message complete
          const completeEvent: ChatSSEEvent = {
            type: 'message_complete',
            messageId,
            content: cleanResponse,
          };
          controller.enqueue(encoder.encode(formatSSE(completeEvent)));

          console.log(
            `[chat/stream] Completed stream for convId=${convId} → messageId=${messageId}, ` +
              `tokens=${cleanResponse.length} chars`
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
