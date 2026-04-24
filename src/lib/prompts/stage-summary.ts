// /src/lib/prompts/stage-summary.ts
// Stage-level summary prompt — synthesizes annotations into a StageSummary
//
// REWRITE (2026-04-23): Synthesizes annotations through the same Hormozi lens
// that produced them. The stage headline must communicate structural diagnosis
// (which Money Model layer is broken, which Value Equation lever is weakest) +
// dollar impact — not generic "your landing page needs work" summaries.

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

  return `You are a Hormozi-trained operator synthesizing screen-level annotations into a stage-level diagnosis. Your audience is a $500K–$5M service-business owner who wants a structural verdict, not a summary of symptoms.

STAGE: ${stage.toUpperCase()} — ${getStageLabel(stage)}
SCREENSHOTS ANALYZED: ${screenshotCount}
TOTAL ANNOTATIONS: ${annotations.length}

${businessContext ? `BUSINESS CONTEXT:\n${businessContext}\n` : ''}
ANNOTATIONS FOUND:
${JSON.stringify(annotationsSummary, null, 2)}

${getStageFramework(stage)}

Return ONLY valid JSON matching this exact schema:
{
  "exists": true | false,
  "score": <0-100>,
  "headline": "One sentence: (a) names the single most broken framework/layer, (b) quantifies the dollar impact of fixing it. See rules below.",
  "findings": [
    {
      "id": "unique-kebab-case-id",
      "title": "Framework-named finding (6-10 words)",
      "detail": "3-4 sentences: what you see structurally, which Hormozi principle it violates, the dollar/LTGP/CFA delta, the one immediate action. Operator tone. LEGACY — v1 consumers still read this; keep it populated as a concatenation of situation + complication + cost + fix.",
      "type": "critical" | "warning" | "opportunity" | "positive",
      "impact": "high" | "medium" | "low",
      "situation": {
        "title": "Short label of what is currently on screen (max 120 chars)",
        "body": "1-3 sentences. Describe what you OBSERVE — quote actual copy where possible. Do NOT interpret yet, just report.",
        "shot_ref": "screenshot id where this observation lives"
      },
      "complication": {
        "lever_name": "Dream Outcome | Perceived Likelihood | Time Delay | Effort & Sacrifice",
        "body": "1-3 sentences. Name the Hormozi principle that is broken (Value Equation lever, Money Model layer, Grand Slam step, Avatar rule) and WHY the observation violates it."
      },
      "cost": {
        "range_usd_min": 0,
        "range_usd_max": 0,
        "range_display": "\\"$38k – $72k\\"",
        "benchmark_citation": "Which Hormozi / CFA / LTGP math produced the range. E.g. 'CFA 30-day GP vs CAC' or 'commoditization multiplier (22.4x) at inferred $1M revenue baseline'."
      },
      "fix": {
        "body": "1-3 sentences. Frame as a Grand Slam / Money Model upgrade, not a tweak.",
        "monday_action": "Single sentence the owner can execute this week. Include the exact rewrite, offer stack, or lever addition."
      }
    }
  ]
}

STRUCTURED FIELD RULES (required, not optional):
- situation.body is observation-only — quote element text when visible. No framework language yet.
- complication.lever_name MUST be one of the four Value Equation levers. If the structural break is really a Money Model or Grand Slam issue, pick the lever whose motion is most dampened by the break (missing Continuity = "Time Delay" on LTGP realization; missing Attraction offer = "Effort & Sacrifice" on the visitor).
- cost.range_usd_max MUST be >= cost.range_usd_min. range_display must mirror those numbers formatted for humans ("$38k – $72k", never "$38000 – $72000").
- cost.benchmark_citation must name the specific math — never "industry average" or "typical benchmark." Either Hormozi's specific multipliers (22.4× commoditization cash delta, 14.7× Value Grid LTV, 5-12% attraction-offer capture rate) or CFA/LTGP formulas.
- fix.monday_action must be executable WITHOUT buying Forge. The whole point is: "you could fix this yourself on Monday."
- detail (legacy) must equal: situation.body + " " + complication.body + " " + cost.range_display + " delta per " + cost.benchmark_citation + ". Fix: " + fix.monday_action. Keep it under 600 chars.

SCORING GUIDE (Hormozi-grounded):
- 0-20: Entire Money Model layer is broken or missing. Primary wealth-creation lever absent.
- 21-40: Major framework violation (Value Equation lever down, commoditized offer, Attraction layer missing).
- 41-60: Layer exists but weak — leaving 3-5x perceived value or LTV on the table.
- 61-80: Sound structure, optimization-level fixes remaining. Grand Slam elements present but not fully stacked.
- 81-100: Framework-aligned. Value Equation firing on all four levers. Money Model has the relevant layers.

Critical annotations penalize heavily — a missing Money Model layer caps the score at ~40. Commoditization caps at ~30. A structurally sound stage with minor gaps scores 65+.

HEADLINE RULES — MUST be framework-grounded + dollar-quantified:
- GOOD: "Your Attraction layer is missing entirely — every visitor who isn't buying today is a permanently lost lead, costing ~$80–$150K/yr at your inferred traffic band."
- GOOD: "Offer is commoditized — 3 of 5 Grand Slam Offer steps skipped. At Hormozi's commoditization multiplier (22.4× cash delta on same traffic), this is the single highest-leverage fix in the business."
- GOOD: "Continuity layer absent — single-transaction model caps LTGP at ~$8K/customer vs $48K with monthly retention. This is where enterprise value is made."
- BAD: "Your landing page needs improvement." ← banned
- BAD: "Several issues with your conversion elements." ← banned
- BAD: "Visitors may be leaving too quickly." ← banned

FINDINGS RULES:
- Consolidate related annotations into a single structural finding (don't repeat 4 annotations about the same Value Equation lever — merge into one).
- Order by structural impact, not by severity label (a warning about a missing Continuity layer matters more than a critical about CTA text).
- Include 3-6 findings total. Each must satisfy the 5-criteria rubric (framework-named, layer-diagnosed, dollar-quantified, Monday-actionable, screen-specific).
- At least 1 positive if any positive annotations exist — reinforce what's working structurally.

FORGE TIER FIT (implicit — don't state, but let the diagnosis naturally map):
- Attraction layer + content cadence gaps → Launchpad signal
- Full Money Model infrastructure gaps → Revenue Build signal
- Enterprise-scale gaps (AI response, forecasting, sales training) → Growth Command signal
`;
}

