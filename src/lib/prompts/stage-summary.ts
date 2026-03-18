// /src/lib/prompts/stage-summary.ts
// Stage-level summary prompt — synthesizes annotations into a StageSummary

import type { FunnelStage, Annotation } from '@/../../contracts/types';

export function getStageSummaryPrompt(
  stage: FunnelStage,
  annotations: Annotation[],
  screenshotCount: number,
  businessContext?: string,
): string {
  const annotationsSummary = annotations.map((a) => ({
    type: a.type,
    title: a.title,
    detail: a.detail,
    category: a.category,
  }));

  return `You are an expert digital marketing analyst creating a concise stage summary from annotation data.

STAGE: ${stage.toUpperCase()} — ${getStageLabel(stage)}
SCREENSHOTS ANALYZED: ${screenshotCount}
TOTAL ANNOTATIONS: ${annotations.length}

${businessContext ? `BUSINESS CONTEXT:\n${businessContext}` : ''}

ANNOTATIONS FOUND:
${JSON.stringify(annotationsSummary, null, 2)}

Create a stage summary that synthesizes these individual findings into a cohesive assessment.

Return ONLY valid JSON matching this exact schema:
{
  "exists": true,
  "score": <0-100>,
  "headline": "One compelling sentence that tells the business owner the impact of this stage's health on their revenue. Be specific — reference their actual issues, not generic advice.",
  "findings": [
    {
      "id": "unique-kebab-case-id",
      "title": "Finding title (action-oriented, 5-10 words)",
      "detail": "2-3 sentences explaining the finding, its impact, and what to do about it. Reference specific data or benchmarks.",
      "type": "critical" | "warning" | "opportunity" | "positive",
      "impact": "high" | "medium" | "low"
    }
  ]
}

SCORING GUIDE:
- 0-20: Stage is broken or missing entirely. Critical failures.
- 21-40: Major issues that are actively losing leads/sales.
- 41-60: Functional but leaving significant money on the table.
- 61-80: Good foundation with room for optimization.
- 81-100: Excellent — following best practices, only minor tweaks needed.

Count critical annotations heavily against the score. Positive annotations lift the score.
Multiple critical issues in the same area compound the penalty.

HEADLINE RULES:
- Must be specific to THEIR situation, not generic
- Should communicate business impact, not just "things are bad"
- Good: "Your homepage takes 8 seconds to communicate value — 53% of visitors have already left"
- Bad: "Your landing page needs improvement"

FINDINGS RULES:
- Consolidate related annotations into single findings
- Order by impact (high first)
- Include 3-6 findings total
- Each finding should be actionable
- At least 1 positive finding if any positive annotations exist`;
}

function getStageLabel(stage: FunnelStage): string {
  const labels: Record<FunnelStage, string> = {
    traffic: 'Traffic Sources & Audience Building',
    landing: 'Landing Experience & First Impression',
    capture: 'Lead Capture & Conversion Points',
    offer: 'Offer & Pricing Presentation',
    followup: 'Follow-up, Retention & Remarketing',
  };
  return labels[stage];
}
