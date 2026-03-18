// /src/lib/prompts/whatsapp-followup.ts
// Prompt for generating personalized WhatsApp follow-up messages
// Medium format: 3-5 sentences, conversational, uses WhatsApp formatting

import type { FunnelStage, ScanResult } from '@/../../contracts/types';

export type WhatsAppSequencePosition = 1 | 2 | 3;

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'traffic sources',
  landing: 'landing experience',
  capture: 'lead capture',
  offer: 'offer presentation',
  followup: 'follow-up system',
};

export function getWhatsAppFollowupPrompt(
  scanResult: ScanResult,
  position: WhatsAppSequencePosition,
  businessName: string,
  leadName?: string | null,
  calcomUrl?: string,
): string {
  const overallHealth = calculateOverallHealth(scanResult);
  const weakest = findWeakestStage(scanResult);
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage] : 'funnel';
  const weakScore = weakest?.summary?.score ?? 0;
  const topFindings = getTopFindings(scanResult, position === 1 ? 2 : 1);
  const calLine = calcomUrl || '[CAL.COM_LINK]';

  const positionContext = getPositionContext(position);

  return `You are writing a WhatsApp follow-up message for a business owner who ran a free funnel scan.

CHANNEL RULES:
- Length: 3-5 sentences. Conversational, not corporate.
- Use WhatsApp formatting: *bold* for emphasis, line breaks for readability
- Tone: friendly, direct, like texting a business acquaintance who asked for your expert opinion
- Can include one emoji if natural, but don't overdo it
- End with a question to invite a reply, OR a booking link

SEQUENCE POSITION: ${position} of 3
${positionContext}

BUSINESS: ${businessName}
RECIPIENT: ${leadName || 'Business owner'}
OVERALL SCORE: ${overallHealth}/100
WEAKEST AREA: ${weakLabel} (${weakScore}/100)

TOP FINDINGS:
${topFindings}

CAL.COM LINK: ${calLine}

Return ONLY valid JSON:
{
  "message": "The complete WhatsApp message with *bold* formatting and line breaks"
}`;
}

// ============================================================
// Position-specific context
// ============================================================

function getPositionContext(position: WhatsAppSequencePosition): string {
  switch (position) {
    case 1:
      return `CONTEXT: First message, sent shortly after scan. Be helpful and generous.
- Share 1-2 key findings from their scan
- Frame as "wanted to share what stood out"
- Soft CTA: ask if they want to discuss or share the booking link casually`;

    case 2:
      return `CONTEXT: Second message, sent ~24h later. They haven't replied.
- Lead with ONE compelling insight — go deeper on it
- Create gentle urgency: "just wanted to make sure you saw this"
- More direct CTA: suggest booking the call`;

    case 3:
      return `CONTEXT: Final message, sent ~3 days later. They haven't engaged.
- Brief and respectful
- Mention results will expire soon
- Leave door open: "no pressure, here if you need anything"
- Include booking link one last time`;
  }
}

// ============================================================
// Helpers
// ============================================================

function getTopFindings(scanResult: ScanResult, count: number): string {
  const findings = scanResult.stages
    .flatMap((s) =>
      (s.summary?.findings ?? []).map((f) => ({
        ...f,
        stageName: STAGE_LABELS[s.stage],
      })),
    )
    .filter((f) => f.type === 'critical' || f.type === 'warning')
    .sort((a, b) => {
      const p = { critical: 0, warning: 1, opportunity: 2, positive: 3 };
      return p[a.type] - p[b.type];
    })
    .slice(0, count);

  return findings
    .map((f) => `- ${f.stageName}: ${f.title} — ${f.detail.slice(0, 150)}`)
    .join('\n');
}

function findWeakestStage(scanResult: ScanResult) {
  return scanResult.stages
    .filter((s) => s.summary && s.status === 'completed')
    .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100))[0] ?? null;
}

function calculateOverallHealth(scan: ScanResult): number {
  const weights: Record<FunnelStage, number> = {
    traffic: 0.15, landing: 0.30, capture: 0.25, offer: 0.20, followup: 0.10,
  };
  let sum = 0;
  let total = 0;
  for (const s of scan.stages) {
    if (s.summary && s.status === 'completed') {
      sum += s.summary.score * weights[s.stage];
      total += weights[s.stage];
    }
  }
  return total === 0 ? 0 : Math.round(sum / total);
}
