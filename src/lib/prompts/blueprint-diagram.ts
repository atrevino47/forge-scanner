// /src/lib/prompts/blueprint-diagram.ts
// Replaces mockup.ts in v2 (Blueprint Redesign, 2026-04-23).
// Output flips from HTML string → structured JSON (DiagramNode/DiagramEdge +
// Grand Slam checklist + outcome guarantee + objection FAQ + locked primary CTA).
// The FunnelDiagram React Flow component renders the nodes/edges client-side.
//
// The prospect's Blueprint shows the IDEAL Hormozi-stacked funnel for their
// detected industry — not a visual rebuild of their homepage. Prospects can
// hire Forge to implement OR DIY. The primary CTA subtext is Adrian-locked copy.

import type {
  BlueprintDiagram,
  FunnelStage,
  IndustryDetection,
  MoneyModelLayerKey,
  StageFinding,
} from '@/../../contracts/types';

export interface BlueprintDiagramPromptParams {
  weakestStage: FunnelStage;
  weakestMoneyModelLayer: MoneyModelLayerKey;
  industry: IndustryDetection | null;
  topFindings: StageFinding[]; // 6-10 across all stages, highest impact first
  businessName: string;
  websiteUrl: string;
  bookUrl: string; // Cal.com URL; if missing, caller passes "" and downstream renders text-only CTA
}

const LOCKED_PRIMARY_CTA_SUBTEXT =
  'If you want this personalized sales funnel implemented in your business, book a call.';

