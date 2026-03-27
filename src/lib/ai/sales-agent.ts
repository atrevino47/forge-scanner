// /src/lib/ai/sales-agent.ts
// AI Sales Agent — system prompt builder, initial message generator,
// and multi-channel follow-up content generation

import type { BlueprintData, Channel, FunnelStage, ScanResult } from '@/../../contracts/types';
import { analyzeWithSonnet, extractJSON } from './client';
import { buildFullSalesAgentPrompt } from '../prompts/sales-agent-system';
import { generateOpener } from '../prompts/sales-agent-openers';
import { getEmailFollowupPrompt, type SequencePosition } from '../prompts/email-followup';
import { getSMSFollowupPrompt } from '../prompts/sms-followup';
import { getWhatsAppFollowupPrompt, type WhatsAppSequencePosition } from '../prompts/whatsapp-followup';

// ============================================================
// Build the system prompt for the AI Sales Agent
// Signature matches what Backend already calls
// ============================================================

export function buildSalesAgentSystemPrompt(params: {
  scanResult: ScanResult;
  businessName?: string | null;
  leadName?: string | null;
  blueprint?: BlueprintData | null;
  channel?: Channel;
  activeObjectionContext?: string | null;
  messageCount?: number;
}): string {
  const biz = params.businessName || extractDomain(params.scanResult.websiteUrl);

  return buildFullSalesAgentPrompt({
    scanResult: params.scanResult,
    blueprint: params.blueprint,
    channel: params.channel ?? 'web',
    businessName: biz,
    leadName: params.leadName,
    calcomUrl: process.env.NEXT_PUBLIC_CALCOM_EMBED_URL,
    activeObjectionContext: params.activeObjectionContext,
    messageCount: params.messageCount,
  });
}

// ============================================================
// Generate the initial contextual message
// Signature matches what Backend already calls
// ============================================================

export function generateInitialMessage(params: {
  scanResult: ScanResult;
  businessName?: string | null;
  leadName?: string | null;
  channel?: Channel;
}): string {
  const biz = params.businessName || extractDomain(params.scanResult.websiteUrl);

  return generateOpener({
    scanResult: params.scanResult,
    channel: params.channel ?? 'web',
    businessName: biz,
    leadName: params.leadName,
    calcomUrl: process.env.NEXT_PUBLIC_CALCOM_EMBED_URL,
  });
}

// ============================================================
// Follow-up email generation
// ============================================================

export interface FollowupEmailResult {
  subject: string;
  body: string;
}

export async function generateFollowupEmail(
  scanResult: ScanResult,
  sequencePosition: SequencePosition,
  leadName?: string | null,
  businessName?: string | null,
  calcomUrl?: string,
): Promise<FollowupEmailResult> {
  const biz = businessName || extractDomain(scanResult.websiteUrl);
  const calLink = calcomUrl || process.env.NEXT_PUBLIC_CALCOM_EMBED_URL;

  const prompt = getEmailFollowupPrompt(
    scanResult,
    sequencePosition,
    biz,
    leadName,
    calLink,
  );

  const result = await analyzeWithSonnet({
    systemPrompt: prompt,
    userPrompt: `Generate the position ${sequencePosition} follow-up email for ${biz}. Return only the JSON.`,
    maxTokens: 2048,
  });

  try {
    const parsed = extractJSON<FollowupEmailResult>(result);
    return {
      subject: (parsed.subject || `Your funnel scan results for ${biz}`).slice(0, 200),
      body: parsed.body || result,
    };
  } catch (error) {
    console.error(`[sales-agent] Failed to parse email for position ${sequencePosition}:`, error);
    return buildFallbackEmail(scanResult, sequencePosition, biz, leadName, calLink);
  }
}

// ============================================================
// Follow-up SMS generation
// ============================================================

export interface FollowupSMSResult {
  message: string;
}

export async function generateFollowupSMS(
  scanResult: ScanResult,
  leadName?: string | null,
  businessName?: string | null,
  calcomUrl?: string,
): Promise<FollowupSMSResult> {
  const biz = businessName || extractDomain(scanResult.websiteUrl);
  const calLink = calcomUrl || process.env.NEXT_PUBLIC_CALCOM_EMBED_URL;

  const prompt = getSMSFollowupPrompt(scanResult, biz, calLink);

  const result = await analyzeWithSonnet({
    systemPrompt: prompt,
    userPrompt: `Generate the SMS follow-up message for ${biz}. Return only the JSON.`,
    maxTokens: 256,
  });

  try {
    const parsed = extractJSON<FollowupSMSResult>(result);
    // Hard-enforce 160 char limit
    return { message: (parsed.message || '').slice(0, 160) };
  } catch (error) {
    console.error('[sales-agent] Failed to parse SMS:', error);
    return buildFallbackSMS(scanResult, biz, calLink);
  }
}

// ============================================================
// Follow-up WhatsApp generation
// ============================================================

export interface FollowupWhatsAppResult {
  message: string;
}

