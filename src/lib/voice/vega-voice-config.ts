/**
 * Vega voice-agent configuration — ElevenLabs Conversational AI (Agents).
 *
 * Rationale: Adrian priority on Vega is "amazing experience, not cost-optimized"
 * (recommendation documented in kova-2026-04-23-scanner-reprompting-analysis.md).
 * ElevenLabs Agents was selected over Vapi / Retell / OpenAI Realtime primarily
 * for voice quality — the single biggest predictor of whether a prospect engages
 * past the greeting. Config below is the *wire* into ElevenLabs; Vega's brain
 * (CLOSER framework, objection handling, scan-data injection) lives in
 * sales-agent-system.ts and is loaded into the Agent's system-prompt slot.
 *
 * Never inline secrets. Every field reads from env.
 */

export interface VegaVoiceConfig {
  provider: 'elevenlabs';
  agentId: string;
  voiceId: string;
  /** LLM backend the ElevenLabs Agent routes to. Swappable without voice changes. */
  llmModel: 'gpt-4o' | 'claude-4.6-sonnet' | 'claude-4.7-opus' | 'gemini-2.0-flash';
  /** Tool webhook endpoint for scan-data / cal-url / data-card injection. */
  toolWebhookUrl: string;
  /** Fallback path when live voice session errors. UI drops to text Vega. */
  fallbackToText: boolean;
  /** Hard ceiling on per-session minutes (soft cost guardrail). */
  maxSessionMinutes: number;
}

export interface VegaVoiceConfigMissing {
  provider: 'none';
  reason: string;
}

export type VegaVoiceConfigResult = VegaVoiceConfig | VegaVoiceConfigMissing;

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // ElevenLabs "Sarah" — warm, American, mid-30s. Env-swappable.
const DEFAULT_LLM: VegaVoiceConfig['llmModel'] = 'claude-4.6-sonnet';
const DEFAULT_MAX_SESSION_MINUTES = 12;

export function getVegaVoiceConfig(): VegaVoiceConfigResult {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId) {
    return {
      provider: 'none',
      reason: 'ELEVENLABS_AGENT_ID is not set — falling back to text-only Vega.',
    };
  }
  if (!apiKey) {
    return {
      provider: 'none',
      reason: 'ELEVENLABS_API_KEY is not set — falling back to text-only Vega.',
    };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgewith.ai';

  return {
    provider: 'elevenlabs',
    agentId,
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID,
    llmModel:
      (process.env.VEGA_LLM_MODEL as VegaVoiceConfig['llmModel'] | undefined) ??
      DEFAULT_LLM,
    toolWebhookUrl: `${base.replace(/\/$/, '')}/api/voice/vega-tool-webhook`,
    fallbackToText: true,
    maxSessionMinutes: Number(
      process.env.VEGA_MAX_SESSION_MINUTES ?? DEFAULT_MAX_SESSION_MINUTES,
    ),
  };
}

/**
 * Tools Vega can invoke during a live voice session. Keep names stable —
 * they're referenced by the ElevenLabs Agent config on their dashboard too.
 */
export const VEGA_TOOLS = [
  {
    name: 'get_scan_summary',
    description:
      'Fetch the current scan summary: URL, overall health score, biggest-leak dollar range, top 3 findings.',
    input_schema: {
      type: 'object',
      properties: { scan_id: { type: 'string' } },
      required: ['scan_id'],
    },
  },
  {
    name: 'get_biggest_leak',
    description:
      'Fetch the single Money Model layer with the largest 12-month leak plus the callout sentence.',
    input_schema: {
      type: 'object',
      properties: { scan_id: { type: 'string' } },
      required: ['scan_id'],
    },
  },
  {
    name: 'get_cal_url',
    description:
      'Return the personalized Cal.com booking URL with the scan_id as UTM so the prospect lands on the right timeslot page.',
    input_schema: {
      type: 'object',
      properties: { scan_id: { type: 'string' } },
      required: ['scan_id'],
    },
  },
] as const;

export type VegaToolName = (typeof VEGA_TOOLS)[number]['name'];