function getStageLabel(stage: FunnelStage): string {
  const labels: Record<FunnelStage, string> = {
    traffic: 'Traffic & Attraction Layer',
    landing: 'Landing — Value Equation ≤5 second test',
    capture: 'Capture — Attraction Offer / CFA math',
    offer: 'Offer — Grand Slam construction',
    followup: 'Follow-up / Retention — Continuity + LTGP',
  };
  return labels[stage];
}

function getStageFramework(stage: FunnelStage): string {
  const frameworks: Record<FunnelStage, string> = {
    traffic: `PRIMARY FRAMEWORK for this stage: Money Model Attraction layer + Avatar 2-piece content rule.
Key diagnostic questions:
- Is there a Free Attraction offer visible (Hormozi: "free is the single most powerful word in advertising")?
- Does content teach (builds 2-piece authority) or sell (fails the top-20% rule)?
- Is positioning avatar-specific (revenue band + role + pain) or commodity-generic?
Dollar math: missing attraction layer at typical service-business traffic = $30K–$120K/yr in uncaptured leads that nurture would have converted.`,

    landing: `PRIMARY FRAMEWORK for this stage: Value Equation + Niche Commitment.
Key diagnostic questions:
- Does the hero communicate Dream Outcome, Perceived Likelihood, Time Delay, and Effort in ≤5 seconds?
- Is the avatar named specifically, or generic ("small businesses")?
- Is this page commoditized (could swap logos with competitor and still work) or "category of one"?
Dollar math: broken Value Equation levers compound multiplicatively — breaking 2 of 4 levers cuts effective conversion by ~4×. Niche generality caps pricing ceiling at commodity rates (Hormozi: 100× pricing delta between generic and specific).`,

    capture: `PRIMARY FRAMEWORK for this stage: Attraction layer (Money Model) + CFA math + 2-piece consumption rule.
Key diagnostic questions:
- Is there a free attraction offer, or only direct-to-premium "contact us"?
- Does friction (form fields, steps) match the offer value?
- Does the captured lead receive something consumable (content) or just get added to a CRM?
Dollar math: "Contact us" as only capture = ~0.5-2% visitor-to-lead rate. Free attraction offer = 5-12% (Hormozi gym-launch baseline). On typical $500K-$5M-service-business traffic, the delta is $40K-$300K/yr in recovered pipeline.`,

    offer: `PRIMARY FRAMEWORK for this stage: Grand Slam Offer 5-step construction + commoditization diagnosis + guarantee stacking + pricing architecture (anchor/Goldilocks).
Key diagnostic questions:
- Is the offer stacked (named bonuses with $-values + problem-addressed) or feature-listed?
- Is there a Dream Outcome or just a service description?
- Guarantee stack: triple-layered, single, or absent?
- Anchor tier shown first? Goldilocks (3 options)? Or single package?
Dollar math: commoditized offer = 0.5-2% close rate. Grand Slam offer = 8-15%. Same fulfillment, same traffic — 22.4× cash delta. This is the single highest-leverage stage in the business.`,

    followup: `PRIMARY FRAMEWORK for this stage: Money Model depth (Continuity / Upsell / Downsell / Retargeting) + Value Grid math (14.7× LTV lift) + content-authority layer.
Key diagnostic questions:
- Is there a Continuity layer (recurring revenue)?
- Upsell path after initial sale?
- Downsell for "no" prospects?
- Retargeting pixels installed?
- Active content cadence (blog/podcast/newsletter)?
- Review response velocity?
Dollar math: Value Grid baseline = $75 LTV / 10 prospects. Full-stack Money Model = $1,763 LTV / same 10 prospects. 14.7× delta per customer. At typical customer volume, missing Continuity alone caps enterprise-value creation at roughly 10% of what full-stack achieves.`,
  };
  return frameworks[stage];
}
