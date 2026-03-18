// /src/lib/ai/annotate.ts
// Screenshot annotation pipeline — sends screenshots to Sonnet for analysis

import type { Annotation, FunnelStage, StageSummary } from '@/../../contracts/types';
import { analyzeWithSonnet, extractJSON } from './client';
import { getAnnotationPrompt } from '../prompts/annotation';
import { getStageSummaryPrompt } from '../prompts/stage-summary';

// ============================================================
// Annotate a single screenshot
// ============================================================

interface AnnotationResult {
  annotations: Array<{
    id: string;
    position: { x: number; y: number; width?: number; height?: number };
    type: 'critical' | 'warning' | 'opportunity' | 'positive';
    title: string;
    detail: string;
    category: string;
  }>;
}

export async function annotateScreenshot(
  screenshotBase64: string,
  stage: FunnelStage,
  businessContext?: string,
): Promise<Annotation[]> {
  const systemPrompt = getAnnotationPrompt(stage, businessContext);

  const result = await analyzeWithSonnet({
    systemPrompt,
    userPrompt: 'Analyze this screenshot and return annotations as specified.',
    images: [
      {
        type: 'base64',
        media_type: 'image/png',
        data: screenshotBase64,
      },
    ],
    maxTokens: 4096,
  });

  try {
    const parsed = extractJSON<AnnotationResult>(result);
    return validateAnnotations(parsed.annotations, stage);
  } catch (error) {
    console.error(`[annotate] Failed to parse annotations for ${stage}:`, error);
    console.error(`[annotate] Raw response:`, result.slice(0, 500));

    // Return a single fallback annotation indicating analysis failure
    return [
      {
        id: `${stage}-parse-error`,
        position: { x: 50, y: 50 },
        type: 'warning',
        title: 'Analysis could not be completed',
        detail:
          'The AI analysis for this screenshot could not be fully processed. This area will be re-analyzed during the next scan.',
        category: 'system',
      },
    ];
  }
}

// ============================================================
// Annotate multiple screenshots for a stage
// ============================================================

export async function annotateStageScreenshots(
  screenshots: Array<{ id: string; base64: string }>,
  stage: FunnelStage,
  businessContext?: string,
): Promise<Map<string, Annotation[]>> {
  const results = new Map<string, Annotation[]>();

  // Process screenshots in parallel (max 3 concurrent to respect rate limits)
  const concurrencyLimit = 3;
  const chunks: Array<Array<{ id: string; base64: string }>> = [];
  for (let i = 0; i < screenshots.length; i += concurrencyLimit) {
    chunks.push(screenshots.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(async (screenshot) => {
        const annotations = await annotateScreenshot(
          screenshot.base64,
          stage,
          businessContext,
        );
        return { id: screenshot.id, annotations };
      }),
    );

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.set(result.value.id, result.value.annotations);
      } else {
        console.error(`[annotate] Screenshot annotation failed:`, result.reason);
      }
    }
  }

  return results;
}

// ============================================================
// Generate a stage summary from all annotations
// ============================================================

export async function generateStageSummary(
  stage: FunnelStage,
  annotations: Annotation[],
  screenshotCount: number,
  businessContext?: string,
): Promise<StageSummary> {
  // If no annotations, the stage doesn't exist or wasn't captured
  if (annotations.length === 0) {
    return {
      exists: false,
      score: 0,
      headline: `No ${getStageLabel(stage).toLowerCase()} data was found to analyze.`,
      findings: [],
    };
  }

  const systemPrompt = getStageSummaryPrompt(
    stage,
    annotations,
    screenshotCount,
    businessContext,
  );

  const result = await analyzeWithSonnet({
    systemPrompt,
    userPrompt: 'Generate the stage summary from the annotation data provided.',
    maxTokens: 2048,
  });

  try {
    const parsed = extractJSON<StageSummary>(result);
    return validateStageSummary(parsed, stage);
  } catch (error) {
    console.error(`[annotate] Failed to parse stage summary for ${stage}:`, error);

    // Build a fallback summary from the annotations directly
    return buildFallbackSummary(stage, annotations);
  }
}

// ============================================================
// Validation helpers
// ============================================================

function validateAnnotations(
  raw: AnnotationResult['annotations'],
  stage: FunnelStage,
): Annotation[] {
  return raw
    .filter((a) => {
      // Validate required fields exist
      if (!a.id || !a.position || !a.type || !a.title || !a.detail) return false;
      // Validate position range
      if (a.position.x < 0 || a.position.x > 100) return false;
      if (a.position.y < 0 || a.position.y > 100) return false;
      // Validate type
      const validTypes = ['critical', 'warning', 'opportunity', 'positive'];
      if (!validTypes.includes(a.type)) return false;
      return true;
    })
    .map((a) => ({
      id: `${stage}-${a.id}`,
      position: {
        x: Math.round(a.position.x * 100) / 100,
        y: Math.round(a.position.y * 100) / 100,
        ...(a.position.width !== undefined && { width: a.position.width }),
        ...(a.position.height !== undefined && { height: a.position.height }),
      },
      type: a.type,
      title: a.title.slice(0, 80),
      detail: a.detail.slice(0, 500),
      category: a.category || 'general',
    }));
}

function validateStageSummary(
  raw: StageSummary,
  stage: FunnelStage,
): StageSummary {
  return {
    exists: raw.exists !== false,
    score: Math.max(0, Math.min(100, Math.round(raw.score))),
    headline: raw.headline?.slice(0, 200) || `${getStageLabel(stage)} analysis complete.`,
    findings: (raw.findings || []).map((f) => ({
      id: f.id || `${stage}-finding-${Math.random().toString(36).slice(2, 8)}`,
      title: f.title?.slice(0, 100) || 'Finding',
      detail: f.detail?.slice(0, 500) || '',
      type: (['critical', 'warning', 'opportunity', 'positive'].includes(f.type)
        ? f.type
        : 'warning') as 'critical' | 'warning' | 'opportunity' | 'positive',
      impact: (['high', 'medium', 'low'].includes(f.impact)
        ? f.impact
        : 'medium') as 'high' | 'medium' | 'low',
    })),
  };
}

function buildFallbackSummary(
  stage: FunnelStage,
  annotations: Annotation[],
): StageSummary {
  const criticalCount = annotations.filter((a) => a.type === 'critical').length;
  const warningCount = annotations.filter((a) => a.type === 'warning').length;
  const positiveCount = annotations.filter((a) => a.type === 'positive').length;

  // Score: start at 70, subtract for issues, add for positives
  const score = Math.max(
    0,
    Math.min(100, 70 - criticalCount * 15 - warningCount * 5 + positiveCount * 5),
  );

  return {
    exists: true,
    score,
    headline: `${getStageLabel(stage)}: ${criticalCount} critical issues found across ${annotations.length} observations.`,
    findings: annotations
      .filter((a) => a.type === 'critical' || a.type === 'warning')
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        detail: a.detail,
        type: a.type,
        impact: a.type === 'critical' ? ('high' as const) : ('medium' as const),
      })),
  };
}

function getStageLabel(stage: FunnelStage): string {
  const labels: Record<FunnelStage, string> = {
    traffic: 'Traffic Sources',
    landing: 'Landing Experience',
    capture: 'Lead Capture',
    offer: 'Offer & Conversion',
    followup: 'Follow-up & Retention',
  };
  return labels[stage];
}
