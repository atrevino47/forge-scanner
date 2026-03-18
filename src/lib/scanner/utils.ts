// /src/lib/scanner/utils.ts
// Shared utilities for scanner stage analyzers

import type {
  Annotation,
  FunnelStage,
  FunnelStageResult,
  ScreenshotData,
  StageSummary,
  StageStatus,
} from '@/../../contracts/types';

// ============================================================
// Score calculation from annotations
// ============================================================

/**
 * Calculate a health score (0-100) from annotations.
 * Used as a quick estimate when AI summary isn't available.
 */
export function calculateScoreFromAnnotations(annotations: Annotation[]): number {
  if (annotations.length === 0) return 0;

  let score = 70; // baseline

  for (const a of annotations) {
    switch (a.type) {
      case 'critical':
        score -= 15;
        break;
      case 'warning':
        score -= 5;
        break;
      case 'opportunity':
        score -= 2;
        break;
      case 'positive':
        score += 5;
        break;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// Overall scan score from stages
// ============================================================

/**
 * Calculate overall funnel health from individual stage scores.
 * Weights stages by their impact on revenue conversion.
 */
export function calculateOverallScore(
  stages: FunnelStageResult[],
): number {
  const weights: Record<FunnelStage, number> = {
    traffic: 0.15,
    landing: 0.30,
    capture: 0.25,
    offer: 0.20,
    followup: 0.10,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const stage of stages) {
    if (stage.summary && stage.status === 'completed') {
      const weight = weights[stage.stage];
      weightedSum += stage.summary.score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

// ============================================================
// Stage result builder
// ============================================================

export function createStageResult(
  stage: FunnelStage,
  status: StageStatus,
  summary: StageSummary | null = null,
  screenshots: ScreenshotData[] = [],
): FunnelStageResult {
  return {
    stage,
    status,
    summary,
    screenshots,
    startedAt: status !== 'pending' ? new Date().toISOString() : null,
    completedAt: status === 'completed' || status === 'failed'
      ? new Date().toISOString()
      : null,
  };
}

// ============================================================
// Group screenshots by stage
// ============================================================

export function groupScreenshotsByStage(
  screenshots: ScreenshotData[],
): Record<FunnelStage, ScreenshotData[]> {
  const grouped: Record<FunnelStage, ScreenshotData[]> = {
    traffic: [],
    landing: [],
    capture: [],
    offer: [],
    followup: [],
  };

  for (const screenshot of screenshots) {
    if (screenshot.stage in grouped) {
      grouped[screenshot.stage].push(screenshot);
    }
  }

  return grouped;
}

// ============================================================
// Count annotations by type
// ============================================================

export interface AnnotationCounts {
  critical: number;
  warning: number;
  opportunity: number;
  positive: number;
  total: number;
}

export function countAnnotations(annotations: Annotation[]): AnnotationCounts {
  const counts: AnnotationCounts = {
    critical: 0,
    warning: 0,
    opportunity: 0,
    positive: 0,
    total: annotations.length,
  };

  for (const a of annotations) {
    counts[a.type]++;
  }

  return counts;
}

// ============================================================
// Stage label helpers
// ============================================================

export const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic Sources',
  landing: 'Landing Experience',
  capture: 'Lead Capture',
  offer: 'Offer & Conversion',
  followup: 'Follow-up & Retention',
};

export const STAGE_ORDER: FunnelStage[] = [
  'traffic',
  'landing',
  'capture',
  'offer',
  'followup',
];

// ============================================================
// Business context builder
// ============================================================

/**
 * Build a business context string from available scan data.
 * Passed to annotation prompts for more specific analysis.
 */
export function buildBusinessContext(params: {
  websiteUrl: string;
  businessName?: string | null;
  detectedSocials?: Record<string, { handle: string; url: string }>;
}): string {
  const parts: string[] = [];

  parts.push(`Website: ${params.websiteUrl}`);

  if (params.businessName) {
    parts.push(`Business name: ${params.businessName}`);
  }

  if (params.detectedSocials) {
    const platforms = Object.entries(params.detectedSocials)
      .map(([platform, data]) => `${platform}: ${data.handle}`)
      .join(', ');
    if (platforms) {
      parts.push(`Social profiles detected: ${platforms}`);
    }
  }

  return parts.join('\n');
}
