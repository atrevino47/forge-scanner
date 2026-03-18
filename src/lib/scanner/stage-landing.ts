// /src/lib/scanner/stage-landing.ts
// Landing Experience stage analyzer
// Analyzes website homepage and key landing pages

import type {
  Annotation,
  FunnelStage,
  FunnelStageResult,
  ScreenshotData,
  StageSummary,
} from '@/../../contracts/types';
import { annotateStageScreenshots, generateStageSummary } from '../ai/annotate';
import { analyzeWithHaiku, extractJSON } from '../ai/client';
import { createStageResult } from './utils';

const STAGE: FunnelStage = 'landing';

export type StageUpdateCallback = (
  stage: FunnelStage,
  update: Partial<FunnelStageResult>,
) => Promise<void>;

export type AnnotationReadyCallback = (
  screenshotId: string,
  annotations: Annotation[],
) => Promise<void>;

// ============================================================
// Technical check types (Haiku-powered)
// ============================================================

interface TechnicalCheckResult {
  mobileResponsive: boolean;
  hasSSL: boolean;
  loadTimeEstimate: 'fast' | 'moderate' | 'slow';
  hasFavicon: boolean;
  hasMetaDescription: boolean;
  hasOpenGraph: boolean;
  issues: string[];
}

// ============================================================
// Main landing stage analysis
// ============================================================

export interface LandingStageInput {
  screenshots: ScreenshotData[];
  screenshotFetcher: (storageUrl: string) => Promise<string>;
  businessContext?: string;
  pageHtml?: string; // Raw HTML for technical checks
  pageUrl?: string;
}

