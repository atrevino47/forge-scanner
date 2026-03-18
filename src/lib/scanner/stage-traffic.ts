// /src/lib/scanner/stage-traffic.ts
// Traffic Sources stage analyzer
// Analyzes social media profiles, ad presence, and traffic-generating pages

import type {
  Annotation,
  FunnelStage,
  FunnelStageResult,
  ScreenshotData,
  StageSummary,
  VideoAnalysis,
} from '@/../../contracts/types';
import { annotateStageScreenshots, generateStageSummary } from '../ai/annotate';
import { analyzeVideoContent, type ProfileVideoData } from '../ai/video-analysis';
import { createStageResult } from './utils';

const STAGE: FunnelStage = 'traffic';

// ============================================================
// Stage update callback type
// ============================================================

export type StageUpdateCallback = (
  stage: FunnelStage,
  update: Partial<FunnelStageResult>,
) => Promise<void>;

export type AnnotationReadyCallback = (
  screenshotId: string,
  annotations: Annotation[],
) => Promise<void>;

export type VideoAnalysisCallback = (
  platform: 'instagram' | 'tiktok' | 'youtube',
  analysis: VideoAnalysis,
) => Promise<void>;

// ============================================================
// Main traffic stage analysis
// ============================================================

export interface TrafficStageInput {
  screenshots: ScreenshotData[];
  screenshotFetcher: (storageUrl: string) => Promise<string>; // returns base64
  businessContext?: string;
  videoData?: ProfileVideoData[];
}

