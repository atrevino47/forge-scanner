// /src/lib/ai/client.ts
// Anthropic API client with Sonnet/Haiku routing and vision support

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Model constants — single source of truth for model IDs
const SONNET_MODEL = 'claude-sonnet-4-20250514';
const HAIKU_MODEL = 'claude-3-5-haiku-20241022';

// ============================================================
// Sonnet — vision-capable analysis, strategic reasoning, writing
// ============================================================

export interface SonnetParams {
  systemPrompt: string;
  userPrompt: string;
  images?: Array<{
    type: 'base64';
    media_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
    data: string;
  }>;
  maxTokens?: number;
}

export async function analyzeWithSonnet(params: SonnetParams): Promise<string> {
  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

  if (params.images) {
    for (const img of params.images) {
      content.push({
        type: 'image' as const,
        source: {
          type: img.type,
          media_type: img.media_type,
          data: img.data,
        },
      });
    }
  }

  content.push({ type: 'text' as const, text: params.userPrompt });

  const response = await client.messages.create({
    model: SONNET_MODEL,
    max_tokens: params.maxTokens ?? 4096,
    system: params.systemPrompt,
    messages: [{ role: 'user', content }],
  });

  const firstBlock = response.content[0];
  return firstBlock.type === 'text' ? firstBlock.text : '';
}

// ============================================================
// Haiku — fast technical checks, pattern matching, classification
// ============================================================

export interface HaikuParams {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function analyzeWithHaiku(params: HaikuParams): Promise<string> {
  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: params.maxTokens ?? 2048,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userPrompt }],
  });

  const firstBlock = response.content[0];
  return firstBlock.type === 'text' ? firstBlock.text : '';
}

// ============================================================
// Streaming Sonnet — for AI Sales Agent chat responses
// ============================================================

export interface StreamParams {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

export async function* streamWithSonnet(params: StreamParams): AsyncGenerator<string> {
  const stream = client.messages.stream({
    model: SONNET_MODEL,
    max_tokens: params.maxTokens ?? 2048,
    system: params.systemPrompt,
    messages: params.messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

// ============================================================
// JSON extraction helper — safely parse AI response JSON
// ============================================================

export function extractJSON<T>(raw: string): T {
  // Try direct parse first
  try {
    return JSON.parse(raw) as T;
  } catch {
    // AI sometimes wraps JSON in markdown code fences
  }

  // Extract from ```json ... ``` blocks
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1]) as T;
  }

  // Extract first { ... } or [ ... ] block
  const objectMatch = raw.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    return JSON.parse(objectMatch[1]) as T;
  }

  const arrayMatch = raw.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[1]) as T;
  }

  throw new Error('Failed to extract JSON from AI response');
}