export async function analyzeLandingStage(
  input: LandingStageInput,
  onUpdate: StageUpdateCallback,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<FunnelStageResult> {
  const { screenshots, screenshotFetcher, businessContext, pageHtml } = input;

  if (screenshots.length === 0) {
    const summary: StageSummary = {
      exists: false,
      score: 0,
      headline: 'No landing page screenshots were captured for analysis.',
      findings: [],
    };
    const result = createStageResult(STAGE, 'completed', summary, []);
    await onUpdate(STAGE, result);
    return result;
  }

  await onUpdate(STAGE, { status: 'analyzing', startedAt: new Date().toISOString() });

  // Run visual annotation and technical checks in parallel
  const [annotationResults, technicalResults] = await Promise.allSettled([
    annotateScreenshots(screenshots, screenshotFetcher, businessContext, onAnnotationReady),
    pageHtml ? runTechnicalChecks(pageHtml) : Promise.resolve(null),
  ]);

  // Collect annotations
  const allAnnotations: Annotation[] = [];
  const updatedScreenshots = [...screenshots];

  if (annotationResults.status === 'fulfilled') {
    const annotationMap = annotationResults.value;
    for (let i = 0; i < updatedScreenshots.length; i++) {
      const annotations = annotationMap.get(updatedScreenshots[i].id);
      if (annotations) {
        updatedScreenshots[i] = {
          ...updatedScreenshots[i],
          annotations,
          analyzedAt: new Date().toISOString(),
        };
        allAnnotations.push(...annotations);
      }
    }
  } else {
    console.error('[stage-landing] Annotation failed:', annotationResults.reason);
  }

  // Add technical check annotations
  if (technicalResults.status === 'fulfilled' && technicalResults.value) {
    allAnnotations.push(...technicalToAnnotations(technicalResults.value));
  }

  // Generate stage summary
  const summary = await generateStageSummary(
    STAGE,
    allAnnotations,
    screenshots.length,
    businessContext,
  );

  const result = createStageResult(STAGE, 'completed', summary, updatedScreenshots);
  await onUpdate(STAGE, result);
  return result;
}

// ============================================================
// Internal helpers
// ============================================================

async function annotateScreenshots(
  screenshots: ScreenshotData[],
  screenshotFetcher: (url: string) => Promise<string>,
  businessContext?: string,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<Map<string, Annotation[]>> {
  const inputs: Array<{ id: string; base64: string }> = [];
  for (const screenshot of screenshots) {
    try {
      const base64 = await screenshotFetcher(screenshot.storageUrl);
      inputs.push({ id: screenshot.id, base64 });
    } catch (error) {
      console.error(`[stage-landing] Failed to fetch screenshot ${screenshot.id}:`, error);
    }
  }

  const results = await annotateStageScreenshots(inputs, STAGE, businessContext);

  if (onAnnotationReady) {
    for (const [screenshotId, annotations] of results) {
      await onAnnotationReady(screenshotId, annotations);
    }
  }

  return results;
}

/**
 * Use Haiku for fast technical checks on the page HTML.
 * These are formulaic checks that don't need Sonnet-level reasoning.
 */
async function runTechnicalChecks(
  html: string,
): Promise<TechnicalCheckResult> {
  // Truncate HTML to avoid token limits — Haiku checks are about presence, not full parsing
  const truncatedHtml = html.slice(0, 15000);

  const result = await analyzeWithHaiku({
    systemPrompt: `You are a technical web auditor. Analyze the HTML and detect technical quality signals.

Return ONLY valid JSON:
{
  "mobileResponsive": boolean (look for viewport meta tag and responsive CSS indicators),
  "hasSSL": boolean (check if resources reference https),
  "loadTimeEstimate": "fast" | "moderate" | "slow" (based on script count, image count, external resource count),
  "hasFavicon": boolean,
  "hasMetaDescription": boolean,
  "hasOpenGraph": boolean (og: meta tags),
  "issues": ["string array of specific technical issues found"]
}`,
    userPrompt: `Analyze this HTML:\n\n${truncatedHtml}`,
    maxTokens: 1024,
  });

  try {
    return extractJSON<TechnicalCheckResult>(result);
  } catch {
    return {
      mobileResponsive: true,
      hasSSL: true,
      loadTimeEstimate: 'moderate',
      hasFavicon: true,
      hasMetaDescription: true,
      hasOpenGraph: false,
      issues: [],
    };
  }
}

function technicalToAnnotations(checks: TechnicalCheckResult): Annotation[] {
  const annotations: Annotation[] = [];

  if (!checks.mobileResponsive) {
    annotations.push({
      id: 'landing-tech-mobile',
      position: { x: 50, y: 10 },
      type: 'critical',
      title: 'Not mobile responsive',
      detail:
        'No viewport meta tag or responsive CSS detected. Over 60% of web traffic is mobile — this page is likely broken on phones and tablets, causing massive bounce rates.',
      category: 'mobile_ux',
    });
  }

  if (!checks.hasSSL) {
    annotations.push({
      id: 'landing-tech-ssl',
      position: { x: 90, y: 5 },
      type: 'critical',
      title: 'Missing SSL certificate',
      detail:
        'Page resources reference HTTP instead of HTTPS. Browsers show "Not Secure" warnings, killing trust instantly. Google also penalizes non-HTTPS sites in search rankings.',
      category: 'security',
    });
  }

  if (checks.loadTimeEstimate === 'slow') {
    annotations.push({
      id: 'landing-tech-speed',
      position: { x: 50, y: 50 },
      type: 'warning',
      title: 'Page load likely slow',
      detail:
        'High number of scripts, images, or external resources detected. Pages loading over 3 seconds lose 53% of mobile visitors. Consider lazy loading and resource optimization.',
      category: 'performance',
    });
  }

  if (!checks.hasMetaDescription) {
    annotations.push({
      id: 'landing-tech-meta',
      position: { x: 50, y: 5 },
      type: 'warning',
      title: 'Missing meta description',
      detail:
        'No meta description tag found. Search engines will auto-generate a snippet, often pulling irrelevant text. A custom meta description can improve click-through rates by 5-10%.',
      category: 'seo',
    });
  }

  if (!checks.hasOpenGraph) {
    annotations.push({
      id: 'landing-tech-og',
      position: { x: 50, y: 5 },
      type: 'opportunity',
      title: 'No Open Graph tags',
      detail:
        'Missing og: meta tags means shared links on social media will show generic previews instead of branded images and descriptions. Adding OG tags increases share click-through by 2-3x.',
      category: 'social_sharing',
    });
  }

  for (const issue of checks.issues.slice(0, 3)) {
    annotations.push({
      id: `landing-tech-issue-${Math.random().toString(36).slice(2, 8)}`,
      position: { x: 50, y: 50 },
      type: 'warning',
      title: issue.slice(0, 80),
      detail: issue,
      category: 'technical',
    });
  }

  return annotations;
}
