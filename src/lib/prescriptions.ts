/**
 * Prescription Engine — maps scan findings to Forge service recommendations.
 *
 * Turns diagnostic findings into Hormozi-style prescriptive offers:
 * "Here's what's broken → here's exactly what we'll do → here's what happens when we fix it."
 *
 * The prescription is the strategy given away free. The execution is what Forge sells.
 */

import type { FunnelStage, StageFinding, AnnotationType } from '../../contracts/types';
import type { StageState } from '@/components/scan/types';

// ── Types ──────────────────────────────────────────────

export type PriceTier = 'starter' | 'growth' | 'scale';

export interface Prescription {
  id: string;
  /** Which finding triggered this prescription */
  findingId: string;
  /** Funnel stage this applies to */
  stage: FunnelStage;
  /** Severity inherited from finding */
  severity: AnnotationType;
  /** What's broken — plain language */
  problem: string;
  /** Why it matters — cost of inaction */
  whyItMatters: string;
  /** Exactly what Forge will do */
  forgeFix: string;
  /** Expected outcome after fix */
  expectedOutcome: string;
  /** Effort level for the prospect to understand scope */
  effort: 'quick-win' | 'half-day' | 'multi-day';
  /** Price tier — determines which package this falls into */
  priceTier: PriceTier;
  /** Priority score (0-100) — higher = fix this first */
  priority: number;
  /** Forge service name */
  serviceName: string;
}

// ── Finding-to-prescription mapping rules ──────────────

interface PrescriptionRule {
  /** Match on finding title keywords (case-insensitive) */
  titleKeywords: string[];
  /** Match on finding type */
  types: AnnotationType[];
  /** Match on stage */
  stages: FunnelStage[];
  /** Template for the prescription */
  template: {
    serviceName: string;
    forgeFix: string;
    expectedOutcome: string;
    effort: Prescription['effort'];
    priceTier: PriceTier;
    /** Base priority — adjusted by severity */
    basePriority: number;
  };
}

/* TODO: APPLE GEO / AEO PRESCRIPTION RULES
 *
 * GEO (Generative Engine Optimization):
 * Apple Intelligence, Google SGE, and Perplexity use generative AI to
 * summarize and recommend businesses. GEO = optimizing content so AI
 * models cite/recommend your business in their generated answers.
 *
 * Key prescription opportunities:
 * - Missing structured data (Schema.org) → "AI Visibility Package"
 * - No FAQ sections or Q&A content → "Answer Engine Content"
 * - Weak entity markup → "Entity Authority Setup"
 * - No clear authoritative statements → "Topical Authority Buildout"
 * - Inconsistent NAP/brand across sources → "Brand Entity Consistency"
 *
 * AEO (Answer Engine Optimization):
 * Optimizing for featured snippets, People Also Ask, and AI-generated
 * answers in Google SGE, Bing Copilot, Apple Intelligence search.
 *
 * Key prescription opportunities:
 * - No concise, direct answers to common queries → "Featured Snippet Capture"
 * - Missing FAQ schema → "Schema Markup Package"
 * - Thin content that AI can't extract clear answers from → "Content Depth Buildout"
 *
 * Implementation:
 * 1. Add GEO/AEO checks to /src/lib/ai/ analysis prompts
 * 2. New finding categories: 'geo_visibility', 'aeo_readiness', 'schema_missing'
 * 3. New prescription rules below matching those categories
 * 4. New prescription templates:
 *    - serviceName: "AI Search Visibility" (priceTier: 'growth')
 *    - serviceName: "Answer Engine Setup" (priceTier: 'starter')
 *    - serviceName: "Entity Authority Package" (priceTier: 'scale')
 * 5. This is a major differentiator — no other scanner checks GEO/AEO readiness
 *
 * Example rule shape:
 * {
 *   titleKeywords: ['structured data', 'schema', 'ai visibility', 'ai search'],
 *   types: ['critical', 'warning', 'opportunity'],
 *   stages: ['traffic', 'landing'],
 *   template: {
 *     serviceName: 'AI Search Visibility',
 *     forgeFix: 'Implement comprehensive Schema.org markup, FAQ structured data, ...',
 *     expectedOutcome: 'Appear in AI-generated answers and featured snippets ...',
 *     effort: 'half-day',
 *     priceTier: 'growth',
 *     basePriority: 72,
 *   },
 * },
 */

