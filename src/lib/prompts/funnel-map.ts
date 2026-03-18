// /src/lib/prompts/funnel-map.ts
// System prompt for analyzing all stage results and generating
// a current-vs-ideal funnel map with revenue impact estimates

import type { FunnelStage, FunnelStageResult } from '@/../../contracts/types';

export function getFunnelMapPrompt(
  stages: FunnelStageResult[],
  websiteUrl: string,
  businessName?: string | null,
): string {
  const stageData = stages.map((s) => ({
    stage: s.stage,
    status: s.status,
    exists: s.summary?.exists ?? false,
    score: s.summary?.score ?? 0,
    headline: s.summary?.headline ?? 'Not analyzed',
    findingCount: s.summary?.findings?.length ?? 0,
    criticalFindings: (s.summary?.findings ?? [])
      .filter((f) => f.type === 'critical')
      .map((f) => f.title),
    topFindings: (s.summary?.findings ?? [])
      .slice(0, 4)
      .map((f) => ({ title: f.title, type: f.type, impact: f.impact })),
    screenshotCount: s.screenshots.length,
    annotationCount: s.screenshots.reduce(
      (sum, ss) => sum + ss.annotations.length,
      0,
    ),
  }));

  return `You are a senior growth strategist and funnel architect with 15+ years of experience building high-converting sales funnels for businesses across every industry. You combine data-driven analysis with strategic vision.

TASK: Generate a complete funnel map comparing this business's CURRENT state to the IDEAL state for each of the 5 funnel stages.

BUSINESS: ${businessName ?? 'Unknown'} (${websiteUrl})

SCAN DATA:
${JSON.stringify(stageData, null, 2)}

FUNNEL STAGES (in order):
1. TRAFFIC — How they attract visitors (social media, ads, SEO, referrals)
2. LANDING — First impression when someone visits (homepage, landing pages)
3. CAPTURE — How they collect contact information (forms, lead magnets, CTAs)
4. OFFER — How they present their products/services and pricing
5. FOLLOWUP — How they nurture leads who didn't convert (retargeting, email, content)

FOR EACH STAGE, assess:
- Does this stage exist in their funnel?
- What is their current implementation? Be specific about what they have.
- What would the IDEAL version look like for their type of business?
- What specific improvements would close the gap?
- How does this stage's weakness impact downstream conversion?

REVENUE IMPACT ESTIMATION:
Based on the biggest gap, estimate the potential revenue impact of fixing it. Use this framework:
- If traffic stage is weakest: estimate increased visitor volume
- If landing stage is weakest: estimate reduced bounce rate → more qualified visitors
- If capture stage is weakest: estimate increased lead capture rate
- If offer stage is weakest: estimate increased close rate
- If followup stage is weakest: estimate recovered leads from the 97% who leave without converting

Be specific. Don't say "you'll make more money." Say something like: "Adding a lead magnet to your homepage could capture 8-15% of your current traffic as leads. At your estimated 2,000 monthly visitors, that's 160-300 new leads per month."

Return ONLY valid JSON matching this exact schema:
{
  "nodes": [
    {
      "stage": "${getStageExample()}",
      "label": "Human-readable stage name",
      "exists": true | false,
      "health": "good" | "weak" | "missing",
      "currentDescription": "2-3 sentences describing exactly what they have now. Reference specific findings from the scan data.",
      "idealDescription": "2-3 sentences describing what the ideal version looks like for their business type.",
      "improvements": [
        "Specific actionable improvement #1",
        "Specific actionable improvement #2",
        "Specific actionable improvement #3"
      ]
    }
  ],
  "overallHealth": <0-100 weighted average>,
  "biggestGap": "${getStageExample()}",
  "revenueImpactEstimate": "A specific, data-informed estimate of the revenue impact of fixing the biggest gap. 2-3 sentences. Include projected numbers."
}

NODE ORDERING: Return nodes in funnel order: traffic → landing → capture → offer → followup.

HEALTH CLASSIFICATION:
- "good": score >= 70, stage is well-implemented with minor optimization opportunities
- "weak": score 30-69, stage exists but has significant issues hurting conversion
- "missing": score < 30 OR stage doesn't exist, critical gap in the funnel

BIGGEST GAP: Pick the stage where fixing it would have the highest revenue impact, not just the lowest score. A missing capture stage (score 0) may be a bigger gap than a weak traffic stage (score 35) because capture is downstream and closer to revenue.

OVERALL HEALTH: Weight stages by revenue impact:
- Traffic: 15% weight
- Landing: 30% weight
- Capture: 25% weight
- Offer: 20% weight
- Follow-up: 10% weight

Be specific to THIS business. Reference their actual findings. No generic advice.`;
}

function getStageExample(): string {
  return 'traffic | landing | capture | offer | followup';
}
