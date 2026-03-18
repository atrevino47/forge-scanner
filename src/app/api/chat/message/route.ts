import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import type { SendMessageResponse, ApiError } from '@/../contracts/api';
import type { Channel } from '@/../contracts/types';
import type { DbConversation, DbMessage } from '@/lib/db/types';

// ============================================================
// POST /api/chat/message
// Sends a user message in an existing AI Sales Agent conversation.
// Returns a messageId and an SSE stream URL for the AI's response.
// ============================================================

const VALID_CHANNELS: readonly [Channel, ...Channel[]] = [
  'web',
  'email',
  'sms',
  'whatsapp',
  'voice',
];

const SendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(5000, 'Message content must be 5000 characters or fewer'),
  channel: z.enum(VALID_CHANNELS).optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<SendMessageResponse | ApiError>> {
  try {
    const body: unknown = await request.json();

    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              parsed.error.issues[0]?.message ?? 'Invalid request body',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { conversationId, content, channel } = parsed.data;

    const supabase = createServiceClient();

    // Verify the conversation exists and is active
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single<DbConversation>();

    if (convError || !conversation) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Conversation ${conversationId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    const activeStatuses: DbConversation['status'][] = [
      'active',
      'nurturing',
    ];
    if (!activeStatuses.includes(conversation.status)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'This conversation is no longer active.',
          },
        },
        { status: 400 }
      );
    }

    // Store the user message
    const { data: userMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        channel: channel ?? 'web',
        role: 'user',
        content,
      })
      .select('*')
      .single<DbMessage>();

    if (msgError || !userMessage) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to store your message. Please try again.',
            details:
              process.env.NODE_ENV === 'development'
                ? String(msgError)
                : undefined,
          },
        },
        { status: 500 }
      );
    }

    console.log(
      `[chat/message] Stored message in conversationId=${conversationId}, ` +
        `channel=${channel ?? 'web'}, length=${content.length} → messageId=${userMessage.id}`
    );

    const response: SendMessageResponse = {
      messageId: userMessage.id,
      streamUrl: `/api/chat/stream/${conversationId}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('[chat/message] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to send your message. Please try again.',
          details:
            process.env.NODE_ENV === 'development' ? String(err) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
