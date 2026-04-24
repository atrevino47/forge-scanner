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
    total_leak_12mo: validateTotalLeak(raw.total_leak_12mo),
    money_model: validateMoneyModel(raw.money_model),
  };
}

function validateTotalLeak(raw: FunnelMapData['total_leak_12mo']): FunnelMapData['total_leak_12mo'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const min = Math.max(0, Math.round(Number(raw.min_usd) || 0));
  const max = Math.max(min, Math.round(Number(raw.max_usd) || 0));
  const display = typeof raw.display === 'string' && raw.display.length > 0 ? raw.display.slice(0, 40) : `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (max === 0) return undefined;
  return { min_usd: min, max_usd: max, display };
}

const VALID_LAYER_KEYS = ['attraction', 'front_end_cash', 'upsell_downsell', 'continuity'] as const;
const VALID_LAYER_STATUS = ['good', 'weak', 'missing'] as const;

function validateMoneyModel(raw: FunnelMapData['money_model']): FunnelMapData['money_model'] {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.layers)) return undefined;
  const byKey = new Map<string, typeof raw.layers[number]>();
  for (const layer of raw.layers) {
    if (layer && VALID_LAYER_KEYS.includes(layer.key as typeof VALID_LAYER_KEYS[number])) {
      byKey.set(layer.key, layer);
    }
  }
  const layers = VALID_LAYER_KEYS.map((key) => {
    const l = byKey.get(key);
    return {
      key,
      status: (l && VALID_LAYER_STATUS.includes(l.status as typeof VALID_LAYER_STATUS[number]) ? l.status : 'missing') as 'good' | 'weak' | 'missing',
      note: (l?.note ?? '').toString().slice(0, 320),
      leak_12mo_usd: Math.max(0, Math.round(Number(l?.leak_12mo_usd) || 0)),
      is_biggest: Boolean(l?.is_biggest),
    };
  });
  // Enforce exactly one is_biggest — pick the highest leak if multiple or zero set.
  const marked = layers.filter((l) => l.is_biggest);
  if (marked.length !== 1) {
    const top = [...layers].sort((a, b) => b.leak_12mo_usd - a.leak_12mo_usd)[0];
    for (const l of layers) l.is_biggest = l.key === top.key;
  }
  const biggest = layers.find((l) => l.is_biggest)!;
  const biggestKey = VALID_LAYER_KEYS.includes(raw.biggest_leak_key as typeof VALID_LAYER_KEYS[number])
    ? (raw.biggest_leak_key as typeof VALID_LAYER_KEYS[number])
    : biggest.key;
  const callout = typeof raw.biggest_leak_callout === 'string' && raw.biggest_leak_callout.length > 0
    ? raw.biggest_leak_callout.slice(0, 400)
    : `The ${biggestKey.replace(/_/g, ' ')} layer is the single biggest revenue leak in the current Money Model.`;
  return {
    layers,
    biggest_leak_key: biggestKey,
    biggest_leak_callout: callout,
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
