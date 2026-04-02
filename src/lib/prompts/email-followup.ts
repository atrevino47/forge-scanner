// /src/lib/prompts/email-followup.ts
// Prompts for generating personalized follow-up emails
// Three variants based on sequence position

import type { FunnelStage, ScanResult } from '@/../../contracts/types';

export type SequencePosition = 1 | 2 | 3;

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'traffic sources',
  landing: 'landing experience',
  capture: 'lead capture',
  offer: 'offer presentation',
  followup: 'follow-up system',
};

// ============================================================
// Get email follow-up prompt by sequence position
// ============================================================

export function getEmailFollowupPrompt(
  scanResult: ScanResult,
  position: SequencePosition,
  businessName: string,
  leadName?: string | null,
  calcomUrl?: string,
): string {
  const overallHealth = calculateOverallHealth(scanResult);
  const weakest = findWeakestStage(scanResult);
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage] : 'funnel';
  const weakScore = weakest?.summary?.score ?? 0;
  const topFindings = getTopFindings(scanResult, position === 1 ? 3 : position === 2 ? 1 : 2);
  const calLine = calcomUrl || '[CAL.COM_LINK]';

  const positionPrompts: Record<SequencePosition, string> = {
    1: getPosition1Prompt({ businessName, leadName, overallHealth, weakLabel, weakScore, topFindings, calLine }),
    2: getPosition2Prompt({ businessName, leadName, overallHealth, weakLabel, weakScore, topFindings, calLine }),
    3: getPosition3Prompt({ businessName, leadName, overallHealth, weakLabel, weakScore, topFindings, calLine }),
  };

  return positionPrompts[position];
}

// ============================================================
// Position 1: Value-led (30-60 seconds after exit)
// ============================================================

interface PromptContext {
  businessName: string;
  leadName?: string | null;
  overallHealth: number;
  weakLabel: string;
  weakScore: number;
  topFindings: string;
  calLine: string;
}

function getPosition1Prompt(ctx: PromptContext): string {
  return `You are a senior marketing strategist at Forge (forgewith.ai) writing a follow-up email to someone who just ran a free funnel scan but left without booking a strategy call.

TONE: Generous, value-led. You're giving them real insights as a goodwill gesture. No pressure. This is the first email — make it feel like a personal note from a consultant, not a marketing email.

BUSINESS: ${ctx.businessName}
RECIPIENT: ${ctx.leadName || 'Business owner'}
OVERALL SCORE: ${ctx.overallHealth}/100
WEAKEST AREA: ${ctx.weakLabel} (${ctx.weakScore}/100)

TOP FINDINGS TO REFERENCE:
${ctx.topFindings}

STRUCTURE:
1. Subject line — reference their specific score or top finding. Make it feel personal, not spammy.
2. Greeting — warm, use their name if available
3. Opening — reference that they just scanned their funnel. Don't say "I noticed you left" — say "Your results are ready and I wanted to highlight a few things."
4. Value section — share their top 3 findings with specific details. This is the meat. Be genuinely helpful.
5. Soft CTA — "If you'd like to go deeper on any of these, I'd love to walk you through the full results in a free strategy call."
6. Cal.com link: ${ctx.calLine}
7. Closing — warm, no pressure
8. P.S. — one additional insight or a stat about their weakest area

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Complete email body in plain text with line breaks. Use **bold** for emphasis."
}`;
}

// ============================================================
// Position 2: Direct with urgency (24 hours later)
// ============================================================

function getPosition2Prompt(ctx: PromptContext): string {
  return `You are a senior marketing strategist at Forge (forgewith.ai) writing the SECOND follow-up email, 24 hours after the first. They haven't responded or booked.

TONE: More direct. One key insight delivered with confident authority. Create natural urgency without being pushy. Shorter than the first email.

BUSINESS: ${ctx.businessName}
RECIPIENT: ${ctx.leadName || 'Business owner'}
OVERALL SCORE: ${ctx.overallHealth}/100
WEAKEST AREA: ${ctx.weakLabel} (${ctx.weakScore}/100)

TOP FINDING TO LEAD WITH:
${ctx.topFindings}

STRUCTURE:
1. Subject line — direct, references the one key insight. Can be a question.
2. Opening — brief, acknowledge they're busy. No "just following up" or "touching base."
3. Single insight — go deep on ONE finding. Explain exactly what it costs them in plain terms. Use benchmarks.
4. Urgency element — natural and true: "Every day this isn't fixed, you're losing potential customers to competitors who have this dialed in."
5. Direct CTA — "I have a few strategy call slots open this week. Pick one that works: ${ctx.calLine}"
6. One-line closing

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Complete email body in plain text with line breaks. Use **bold** for emphasis."
}`;
}

// ============================================================
// Position 3: Final email with scarcity (3 days later)
// ============================================================

function getPosition3Prompt(ctx: PromptContext): string {
  return `You are a senior marketing strategist at Forge (forgewith.ai) writing the FINAL follow-up email, 3 days after the scan. They haven't engaged with the first two emails.

TONE: Respectful but clear this is the last outreach. Results expiration creates natural scarcity. No guilt-tripping. Leave the door open.

BUSINESS: ${ctx.businessName}
RECIPIENT: ${ctx.leadName || 'Business owner'}
OVERALL SCORE: ${ctx.overallHealth}/100
WEAKEST AREA: ${ctx.weakLabel} (${ctx.weakScore}/100)

FINDINGS TO REFERENCE:
${ctx.topFindings}

STRUCTURE:
1. Subject line — mention results expiring soon. Clear, not clickbait.
2. Opening — straightforward: "Your funnel scan results for ${ctx.businessName} will expire in [X] days."
3. Quick recap — 2-3 bullet points of what they'll lose access to (annotated screenshots, specific findings, generated blueprint if applicable)
4. Perspective shift — brief statement about what businesses who ACT on scan results typically achieve vs those who don't
5. Final CTA — "Last chance to grab a free strategy call before your results expire: ${ctx.calLine}"
6. Graceful close — "Either way, I hope the scan was useful. Feel free to run another one anytime."

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Complete email body in plain text with line breaks. Use **bold** for emphasis."
}`;
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
    .sort((a, b) => {
      const typePriority = { critical: 0, warning: 1, opportunity: 2, positive: 3 };
      const impactPriority = { high: 0, medium: 1, low: 2 };
      const typeComp = typePriority[a.type] - typePriority[b.type];
      if (typeComp !== 0) return typeComp;
      return impactPriority[a.impact] - impactPriority[b.impact];
    })
    .slice(0, count);

  return findings
    .map(
      (f) =>
        `- [${f.type.toUpperCase()}] ${f.stageName}: ${f.title} — ${f.detail.slice(0, 200)}`,
    )
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
