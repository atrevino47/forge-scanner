// /src/lib/scanner/orchestrator.ts
// Coordinates all 5 funnel stage analyses in parallel
// Central entry point for the scan analysis pipeline

import type {
  AdDetectionResult,
  Annotation,
  FunnelStage,
  FunnelStageResult,
  ScreenshotData,
  SocialEnrichmentResult,
  StageSummary,
  VideoAnalysis,
} from '@/../../contracts/types';
import type { ScanCompletedSummary } from '@/../../contracts/events';
import type { ProfileVideoData } from '../ai/video-analysis';
import { analyzeTrafficStage } from './stage-traffic';
import { analyzeLandingStage } from './stage-landing';
import { analyzeCaptureStage } from './stage-capture';
import { analyzeOfferStage } from './stage-offer';
import { analyzeFollowupStage } from './stage-followup';
import {
  calculateOverallScore,
  groupScreenshotsByStage,
  STAGE_ORDER,
  createStageResult,
} from './utils';

// ============================================================
// Event callbacks for SSE streaming
// ============================================================

export interface ScanEventCallbacks {
  /** Called when a stage's status or results change */
  onStageUpdate: (stage: FunnelStage, update: Partial<FunnelStageResult>) => Promise<void>;

  /** Called when annotations are ready for a specific screenshot */
  onAnnotationReady: (screenshotId: string, annotations: Annotation[]) => Promise<void>;

  /** Called when video analysis completes for a platform */
  onVideoAnalysis: (
    platform: 'instagram' | 'tiktok' | 'youtube',
    analysis: VideoAnalysis,
  ) => Promise<void>;

  /** Called when a stage completes with its summary */
  onStageCompleted: (stage: FunnelStage, summary: StageSummary) => Promise<void>;

  /** Called when a stage fails */
  onStageFailed: (stage: FunnelStage, error: string) => Promise<void>;

  /** Called when the entire scan completes */
  onScanCompleted: (summary: ScanCompletedSummary) => Promise<void>;
}

// ============================================================
// Scan analysis input
// ============================================================

export interface ScanAnalysisInput {
  scanId: string;
  websiteUrl: string;
  screenshots: ScreenshotData[];
  businessContext?: string;
  businessName?: string | null;

  /** Fetch base64 screenshot data from a storage URL */
  screenshotFetcher: (storageUrl: string) => Promise<string>;

  /** Raw HTML for the homepage (for technical checks) */
  homepageHtml?: string;

  /** Video data for social profiles (traffic stage) */
  videoData?: ProfileVideoData[];

  /** Meta Ad Library detection results (traffic stage) */
  adDetection?: AdDetectionResult;

  /** Apify social profile metrics (traffic stage) */
  socialEnrichment?: SocialEnrichmentResult;
}

// ============================================================
// Main orchestrator
// ============================================================