const RULES: PrescriptionRule[] = [
  // ── Landing / UX issues ──
  {
    titleKeywords: ['cta', 'call to action', 'above the fold', 'button'],
    types: ['critical', 'warning'],
    stages: ['landing', 'capture'],
    template: {
      serviceName: 'CTA Optimization',
      forgeFix: 'Design and place a high-contrast, benefit-driven CTA above the fold with urgency copy and mobile-optimized tap targets.',
      expectedOutcome: '+20-35% click-through rate on primary CTA within the first scroll.',
      effort: 'quick-win',
      priceTier: 'starter',
      basePriority: 90,
    },
  },
  {
    titleKeywords: ['speed', 'load', 'slow', 'performance', 'lcp', 'core web'],
    types: ['critical', 'warning'],
    stages: ['landing'],
    template: {
      serviceName: 'Speed Optimization',
      forgeFix: 'Audit and compress images, eliminate render-blocking resources, implement lazy loading, and optimize server response times.',
      expectedOutcome: 'Page load under 2.5s — every 1s improvement increases conversions by 7%.',
      effort: 'half-day',
      priceTier: 'starter',
      basePriority: 85,
    },
  },
  {
    titleKeywords: ['mobile', 'responsive', 'viewport', 'touch'],
    types: ['critical', 'warning'],
    stages: ['landing', 'capture', 'offer'],
    template: {
      serviceName: 'Mobile Experience Rebuild',
      forgeFix: 'Rebuild key pages with mobile-first responsive design, proper touch targets (48px+), and thumb-zone CTA placement.',
      expectedOutcome: '60%+ of traffic is mobile — fixing this alone can recover 25-40% of lost conversions.',
      effort: 'multi-day',
      priceTier: 'growth',
      basePriority: 88,
    },
  },
  // ── Capture / Lead gen issues ──
  {
    titleKeywords: ['form', 'input', 'field', 'capture', 'lead magnet', 'opt-in', 'email'],
    types: ['critical', 'warning'],
    stages: ['capture'],
    template: {
      serviceName: 'Lead Capture System',
      forgeFix: 'Build a high-converting lead capture system: value-first lead magnet, 2-field form, exit-intent popup, and automated email delivery.',
      expectedOutcome: 'Capture 15-30% of visitors who currently leave with nothing. Each lead = future revenue.',
      effort: 'half-day',
      priceTier: 'growth',
      basePriority: 92,
    },
  },
  {
    titleKeywords: ['trust', 'social proof', 'testimonial', 'review', 'credibility'],
    types: ['critical', 'warning', 'opportunity'],
    stages: ['landing', 'offer', 'capture'],
    template: {
      serviceName: 'Trust Architecture',
      forgeFix: 'Add strategic social proof: video testimonials above fold, review widgets, trust badges, case study snippets, and client logos.',
      expectedOutcome: 'Trust signals increase conversion by 15-25%. Prospects decide in 3 seconds — proof must be instant.',
      effort: 'quick-win',
      priceTier: 'starter',
      basePriority: 80,
    },
  },
  // ── Offer issues ──
  {
    titleKeywords: ['offer', 'pricing', 'value', 'proposition', 'headline', 'copy'],
    types: ['critical', 'warning'],
    stages: ['offer', 'landing'],
    template: {
      serviceName: 'Offer Engineering',
      forgeFix: 'Rewrite your offer with the Grand Slam framework: dream outcome + perceived likelihood + time delay + effort/sacrifice. Add risk reversal guarantee.',
      expectedOutcome: 'A compelling offer is the #1 conversion lever. Expect 2-3x improvement in offer-to-booking rate.',
      effort: 'half-day',
      priceTier: 'growth',
      basePriority: 95,
    },
  },
  {
    titleKeywords: ['urgency', 'scarcity', 'deadline', 'limited'],
    types: ['warning', 'opportunity'],
    stages: ['offer', 'landing'],
    template: {
      serviceName: 'Urgency & Scarcity System',
      forgeFix: 'Implement ethical urgency triggers: countdown timers for real deadlines, capacity limits, and seasonal offer framing.',
      expectedOutcome: 'Urgency alone can lift conversion 10-15% when paired with a strong offer.',
      effort: 'quick-win',
      priceTier: 'starter',
      basePriority: 65,
    },
  },
  // ── Traffic issues ──
  {
    titleKeywords: ['seo', 'search', 'organic', 'meta', 'title', 'description', 'structured data'],
    types: ['critical', 'warning', 'opportunity'],
    stages: ['traffic'],
    template: {
      serviceName: 'SEO Foundation',
      forgeFix: 'Implement technical SEO: meta tags, structured data, sitemap, robots.txt, internal linking, and page speed optimization.',
      expectedOutcome: 'Organic traffic is free traffic. Proper SEO compounds — 6-month ROI typically exceeds paid ads.',
      effort: 'multi-day',
      priceTier: 'growth',
      basePriority: 70,
    },
  },
  {
    titleKeywords: ['social', 'instagram', 'facebook', 'tiktok', 'linkedin', 'content', 'posting'],
    types: ['critical', 'warning', 'opportunity'],
    stages: ['traffic'],
    template: {
      serviceName: 'Social Presence Buildout',
      forgeFix: 'Audit and optimize social profiles, create content templates, establish posting cadence, and set up cross-platform funneling to your site.',
      expectedOutcome: 'Consistent social presence builds authority and drives warm traffic that converts 3-5x better than cold.',
      effort: 'multi-day',
      priceTier: 'scale',
      basePriority: 60,
    },
  },
  {
    titleKeywords: ['google business', 'gbp', 'maps', 'local', 'reviews'],
    types: ['critical', 'warning', 'opportunity'],
    stages: ['traffic'],
    template: {
      serviceName: 'Local Presence Optimization',
      forgeFix: 'Claim/optimize Google Business Profile, set up review generation system, add local schema markup, and ensure NAP consistency.',
      expectedOutcome: 'GBP is the highest-intent traffic source for local businesses. Top 3 map pack = 70% of local clicks.',
      effort: 'half-day',
      priceTier: 'starter',
      basePriority: 75,
    },
  },
  // ── Follow-up issues ──
  {
    titleKeywords: ['follow', 'email sequence', 'nurture', 'drip', 'automation', 'retarget'],
    types: ['critical', 'warning'],
    stages: ['followup'],
    template: {
      serviceName: 'Follow-Up Engine',
      forgeFix: 'Build a multi-channel follow-up system: 7-email nurture sequence, SMS reminders, retargeting pixel setup, and abandoned-visit recovery.',
      expectedOutcome: '80% of sales happen after the 5th touch. Without follow-up, you lose leads you already paid to acquire.',
      effort: 'multi-day',
      priceTier: 'scale',
      basePriority: 85,
    },
  },
  {
    titleKeywords: ['booking', 'calendar', 'schedule', 'appointment'],
    types: ['critical', 'warning'],
    stages: ['followup', 'offer'],
    template: {
      serviceName: 'Booking Flow Optimization',
      forgeFix: 'Implement frictionless booking: embedded calendar, pre-filled fields, confirmation + reminder sequence, and no-show recovery.',
      expectedOutcome: 'Reduce booking friction by 50%. Pre-filled forms + reminders cut no-shows by 30%.',
      effort: 'quick-win',
      priceTier: 'starter',
      basePriority: 78,
    },
  },
];

