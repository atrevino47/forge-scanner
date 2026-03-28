// /src/lib/scanner/stage-traffic.ts
// Traffic Sources stage analyzer
// Analyzes social media profiles, ad presence, and traffic-generating pages

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
  adDetection?: AdDetectionResult;
  socialEnrichment?: SocialEnrichmentResult;
}

export async function analyzeTrafficStage(
  input: TrafficStageInput,
  onUpdate: StageUpdateCallback,
  onAnnotationReady?: AnnotationReadyCallback,
  onVideoAnalysis?: VideoAnalysisCallback,
): Promise<FunnelStageResult> {
  const { screenshots, screenshotFetcher, businessContext, videoData, adDetection, socialEnrichment } = input;

  const hasAnyData = screenshots.length > 0
    || (videoData && videoData.length > 0)
    || adDetection?.isAdvertising
    || (socialEnrichment && socialEnrichment.profiles.length > 0);

  if (!hasAnyData) {
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

  // Add ad detection annotations
  if (adDetection) {
    allAnnotations.push(...adDetectionToAnnotations(adDetection));
  }

  // Add social enrichment annotations
  if (socialEnrichment) {
    allAnnotations.push(...socialEnrichmentToAnnotations(socialEnrichment));
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

// ============================================================
// Ad detection → annotations
// ============================================================

function adDetectionToAnnotations(adDetection: AdDetectionResult): Annotation[] {
  const annotations: Annotation[] = [];

  if (adDetection.isAdvertising) {
    const platformList = adDetection.publisherPlatforms.join(', ') || 'Meta';
    annotations.push({
      id: 'traffic-ads-active',
      position: { x: 50, y: 10 },
      type: adDetection.activeAdCount >= 5 ? 'positive' : 'opportunity',
      title: `${adDetection.activeAdCount} active Meta ad${adDetection.activeAdCount === 1 ? '' : 's'} detected`,
      detail: `Found ${adDetection.activeAdCount} active ads running on ${platformList}. ${
        adDetection.activeAdCount < 5
          ? 'Running fewer than 5 variants limits testing velocity — top performers test 10-20 creatives simultaneously.'
          : 'Good ad testing volume. The key question is whether landing pages are optimized for the traffic these ads drive.'
      }`,
      category: 'paid_traffic',
    });

    if (adDetection.publisherPlatforms.length === 1) {
      annotations.push({
        id: 'traffic-ads-single-platform',
        position: { x: 50, y: 15 },
        type: 'opportunity',
        title: 'Ads running on single platform only',
        detail: `Currently advertising only on ${adDetection.publisherPlatforms[0]}. Cross-platform distribution (Facebook + Instagram + Audience Network) typically reduces CPM by 15-25% while increasing reach.`,
        category: 'paid_traffic',
      });
    }
  } else {
    annotations.push({
      id: 'traffic-ads-none',
      position: { x: 50, y: 10 },
      type: 'opportunity',
      title: 'No paid advertising detected',
      detail: 'No active Meta ads found. If the business relies on organic traffic alone, paid ads could unlock a significant growth channel — especially for retargeting visitors who browsed but didn\'t convert.',
      category: 'paid_traffic',
    });
  }

  return annotations;
}

// ============================================================
// Social enrichment → annotations
// ============================================================

function socialEnrichmentToAnnotations(enrichment: SocialEnrichmentResult): Annotation[] {
  const annotations: Annotation[] = [];

  for (const profile of enrichment.profiles) {
    const platform = profile.platform;
    const yBase = platform === 'instagram' ? 30 : platform === 'tiktok' ? 50 : platform === 'facebook' ? 70 : 85;

    if (profile.followerCount !== null) {
      const isLow = profile.followerCount < 1000;
      const isMedium = profile.followerCount >= 1000 && profile.followerCount < 10000;

      if (isLow) {
        annotations.push({
          id: `traffic-enrichment-${platform}-followers`,
          position: { x: 30, y: yBase },
          type: 'warning',
          title: `${platform}: ${formatEnrichmentNumber(profile.followerCount)} followers`,
          detail: `With ${formatEnrichmentNumber(profile.followerCount)} followers, organic reach will be limited. Focus on content quality and engagement rate over follower count — or consider targeted paid promotion to accelerate growth.`,
          category: 'audience_size',
        });
      } else if (isMedium) {
        annotations.push({
          id: `traffic-enrichment-${platform}-followers`,
          position: { x: 30, y: yBase },
          type: 'opportunity',
          title: `${platform}: ${formatEnrichmentNumber(profile.followerCount)} followers — growth zone`,
          detail: `${formatEnrichmentNumber(profile.followerCount)} followers puts the account in a growth phase. Consistent posting and engagement optimization can accelerate to 10K+, unlocking features and algorithmic favor.`,
          category: 'audience_size',
        });
      }
    }

    if (profile.engagementRate !== null) {
      const isLow = profile.engagementRate < 1.5;
      const isHigh = profile.engagementRate > 4;

      if (isLow) {
        annotations.push({
          id: `traffic-enrichment-${platform}-engagement`,
          position: { x: 70, y: yBase },
          type: 'critical',
          title: `${platform}: ${profile.engagementRate}% engagement rate`,
          detail: `Engagement rate of ${profile.engagementRate}% is below industry average (1.5-3%). This signals content isn't resonating — the algorithm deprioritizes low-engagement accounts, creating a downward spiral of decreasing reach.`,
          category: 'engagement',
        });
      } else if (isHigh) {
        annotations.push({
          id: `traffic-enrichment-${platform}-engagement`,
          position: { x: 70, y: yBase },
          type: 'positive',
          title: `${platform}: Strong ${profile.engagementRate}% engagement`,
          detail: `${profile.engagementRate}% engagement is above average. The audience is actively engaged — this is a strong foundation for conversion-focused content and paid amplification of top posts.`,
          category: 'engagement',
        });
      }
    }

    if (profile.platform === 'google_maps' && profile.reviewCount !== null) {
      const rating = profile.averageRating ?? 0;
      if (profile.reviewCount < 20) {
        annotations.push({
          id: 'traffic-enrichment-gmaps-reviews',
          position: { x: 50, y: yBase },
          type: 'warning',
          title: `Only ${profile.reviewCount} Google reviews`,
          detail: `${profile.reviewCount} reviews with a ${rating}/5 rating. Businesses with 40+ reviews get 54% more clicks on Google Maps. A review generation strategy should be a priority.`,
          category: 'reviews',
        });
      } else if (rating < 4.0) {
        annotations.push({
          id: 'traffic-enrichment-gmaps-rating',
          position: { x: 50, y: yBase },
          type: 'critical',
          title: `Google rating: ${rating}/5 (${profile.reviewCount} reviews)`,
          detail: `A ${rating}/5 rating across ${profile.reviewCount} reviews is a conversion headwind. 87% of consumers won't consider a business rated below 4.0. Responding to negative reviews and generating new positive ones is urgent.`,
          category: 'reviews',
        });
      }
    }
  }

  return annotations;
}

function formatEnrichmentNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