export async function analyzeTrafficStage(
  input: TrafficStageInput,
  onUpdate: StageUpdateCallback,
  onAnnotationReady?: AnnotationReadyCallback,
  onVideoAnalysis?: VideoAnalysisCallback,
): Promise<FunnelStageResult> {
  const { screenshots, screenshotFetcher, businessContext, videoData } = input;

  if (screenshots.length === 0 && (!videoData || videoData.length === 0)) {
    // No traffic sources to analyze
    const summary: StageSummary = {
      exists: false,
      score: 0,
      headline: 'No social media profiles or traffic sources were detected for this business.',
      findings: [
        {
          id: 'traffic-no-presence',
          title: 'No detectable online traffic sources',
          detail:
            'We could not find any social media profiles, ad presence, or traffic-generating pages linked to this website. This means the business is likely relying solely on direct traffic or word-of-mouth, missing significant growth opportunities.',
          type: 'critical',
          impact: 'high',
        },
      ],
    };

    const result = createStageResult(STAGE, 'completed', summary, []);
    await onUpdate(STAGE, result);
    return result;
  }

  // Signal stage is analyzing
  await onUpdate(STAGE, { status: 'analyzing', startedAt: new Date().toISOString() });

  // Run screenshot annotation and video analysis in parallel
  const [annotationResults, videoResults] = await Promise.allSettled([
    annotateTrafficScreenshots(screenshots, screenshotFetcher, businessContext, onAnnotationReady),
    analyzeTrafficVideos(videoData || [], onVideoAnalysis),
  ]);

  // Collect annotations from screenshots
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
    console.error('[stage-traffic] Screenshot annotation failed:', annotationResults.reason);
  }

  // Add video analysis findings as annotations
  if (videoResults.status === 'fulfilled') {
    const videoAnnotations = videoResults.value;
    allAnnotations.push(...videoAnnotations);
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

async function annotateTrafficScreenshots(
  screenshots: ScreenshotData[],
  screenshotFetcher: (url: string) => Promise<string>,
  businessContext?: string,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<Map<string, Annotation[]>> {
  // Fetch base64 data for all screenshots
  const screenshotInputs: Array<{ id: string; base64: string }> = [];
  for (const screenshot of screenshots) {
    try {
      const base64 = await screenshotFetcher(screenshot.storageUrl);
      screenshotInputs.push({ id: screenshot.id, base64 });
    } catch (error) {
      console.error(`[stage-traffic] Failed to fetch screenshot ${screenshot.id}:`, error);
    }
  }

  const results = await annotateStageScreenshots(
    screenshotInputs,
    STAGE,
    businessContext,
  );

  // Emit annotation-ready events
  if (onAnnotationReady) {
    for (const [screenshotId, annotations] of results) {
      await onAnnotationReady(screenshotId, annotations);
    }
  }

  return results;
}

async function analyzeTrafficVideos(
  videoDataSets: ProfileVideoData[],
  onVideoAnalysis?: VideoAnalysisCallback,
): Promise<Annotation[]> {
  const annotations: Annotation[] = [];

  for (const profileData of videoDataSets) {
    try {
      const analysis = await analyzeVideoContent(profileData);

      // Emit video analysis event
      if (onVideoAnalysis) {
        await onVideoAnalysis(profileData.platform, analysis);
      }

      // Convert video patterns into annotations for the stage summary
      annotations.push(...videoPatternToAnnotations(profileData.platform, analysis));
    } catch (error) {
      console.error(
        `[stage-traffic] Video analysis failed for ${profileData.platform}:`,
        error,
      );
    }
  }

  return annotations;
}

/**
 * Convert video analysis patterns into Annotation format
 * so they can be included in the stage summary.
 */
function videoPatternToAnnotations(
  platform: string,
  analysis: VideoAnalysis,
): Annotation[] {
  const annotations: Annotation[] = [];
  const patterns = analysis.patterns;

  // Posting consistency
  if (patterns.consistencyScore < 30) {
    annotations.push({
      id: `traffic-video-${platform}-consistency`,
      position: { x: 50, y: 20 },
      type: 'critical',
      title: `${platform} posting is inconsistent`,
      detail: `Posting frequency is "${patterns.postingFrequency}" with a consistency score of ${patterns.consistencyScore}/100. The algorithm rewards consistent posting — inconsistency tanks reach by 40-60%.`,
      category: 'content_consistency',
    });
  } else if (patterns.consistencyScore >= 70) {
    annotations.push({
      id: `traffic-video-${platform}-consistency`,
      position: { x: 50, y: 20 },
      type: 'positive',
      title: `Strong ${platform} posting consistency`,
      detail: `Posting at "${patterns.postingFrequency}" with a consistency score of ${patterns.consistencyScore}/100. This regularity helps maintain algorithmic favor and audience expectations.`,
      category: 'content_consistency',
    });
  }

  // Doubling down on what works
  if (patterns.doublingDownScore < 40 && analysis.topPerformers.length > 0) {
    annotations.push({
      id: `traffic-video-${platform}-doubling`,
      position: { x: 50, y: 40 },
      type: 'opportunity',
      title: `Not repeating winning ${platform} formats`,
      detail: `Doubling-down score is ${patterns.doublingDownScore}/100. Top-performing content patterns aren't being replicated — this is leaving significant reach on the table.`,
      category: 'content_strategy',
    });
  }

  // Viral recency
  if (patterns.viralRecency === 'stale') {
    annotations.push({
      id: `traffic-video-${platform}-viral-stale`,
      position: { x: 50, y: 60 },
      type: 'warning',
      title: `${platform} viral content is outdated`,
      detail: `The best-performing videos are from 90+ days ago. Recent content isn't breaking through — likely need to refresh hooks and topics.`,
      category: 'content_performance',
    });
  }

  // Hook variety
  if (patterns.hookVariety < 40) {
    annotations.push({
      id: `traffic-video-${platform}-hooks`,
      position: { x: 50, y: 80 },
      type: 'warning',
      title: `Same hook style every video`,
      detail: `Hook variety score is ${patterns.hookVariety}/100. Using the same opening style causes "hook fatigue" — followers start scrolling past. Mixing question, bold claim, and pattern interrupt hooks can boost retention by 20-35%.`,
      category: 'content_hooks',
    });
  }

  return annotations;
}
