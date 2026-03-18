// /src/lib/prompts/sms-followup.ts
// Prompt for generating personalized SMS follow-up messages
// Must be <=160 characters, one insight + CTA

import type { FunnelStage, ScanResult } from '@/../../contracts/types';

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'traffic sources',
  landing: 'landing page',
  capture: 'lead capture',
  offer: 'offer page',
  followup: 'follow-up system',
};

export function getSMSFollowupPrompt(
  scanResult: ScanResult,
  businessName: string,
  calcomUrl?: string,
): string {
  const weakest = findWeakestStage(scanResult);
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage] : 'funnel';
  const weakScore = weakest?.summary?.score ?? 0;
  const topFinding = findTopCriticalFinding(scanResult);
  const calLine = calcomUrl || '[LINK]';

  return `You are writing a single SMS follow-up message for a business owner who ran a free funnel scan but didn't book a strategy call.

CONSTRAINTS:
- MAXIMUM 160 characters total. This is a hard limit. Count carefully.
- One key insight from their scan + one call to action
- No emojis (except maybe one)
- No exclamation marks
- Direct, professional tone
- Must feel personal, not automated

BUSINESS: ${businessName}
WEAKEST AREA: ${weakLabel} (${weakScore}/100)
TOP FINDING: ${topFinding ? topFinding.title : `${weakLabel} needs attention`}
CAL.COM LINK: ${calLine}

EXAMPLE FORMATS (adapt to their data):
- "${businessName}: Your ${weakLabel} scored ${weakScore}/100. Quick 30-min call to fix it? ${calLine}"
- "Found 3 issues hurting ${businessName}'s conversions. Free strategy call: ${calLine}"
- "${businessName}: ${topFinding?.title ?? 'Your funnel has gaps'}. Want to fix it? Free call: ${calLine}"

Return ONLY valid JSON:
{
  "message": "The complete SMS message, 160 chars or fewer"
}`;
}

// ============================================================
// Helpers
// ============================================================

function findWeakestStage(scanResult: ScanResult) {
  return scanResult.stages
    .filter((s) => s.summary && s.status === 'completed')
    .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100))[0] ?? null;
}

function findTopCriticalFinding(scanResult: ScanResult) {
  const criticals = scanResult.stages
    .flatMap((s) => s.summary?.findings ?? [])
    .filter((f) => f.type === 'critical');
  return criticals.find((f) => f.impact === 'high') ?? criticals[0] ?? null;
}