export function getBlueprintDiagramPrompt(
  params: BlueprintDiagramPromptParams,
): string {
  const {
    weakestStage,
    weakestMoneyModelLayer,
    industry,
    topFindings,
    businessName,
    websiteUrl,
    bookUrl,
  } = params;

  const industryDisplay = industry && industry.confidence >= 0.6
    ? industry.industry_display
    : 'your industry';
  const industrySlug = industry && industry.confidence >= 0.6
    ? industry.industry_slug
    : 'generic';
  const customerRole = industry && industry.confidence >= 0.6
    ? industry.customer_role_singular
    : 'customer';
  const avgTicket = industry && industry.confidence >= 0.6
    ? `$${industry.typical_avg_ticket_usd.min.toLocaleString()}–$${industry.typical_avg_ticket_usd.max.toLocaleString()}`
    : 'typical service-business ticket';

  const findingsBlock = topFindings
    .map(
      (f, i) =>
        `${i + 1}. [${f.type.toUpperCase()}] ${f.title} — ${f.detail.slice(0, 240)}`,
    )
    .join('\n');

  return `You are a Hormozi-trained growth architect. You build Money Models, not marketing decks.

Your task: produce a JSON blueprint of the IDEAL Hormozi-stacked funnel for a ${industryDisplay} business (not a rebuild of this specific prospect's homepage). This diagram will be rendered client-side as a left-to-right flowchart with labeled edges. The prospect can hire Forge to implement OR build it themselves — the blueprint is valuable either way.

BUSINESS: ${businessName} (${websiteUrl})
INDUSTRY: ${industryDisplay} (slug: ${industrySlug}, confidence ${industry?.confidence?.toFixed(2) ?? 'n/a'})
CUSTOMER ROLE: ${customerRole}
TYPICAL AVG TICKET: ${avgTicket}
WEAKEST STAGE (from scan): ${weakestStage}
WEAKEST MONEY MODEL LAYER: ${weakestMoneyModelLayer}

TOP FINDINGS (ordered by impact):
${findingsBlock}

## DIAGRAM CONSTRUCTION RULES

1. **Node count: 5–12.** Include at minimum: cold-traffic source, attraction offer, capture mechanism, nurture, front-end offer, and (where the industry supports it) upsell + continuity.
2. **Node ordering is the funnel itself:** traffic → attraction → capture → nurture → offer → upsell → continuity. Stage category field must match.
3. **Each node's description is industry-specific.** "Free funnel scanner" works for B2B agencies; "Free in-home estimate" works for roofers; "Complimentary consult + skin analysis" works for med-spa. Use the detected industry. If confidence <0.6, keep descriptions generic but honest ("a free diagnostic relevant to ${customerRole}s").
4. **is_missing_in_prospect:** mark true ONLY for nodes whose pattern is genuinely absent from the scan findings (cross-reference TOP FINDINGS). Don't mark everything missing — that signals fabrication.
5. **is_critical_upgrade:** exactly ONE node gets true. This is the "start here" node — the single highest-leverage addition given the weakest Money Model layer and biggest gap findings.
6. **value_equation_lever:** pick the lever the node most directly improves. Use "Multiple" sparingly (≤2 nodes).

## EDGE RULES

- Edges connect consecutive nodes in the funnel flow. Include 4–16 edges.
- **Every edge label must quote a specific benchmark with a source.** Examples: "5–12% capture rate (Hormozi Money Models baseline)", "40% attend booked call (typical ${industryDisplay})", "$1,763 LTV per 10 prospects via Value Grid stack (Lost Chapters)". No vague "improves conversion" edges.
- benchmark_source must name the Hormozi book/chapter or the specific math ("CFA 30D GP vs 2× CAC", "Value Grid 14.7× LTV delta").

## GRAND SLAM CHECKLIST

Evaluate whether the diagram as a whole satisfies each of the 5 Grand Slam construction steps. Each item: step_name (one of the five exact strings below), description (what this step looks like in the diagram), present_in_diagram (true/false).

Steps: "MAGIC name", "30-word test", "Value stack", "Anchor-first tiers", "Risk reversal".

## OUTCOME GUARANTEE

Write an industry-templated guarantee. Must have:
- statement: 1–3 sentence performance guarantee aligned with ${industryDisplay} unit economics.
- binary_criterion: the SINGLE unambiguous measurable criterion ("10+ booked calls in 30 days," "3+ qualified estimates scheduled per week"). Must be binary-judgeable, not "increased engagement."
- judged_by: who/what determines if it was met ("Your CRM's booked-call count," "Stripe initial-purchase event count").

## OBJECTION FAQ (exactly 3)

The three most common objections a ${customerRole}-facing ${industryDisplay} would raise against this funnel. Each:
- q: the objection in the prospect's voice (5–200 chars).
- a: the reframe in Hormozi's "acknowledge → reframe → evidence" pattern (10–500 chars). Cite specific Hormozi math when possible.

## PRIMARY CTA — LOCKED COPY

This is non-negotiable. Return EXACTLY:
- "button_label": "Book a call"
- "button_subtext": "${LOCKED_PRIMARY_CTA_SUBTEXT}"
- "book_url": "${bookUrl}"

headline and body are yours to write (headline 5–120 chars tying to the diagram's #1 promise; body 10–400 chars connecting the Grand Slam upgrade to booking a call).

## ABSOLUTE RULES

- NEVER fabricate founder credentials, city of origin, or non-existent Forge products (no "ex-Shopify", "Monterrey", "Offer Construction Playbook").
- NEVER hardcode med-spa / Dr. Kessler / Bright Skin examples — this must work for any industry.
- NEVER name a Forge tier (Launchpad / Revenue Build / Growth Command) inside diagram prose — tier mapping happens in the sales agent, not the Blueprint.
- If industry confidence <0.6, favor generic-honest framing ("a free diagnostic") over hallucinated specifics.

Return ONLY valid JSON matching this exact schema:

{
  "industry": "${industryDisplay}",
  "customer_role": "${customerRole}",
  "weakest_stage": "${weakestStage}",
  "weakest_money_model_layer": "${weakestMoneyModelLayer}",
  "diagram": {
    "nodes": [
      {
        "id": "kebab-case-id",
        "label": "Short label (max 60 chars)",
        "stage_category": "traffic | attraction | capture | nurture | offer | upsell | continuity",
        "description": "1-3 sentence industry-specific description (max 300 chars)",
        "value_equation_lever": "Dream Outcome | Perceived Likelihood | Time Delay | Effort & Sacrifice | Multiple",
        "is_missing_in_prospect": true | false,
        "is_critical_upgrade": true | false
      }
    ],
    "edges": [
      {
        "from": "node id",
        "to": "node id",
        "label": "benchmark-quoted edge label (max 80 chars)",
        "benchmark_source": "specific source / Hormozi math"
      }
    ]
  },
  "grand_slam_checklist": [
    { "step_name": "MAGIC name",        "description": "...", "present_in_diagram": true | false },
    { "step_name": "30-word test",      "description": "...", "present_in_diagram": true | false },
    { "step_name": "Value stack",       "description": "...", "present_in_diagram": true | false },
    { "step_name": "Anchor-first tiers","description": "...", "present_in_diagram": true | false },
    { "step_name": "Risk reversal",     "description": "...", "present_in_diagram": true | false }
  ],
  "outcome_guarantee": {
    "statement": "1-3 sentence industry-templated guarantee",
    "binary_criterion": "Single measurable criterion",
    "judged_by": "Who/what determines it"
  },
  "objection_faq": [
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." }
  ],
  "primary_cta": {
    "headline": "5-120 char headline",
    "body": "10-400 char body",
    "button_label": "Book a call",
    "button_subtext": "${LOCKED_PRIMARY_CTA_SUBTEXT}",
    "book_url": "${bookUrl}"
  }
}
`;
}

// Type re-export so callers don't need to dual-import.
export type { BlueprintDiagram };