export async function generateFollowupWhatsApp(
  scanResult: ScanResult,
  sequencePosition: WhatsAppSequencePosition,
  leadName?: string | null,
  businessName?: string | null,
  calcomUrl?: string,
): Promise<FollowupWhatsAppResult> {
  const biz = businessName || extractDomain(scanResult.websiteUrl);
  const calLink = calcomUrl || process.env.NEXT_PUBLIC_CALCOM_EMBED_URL;

  const prompt = getWhatsAppFollowupPrompt(
    scanResult,
    sequencePosition,
    biz,
    leadName,
    calLink,
  );

  const result = await analyzeWithSonnet({
    systemPrompt: prompt,
    userPrompt: `Generate the position ${sequencePosition} WhatsApp follow-up message for ${biz}. Return only the JSON.`,
    maxTokens: 512,
  });

  try {
    const parsed = extractJSON<FollowupWhatsAppResult>(result);
    return { message: parsed.message || result };
  } catch (error) {
    console.error(`[sales-agent] Failed to parse WhatsApp for position ${sequencePosition}:`, error);
    return buildFallbackWhatsApp(scanResult, sequencePosition, biz, leadName, calLink);
  }
}

// ============================================================
// Fallback builders
// ============================================================

function buildFallbackEmail(
  scanResult: ScanResult,
  position: SequencePosition,
  businessName: string,
  leadName?: string | null,
  calcomUrl?: string,
): FollowupEmailResult {
  const overallHealth = calculateOverallHealth(scanResult);
  const weakest = findWeakestStage(scanResult);
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage].toLowerCase() : 'funnel';
  const weakScore = weakest?.summary?.score ?? 0;
  const greeting = leadName ? `Hi ${leadName}` : 'Hi there';
  const calLine = calcomUrl ? `\n\nBook your free strategy call: ${calcomUrl}` : '';

  const subjects: Record<SequencePosition, string> = {
    1: `Your ${businessName} funnel scored ${overallHealth}/100 — here's what I found`,
    2: `Quick question about ${businessName}'s ${weakLabel}`,
    3: `Your ${businessName} scan results expire soon`,
  };

  const bodies: Record<SequencePosition, string> = {
    1: `${greeting},\n\nYour funnel scan for ${businessName} is ready. Overall score: ${overallHealth}/100.\n\nThe biggest opportunity is your ${weakLabel} (${weakScore}/100). I'd love to walk you through the full findings in a free 30-minute strategy call.${calLine}\n\nBest,\nForge Digital`,
    2: `${greeting},\n\nQuick thought — your ${weakLabel} scored ${weakScore}/100. That's the #1 area where ${businessName} is likely losing potential customers.\n\nI have a few strategy call slots this week if you want to go through the details.${calLine}\n\nBest,\nForge Digital`,
    3: `${greeting},\n\nJust a heads up — your ${businessName} scan results (including annotated screenshots and your blueprint) will expire in a few days.\n\nIf you'd like to discuss the findings before they're gone, grab a free strategy call.${calLine}\n\nEither way, hope the scan was useful.\n\nBest,\nForge Digital`,
  };

  return { subject: subjects[position], body: bodies[position] };
}

function buildFallbackSMS(
  scanResult: ScanResult,
  businessName: string,
  calcomUrl?: string,
): FollowupSMSResult {
  const weakest = findWeakestStage(scanResult);
  const weakScore = weakest?.summary?.score ?? 0;
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage].toLowerCase() : 'funnel';

  const base = `${businessName}: ${weakLabel} scored ${weakScore}/100.`;
  const cta = calcomUrl ? ` Free call: ${calcomUrl}` : ' Check your results.';
  return { message: `${base}${cta}`.slice(0, 160) };
}

function buildFallbackWhatsApp(
  scanResult: ScanResult,
  position: WhatsAppSequencePosition,
  businessName: string,
  leadName?: string | null,
  calcomUrl?: string,
): FollowupWhatsAppResult {
  const overallHealth = calculateOverallHealth(scanResult);
  const weakest = findWeakestStage(scanResult);
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage].toLowerCase() : 'funnel';
  const weakScore = weakest?.summary?.score ?? 0;
  const greeting = leadName ? `Hey ${leadName}` : 'Hey';
  const calLine = calcomUrl || '';

  const messages: Record<WhatsAppSequencePosition, string> = {
    1: `${greeting} — your funnel scan for *${businessName}* is ready.\n\nOverall score: *${overallHealth}/100*\nBiggest opportunity: *${weakLabel}* (${weakScore}/100)\n\nWant to go through the findings? ${calLine}`,
    2: `${greeting} — quick note about *${businessName}*'s scan. Your ${weakLabel} is the #1 area holding back conversions right now.\n\nHappy to walk through it: ${calLine}`,
    3: `${greeting} — your *${businessName}* scan results expire soon. Grab a free strategy call before they're gone: ${calLine}\n\nNo pressure — here if you need anything.`,
  };

  return { message: messages[position] };
}

// ============================================================
// Helpers
// ============================================================

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic Sources',
  landing: 'Landing Experience',
  capture: 'Lead Capture',
  offer: 'Offer & Conversion',
  followup: 'Follow-up & Retention',
};

function extractDomain(url: string): string {
  try {
    const hostname = new URL(
      url.startsWith('http') ? url : `https://${url}`,
    ).hostname;
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'your business';
  }
}

function calculateOverallHealth(scan: ScanResult): number {
  const weights: Record<FunnelStage, number> = {
    traffic: 0.15, landing: 0.30, capture: 0.25, offer: 0.20, followup: 0.10,
  };
  let weightedSum = 0;
  let totalWeight = 0;
  for (const stage of scan.stages) {
    if (stage.summary && stage.status === 'completed') {
      const weight = weights[stage.stage];
      weightedSum += stage.summary.score * weight;
      totalWeight += weight;
    }
  }
  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

function findWeakestStage(scanResult: ScanResult) {
  return scanResult.stages
    .filter((s) => s.summary && s.status === 'completed')
    .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100))[0] ?? null;
}