export async function runScanAnalysis(
  input: ScanAnalysisInput,
  callbacks: ScanEventCallbacks,
): Promise<FunnelStageResult[]> {
  const {
    screenshots,
    screenshotFetcher,
    businessContext,
    homepageHtml,
    videoData,
    adDetection,
    socialEnrichment,
  } = input;

  // Group screenshots by stage
  const grouped = groupScreenshotsByStage(screenshots);

  // Build stage update callback that also emits completion events
  const makeStageCallback = (stage: FunnelStage) => {
    return async (_s: FunnelStage, update: Partial<FunnelStageResult>) => {
      await callbacks.onStageUpdate(stage, update);

      // If this update marks the stage as completed, emit the completion event
      if (update.status === 'completed' && update.summary) {
        await callbacks.onStageCompleted(stage, update.summary);
      }
    };
  };

  // Run all 5 stages in parallel using Promise.allSettled
  // If one stage fails, others continue
  const stagePromises: Array<Promise<FunnelStageResult>> = [
    // Traffic Sources
    runStageWithErrorHandling(
      'traffic',
      () =>
        analyzeTrafficStage(
          {
            screenshots: grouped.traffic,
            screenshotFetcher,
            businessContext,
            videoData,
            adDetection,
            socialEnrichment,
          },
          makeStageCallback('traffic'),
          callbacks.onAnnotationReady,
          callbacks.onVideoAnalysis,
        ),
      callbacks,
    ),

    // Landing Experience
    runStageWithErrorHandling(
      'landing',
      () =>
        analyzeLandingStage(
          {
            screenshots: grouped.landing,
            screenshotFetcher,
            businessContext,
            pageHtml: homepageHtml,
          },
          makeStageCallback('landing'),
          callbacks.onAnnotationReady,
        ),
      callbacks,
    ),

    // Lead Capture
    runStageWithErrorHandling(
      'capture',
      () =>
        analyzeCaptureStage(
          {
            screenshots: grouped.capture,
            screenshotFetcher,
            businessContext,
            pageHtml: homepageHtml,
          },
          makeStageCallback('capture'),
          callbacks.onAnnotationReady,
        ),
      callbacks,
    ),

    // Offer & Conversion
    runStageWithErrorHandling(
      'offer',
      () =>
        analyzeOfferStage(
          {
            screenshots: grouped.offer,
            screenshotFetcher,
            businessContext,
          },
          makeStageCallback('offer'),
          callbacks.onAnnotationReady,
        ),
      callbacks,
    ),

    // Follow-up & Retention
    runStageWithErrorHandling(
      'followup',
      () =>
        analyzeFollowupStage(
          {
            screenshots: grouped.followup,
            screenshotFetcher,
            businessContext,
            pageHtml: homepageHtml,
          },
          makeStageCallback('followup'),
          callbacks.onAnnotationReady,
        ),
      callbacks,
    ),
  ];

  const results = await Promise.all(stagePromises);

  // Calculate overall scan summary
  const overallHealth = calculateOverallScore(results);
  const completedStages = results.filter((r) => r.status === 'completed');
  const failedStages = results.filter((r) => r.status === 'failed');
  const allAnnotations = results.flatMap((r) =>
    r.screenshots.flatMap((s) => s.annotations),
  );
  const criticalCount = allAnnotations.filter((a) => a.type === 'critical').length;

  // Find the top finding across all stages
  const topFinding = findTopFinding(results);

  const completedSummary: ScanCompletedSummary = {
    overallHealth,
    stagesFound: completedStages.filter((r) => r.summary?.exists !== false).length,
    stagesMissing: completedStages.filter((r) => r.summary?.exists === false).length,
    criticalIssues: criticalCount,
    topFinding,
  };

  await callbacks.onScanCompleted(completedSummary);

  return results;
}

// ============================================================
// Error handling wrapper
// ============================================================

async function runStageWithErrorHandling(
  stage: FunnelStage,
  fn: () => Promise<FunnelStageResult>,
  callbacks: ScanEventCallbacks,
): Promise<FunnelStageResult> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
    console.error(`[orchestrator] Stage ${stage} failed:`, error);

    await callbacks.onStageFailed(stage, errorMessage);

    return createStageResult(stage, 'failed', {
      exists: true,
      score: 0,
      headline: `Analysis for ${stage} could not be completed due to an error.`,
      findings: [
        {
          id: `${stage}-error`,
          title: 'Analysis error occurred',
          detail: `The ${stage} stage analysis encountered an error: ${errorMessage}. This area will be re-analyzed during the next scan.`,
          type: 'warning',
          impact: 'low',
        },
      ],
    });
  }
}

// ============================================================
// Helpers
// ============================================================

function findTopFinding(results: FunnelStageResult[]): string {
  // Find the highest-impact critical finding across all stages
  for (const stage of STAGE_ORDER) {
    const result = results.find((r) => r.stage === stage);
    if (result?.summary?.findings) {
      const critical = result.summary.findings.find(
        (f) => f.type === 'critical' && f.impact === 'high',
      );
      if (critical) {
        return critical.title;
      }
    }
  }

  // Fallback: first finding from the lowest-scoring stage
  const sorted = [...results]
    .filter((r) => r.summary && r.status === 'completed')
    .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100));

  if (sorted[0]?.summary?.findings?.[0]) {
    return sorted[0].summary.findings[0].title;
  }

  return 'Analysis complete — review your stage-by-stage results.';
}
