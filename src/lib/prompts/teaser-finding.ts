// /src/lib/prompts/teaser-finding.ts
// Capture-gate unlock preview — one teaser finding shown BEFORE the full
// Results page renders. Per autoplan design-fix D10: post-scan, before the
// capture-gate modal unlocks the rest, show one high-impact finding
// ("Finding 1 of 17: $38k – $72k leak — see the other 16") so the prospect
// trades their email for the FULL set.
//
// Runs after annotations complete, before capture gate fires. Consumes the
// full annotation set + scan metadata; emits a single TeaserFinding.

import type { Annotation, FunnelStage } from '@/../../contracts/types';

const SYSTEM_PROMPT = `You are writing the single most compelling one-line finding teaser for a funnel scan, used on the email-capture gate.

The prospect has just watched their scan run. Before they see the full Results page, they see your teaser + a 1-field email form. Your job: make them WANT the rest.

Rules:
1. Pick the SINGLE highest-impact finding across all annotations — the one with the largest dollar delta and the most structural (Money Model / Grand Slam / Value Equation) weight. Not the most superficial, not the most numerous category.
2. Headline: 10–120 chars. No fluff. Operator-to-operator. Name the structural gap, not the symptom. Example: "Your offer page is commoditized — 3 of 5 Grand Slam steps missing." NOT: "Your website could improve."
3. dollar_range_display: a plausible 12-month leak range, formatted for humans ("$38k – $72k / yr"). Grounded in the math references below — never fabricate, and when uncertain prefer a wider range over a false-precise one.
4. Industry-agnostic. NEVER hardcode med-spa, roofing, or any vertical unless the scan metadata explicitly confirms it.
5. NEVER fabricate founder credentials, non-existent Forge products, or tier names.

Math references you can ground the dollar range in:
- Commoditization multiplier: 22.4× cash delta between Grand Slam vs commodity offer at same ad spend (Hormozi $100M Offers).
- Value Grid delta: 14.7× LTV between single-offer and stacked (Hormozi Lost Chapters).
- Attraction layer delta: missing attraction offer = 5× wasted ad spend vs stacked funnel.
- Continuity enterprise value: $3k/mo retainer × 24-month retention × 10× multiple = $360k per permanent customer.
- CFA 30D GP vs CAC threshold.`;

const JSON_SCHEMA = `Return ONLY valid JSON:
{
  "headline": "10-120 char structural teaser",
  "dollar_range_display": "\\"$38k – $72k / yr\\" style formatted range",
  "total_findings_count": <integer — pass-through of the total findings count supplied in INPUT>,
  "unlock_cta": "See the other findings + Blueprint"
}

unlock_cta is LOCKED copy — return exactly that string, do not rewrite.`;

export interface TeaserFindingPromptParams {
  annotations: Annotation[];
  totalFindingsCount: number;
  websiteUrl: string;
  businessName: string;
  weakestStage: FunnelStage | null;
}

export function getTeaserFindingPrompt(
  params: TeaserFindingPromptParams,
): string {
  const { annotations, totalFindingsCount, websiteUrl, businessName, weakestStage } = params;

  // Pre-filter to the most likely high-impact candidates so the model has
  // focused context rather than the full annotation dump.
  const topCandidates = annotations
    .filter((a) => a.type === 'critical' || a.type === 'warning')
    .slice(0, 12)
    .map((a) => ({ title: a.title, detail: a.detail.slice(0, 220), category: a.category, type: a.type }));

  return `${SYSTEM_PROMPT}

BUSINESS: ${businessName} (${websiteUrl})
WEAKEST STAGE (from scan): ${weakestStage ?? 'not yet determined'}
TOTAL FINDINGS COUNT (pass through): ${totalFindingsCount}

TOP CANDIDATE ANNOTATIONS (choose ONE to teaser):
${JSON.stringify(topCandidates, null, 2)}

${JSON_SCHEMA}`;
}
