// /src/lib/blueprint/funnel-map.ts
// Takes all stage results and generates FunnelMapData
// showing current state vs ideal for each stage

import type {
  FunnelMapData,
  FunnelMapNode,
  FunnelStage,
  ScanResult,
} from '@/../../contracts/types';
import { analyzeWithSonnet, extractJSON } from '../ai/client';
import { getFunnelMapPrompt } from '../prompts/funnel-map';
import { calculateOverallScore, STAGE_ORDER } from '../scanner/utils';

// ============================================================
// Generate funnel map from scan results
// ============================================================

export async function generateFunnelMap(
  scanResult: ScanResult,
  businessName?: string | null,
): Promise<FunnelMapData> {
  const prompt = getFunnelMapPrompt(
    scanResult.stages,
    scanResult.websiteUrl,
    businessName,
  );

  const result = await analyzeWithSonnet({
    systemPrompt: prompt,
    userPrompt:
      'Analyze the scan data and generate the funnel map comparing current state to ideal state for each stage.',
    maxTokens: 4096,
  });

  try {
    const parsed = extractJSON<FunnelMapData>(result);
    return validateFunnelMap(parsed, scanResult);
  } catch (error) {
    console.error('[funnel-map] Failed to parse funnel map:', error);
    return buildFallbackFunnelMap(scanResult);
  }
}

// ============================================================
// Validation
// ============================================================

const VALID_STAGES: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];
const VALID_HEALTH = ['good', 'weak', 'missing'] as const;

function validateFunnelMap(
  raw: FunnelMapData,
  scanResult: ScanResult,
): FunnelMapData {
  // Ensure all 5 stages are present and in order
  const nodeMap = new Map<FunnelStage, FunnelMapNode>();
  for (const node of raw.nodes ?? []) {
    if (VALID_STAGES.includes(node.stage as FunnelStage)) {
      nodeMap.set(node.stage as FunnelStage, node);
    }
  }

  const validatedNodes: FunnelMapNode[] = STAGE_ORDER.map((stage) => {
    const node = nodeMap.get(stage);
    const stageResult = scanResult.stages.find((s) => s.stage === stage);

    if (node) {
      return {
        stage,
        label: (node.label || getDefaultLabel(stage)).slice(0, 50),
        exists: node.exists ?? (stageResult?.summary?.exists !== false),
        health: VALID_HEALTH.includes(node.health as typeof VALID_HEALTH[number])
          ? node.health
          : inferHealth(stageResult?.summary?.score),
        currentDescription: (node.currentDescription || 'No data available.').slice(0, 500),
        idealDescription: (node.idealDescription || 'Not yet analyzed.').slice(0, 500),
        improvements: (node.improvements || []).slice(0, 5).map((s) => String(s).slice(0, 200)),
      };
    }

    // Missing node — build from stage result
    return buildNodeFromStageResult(stage, stageResult);
  });

  // Validate biggestGap
  const biggestGap = VALID_STAGES.includes(raw.biggestGap as FunnelStage)
    ? raw.biggestGap
    : findBiggestGap(validatedNodes);

  return {
    nodes: validatedNodes,
    overallHealth: Math.max(0, Math.min(100, Math.round(raw.overallHealth ?? calculateOverallScore(scanResult.stages)))),
    biggestGap,
    revenueImpactEstimate: (raw.revenueImpactEstimate || 'Fixing the weakest funnel stage could significantly increase lead flow and conversion rates.').slice(0, 600),
  };
}

// ============================================================
// Fallback builder
// ============================================================