// ── Fallback prescription for findings that don't match any rule ──

function buildFallbackPrescription(
  finding: StageFinding,
  stage: FunnelStage,
): Omit<Prescription, 'id' | 'findingId'> {
  const stageLabels: Record<FunnelStage, string> = {
    traffic: 'Traffic Sources',
    landing: 'Landing Experience',
    capture: 'Lead Capture',
    offer: 'Offer & Conversion',
    followup: 'Follow-Up System',
  };
  return {
    stage,
    severity: finding.type,
    problem: finding.title,
    whyItMatters: finding.detail,
    forgeFix: `Our builders will audit and fix this issue in your ${stageLabels[stage].toLowerCase()}, implementing best practices specific to your industry.`,
    expectedOutcome: 'Measurable improvement in funnel performance for this stage within the first week.',
    effort: finding.impact === 'high' ? 'multi-day' : finding.impact === 'medium' ? 'half-day' : 'quick-win',
    priceTier: finding.impact === 'high' ? 'growth' : 'starter',
    priority: finding.type === 'critical' ? 70 : finding.type === 'warning' ? 50 : 30,
    serviceName: `${stageLabels[stage]} Fix`,
  };
}

// ── Priority multipliers ──

const SEVERITY_MULTIPLIER: Record<AnnotationType, number> = {
  critical: 1.0,
  warning: 0.75,
  opportunity: 0.5,
  positive: 0.1,
};