function buildFallbackFunnelMap(scanResult: ScanResult): FunnelMapData {
  const nodes: FunnelMapNode[] = STAGE_ORDER.map((stage) => {
    const stageResult = scanResult.stages.find((s) => s.stage === stage);
    return buildNodeFromStageResult(stage, stageResult);
  });

  const biggestGap = findBiggestGap(nodes);
  const gapNode = nodes.find((n) => n.stage === biggestGap);

  return {
    nodes,
    overallHealth: calculateOverallScore(scanResult.stages),
    biggestGap,
    revenueImpactEstimate: gapNode
      ? `The ${getDefaultLabel(biggestGap)} stage is the biggest bottleneck in this funnel. Addressing the ${gapNode.improvements.length} identified improvements could significantly increase conversion rates and revenue.`
      : 'Multiple stages need attention to build a functioning sales funnel.',
  };
}

function buildNodeFromStageResult(
  stage: FunnelStage,
  stageResult?: { summary?: { exists: boolean; score: number; headline: string; findings: Array<{ title: string; detail: string; type: string; impact: string }> } | null },
): FunnelMapNode {
  const summary = stageResult?.summary;
  const score = summary?.score ?? 0;
  const exists = summary?.exists !== false;

  return {
    stage,
    label: getDefaultLabel(stage),
    exists,
    health: inferHealth(score),
    currentDescription: summary?.headline || `The ${getDefaultLabel(stage).toLowerCase()} stage was not fully analyzed.`,
    idealDescription: getIdealDescription(stage),
    improvements: (summary?.findings ?? [])
      .filter((f) => f.type === 'critical' || f.type === 'warning' || f.type === 'opportunity')
      .slice(0, 4)
      .map((f) => f.title),
  };
}

// ============================================================
// Helpers
// ============================================================

function inferHealth(score?: number): 'good' | 'weak' | 'missing' {
  if (score === undefined || score === null) return 'missing';
  if (score >= 70) return 'good';
  if (score >= 30) return 'weak';
  return 'missing';
}

function findBiggestGap(nodes: FunnelMapNode[]): FunnelStage {
  // Weight by funnel position — downstream gaps are more impactful
  const impactWeights: Record<FunnelStage, number> = {
    traffic: 1.0,
    landing: 1.5,
    capture: 1.8,
    offer: 1.6,
    followup: 1.2,
  };

  let worstStage: FunnelStage = 'landing';
  let worstScore = Infinity;

  for (const node of nodes) {
    const healthScore =
      node.health === 'missing' ? 0 : node.health === 'weak' ? 40 : 80;
    const weighted = healthScore / impactWeights[node.stage];
    if (weighted < worstScore) {
      worstScore = weighted;
      worstStage = node.stage;
    }
  }

  return worstStage;
}

function getDefaultLabel(stage: FunnelStage): string {
  const labels: Record<FunnelStage, string> = {
    traffic: 'Traffic Sources',
    landing: 'Landing Experience',
    capture: 'Lead Capture',
    offer: 'Offer & Conversion',
    followup: 'Follow-up & Retention',
  };
  return labels[stage];
}

function getIdealDescription(stage: FunnelStage): string {
  const ideals: Record<FunnelStage, string> = {
    traffic:
      'Active, consistent presence across 2-3 social platforms with optimized bios, strategic content calendar, and clear CTAs driving traffic to the website. Paid ads supplementing organic reach.',
    landing:
      'Clear value proposition visible within 5 seconds. Compelling headline addressing a specific pain point. Single primary CTA above the fold. Trust signals (testimonials, logos, certifications) visible without scrolling. Mobile-optimized.',
    capture:
      'High-value lead magnet exchanged for contact info. Minimal form fields (name + email). Compelling, specific CTA copy. Exit intent mechanism. Chat widget for high-intent visitors. Multiple capture points throughout the site.',
    offer:
      'Clear pricing or service tiers with differentiation. Value communicated through outcomes, not features. Risk reversal (guarantee). Social proof adjacent to pricing. Urgency without manipulation. Frictionless next step.',
    followup:
      'Meta Pixel + Google Analytics installed. Email nurture sequence triggered on signup. Retargeting ads running to website visitors. Blog/content strategy for SEO and nurture. Review management active. Cookie consent compliant.',
  };
  return ideals[stage];
}