const IMPACT_BONUS: Record<string, number> = {
  high: 10,
  medium: 5,
  low: 0,
};

// ── Main engine ──────────────────────────────────────────

/**
 * Generate prescriptions from scan findings.
 * Returns up to `maxResults` prescriptions sorted by priority (highest first).
 */
export function generatePrescriptions(
  stages: Partial<Record<FunnelStage, StageState>>,
  maxResults: number = 5,
): Prescription[] {
  const prescriptions: Prescription[] = [];
  const usedServices = new Set<string>();

  const stageOrder: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];

  for (const stage of stageOrder) {
    const stageState = stages[stage];
    if (!stageState?.summary) continue;

    for (const finding of stageState.summary.findings) {
      // Skip positive findings — nothing to prescribe
      if (finding.type === 'positive') continue;

      // Find the best matching rule
      const matchedRule = RULES.find((rule) => {
        if (!rule.types.includes(finding.type)) return false;
        if (!rule.stages.includes(stage)) return false;
        const titleLower = finding.title.toLowerCase();
        return rule.titleKeywords.some((kw) => titleLower.includes(kw));
      });

      let prescription: Prescription;

      if (matchedRule) {
        // Skip if we already have a prescription for this service (avoid duplicates)
        if (usedServices.has(matchedRule.template.serviceName)) continue;
        usedServices.add(matchedRule.template.serviceName);

        const priority = Math.round(
          matchedRule.template.basePriority *
            SEVERITY_MULTIPLIER[finding.type] +
            IMPACT_BONUS[finding.impact],
        );

        prescription = {
          id: `rx-${stage}-${finding.id}`,
          findingId: finding.id,
          stage,
          severity: finding.type,
          problem: finding.title,
          whyItMatters: finding.detail,
          forgeFix: matchedRule.template.forgeFix,
          expectedOutcome: matchedRule.template.expectedOutcome,
          effort: matchedRule.template.effort,
          priceTier: matchedRule.template.priceTier,
          priority,
          serviceName: matchedRule.template.serviceName,
        };
      } else {
        const fallback = buildFallbackPrescription(finding, stage);
        if (usedServices.has(fallback.serviceName)) continue;
        usedServices.add(fallback.serviceName);

        prescription = {
          id: `rx-${stage}-${finding.id}`,
          findingId: finding.id,
          ...fallback,
        };
      }

      prescriptions.push(prescription);
    }
  }

  // Sort by priority descending, take top N
  return prescriptions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxResults);
}

/**
 * Get a human-readable label for a price tier.
 */
export function priceTierLabel(tier: PriceTier): string {
  const labels: Record<PriceTier, string> = {
    starter: 'Quick Fix',
    growth: 'Growth Package',
    scale: 'Full Build',
  };
  return labels[tier];
}

/**
 * Get an effort label for display.
 */
export function effortLabel(effort: Prescription['effort']): string {
  const labels: Record<Prescription['effort'], string> = {
    'quick-win': '1-2 Days',
    'half-day': '3-5 Days',
    'multi-day': '1-2 Weeks',
  };
  return labels[effort];
}
