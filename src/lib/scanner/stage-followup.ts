// /src/lib/scanner/stage-followup.ts
// Follow-up & Retention stage analyzer
// Analyzes retargeting pixels, email marketing, content strategy, and review management

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

const STAGE: FunnelStage = 'followup';

export type StageUpdateCallback = (
  stage: FunnelStage,
  update: Partial<FunnelStageResult>,
) => Promise<void>;

export type AnnotationReadyCallback = (
  screenshotId: string,
  annotations: Annotation[],
) => Promise<void>;

// ============================================================
// Pixel/tracking detection types (Haiku-powered)
// ============================================================

interface TrackingDetectionResult {
  metaPixel: boolean;
  googleAnalytics: boolean;
  googleTagManager: boolean;
  googleAdsTag: boolean;
  linkedinInsight: boolean;
  tiktokPixel: boolean;
  hotjar: boolean;
  otherTracking: string[];
  cookieConsent: boolean;
  schemaMarkup: boolean;
  sitemapReference: boolean;
}

// ============================================================
// Main followup stage analysis
// ============================================================

export interface FollowupStageInput {
  screenshots: ScreenshotData[];
  screenshotFetcher: (storageUrl: string) => Promise<string>;
  businessContext?: string;
  pageHtml?: string;
}

export async function analyzeFollowupStage(
  input: FollowupStageInput,
  onUpdate: StageUpdateCallback,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<FunnelStageResult> {
  const { screenshots, screenshotFetcher, businessContext, pageHtml } = input;

  // Followup stage can have insights even without screenshots (from HTML analysis)
  await onUpdate(STAGE, { status: 'analyzing', startedAt: new Date().toISOString() });

  // Run visual annotation and tracking detection in parallel
  const [annotationResults, trackingResults] = await Promise.allSettled([
    screenshots.length > 0
      ? annotateScreenshots(screenshots, screenshotFetcher, businessContext, onAnnotationReady)
      : Promise.resolve(new Map<string, Annotation[]>()),
    pageHtml ? detectTracking(pageHtml) : Promise.resolve(null),
  ]);

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
    console.error('[stage-followup] Annotation failed:', annotationResults.reason);
  }

  // Add tracking detection annotations
  if (trackingResults.status === 'fulfilled' && trackingResults.value) {
    allAnnotations.push(...trackingToAnnotations(trackingResults.value));
  }

  // If no data at all, mark as not found
  if (allAnnotations.length === 0 && screenshots.length === 0) {
    const summary: StageSummary = {
      exists: false,
      score: 0,
      headline: 'No follow-up or retention mechanisms were detected.',
      findings: [
        {
          id: 'followup-nothing-found',
          title: 'No retargeting or follow-up system detected',
          detail:
            'Without tracking pixels, email marketing, or content strategy, this business cannot follow up with the 97% of visitors who leave without converting. This is the single biggest revenue leak in most funnels.',
          type: 'critical',
          impact: 'high',
        },
      ],
    };
    const result = createStageResult(STAGE, 'completed', summary, []);
    await onUpdate(STAGE, result);
    return result;
  }

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
      console.error(`[stage-followup] Failed to fetch screenshot ${screenshot.id}:`, error);
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

async function detectTracking(html: string): Promise<TrackingDetectionResult> {
  const truncatedHtml = html.slice(0, 20000);

  const result = await analyzeWithHaiku({
    systemPrompt: `You are a tracking and retargeting pixel detection specialist. Analyze HTML to find all tracking, analytics, and remarketing code.

Look for these specific patterns:
- Meta/Facebook Pixel: fbq(, connect.facebook.net, fbevents.js
- Google Analytics: gtag(, ga(, google-analytics.com, googletagmanager.com
- Google Tag Manager: GTM- container IDs
- Google Ads: googleads.g.doubleclick.net, conversion labels
- LinkedIn Insight: linkedin.com/insight, _linkedin_partner_id
- TikTok Pixel: analytics.tiktok.com, ttq.load
- Hotjar: hotjar.com, hj(
- Cookie consent: CookieConsent, cookie-notice, gdpr, consent-banner
- Schema markup: application/ld+json, itemscope, itemtype
- Sitemap: sitemap.xml reference in robots meta or link tags

Return ONLY valid JSON:
{
  "metaPixel": boolean,
  "googleAnalytics": boolean,
  "googleTagManager": boolean,
  "googleAdsTag": boolean,
  "linkedinInsight": boolean,
  "tiktokPixel": boolean,
  "hotjar": boolean,
  "otherTracking": ["list of other tracking scripts found"],
  "cookieConsent": boolean,
  "schemaMarkup": boolean,
  "sitemapReference": boolean
}`,
    userPrompt: `Detect tracking pixels and scripts in this HTML:\n\n${truncatedHtml}`,
    maxTokens: 1024,
  });

  try {
    return extractJSON<TrackingDetectionResult>(result);
  } catch {
    return {
      metaPixel: false,
      googleAnalytics: false,
      googleTagManager: false,
      googleAdsTag: false,
      linkedinInsight: false,
      tiktokPixel: false,
      hotjar: false,
      otherTracking: [],
      cookieConsent: false,
      schemaMarkup: false,
      sitemapReference: false,
    };
  }
}

function trackingToAnnotations(tracking: TrackingDetectionResult): Annotation[] {
  const annotations: Annotation[] = [];

  // Meta Pixel
  if (!tracking.metaPixel) {
    annotations.push({
      id: 'followup-no-meta-pixel',
      position: { x: 50, y: 10 },
      type: 'critical',
      title: 'No Meta (Facebook) Pixel detected',
      detail:
        'Meta Pixel is missing — this means no Facebook/Instagram retargeting, no Lookalike Audiences, and no conversion tracking. Meta retargeting typically converts at 3-5x the rate of cold traffic.',
      category: 'retargeting',
    });
  } else {
    annotations.push({
      id: 'followup-meta-pixel',
      position: { x: 50, y: 10 },
      type: 'positive',
      title: 'Meta Pixel is installed',
      detail:
        'Meta Pixel detected — retargeting and conversion tracking are enabled for Facebook/Instagram campaigns.',
      category: 'retargeting',
    });
  }

  // Google Analytics
  if (!tracking.googleAnalytics && !tracking.googleTagManager) {
    annotations.push({
      id: 'followup-no-ga',
      position: { x: 50, y: 20 },
      type: 'critical',
      title: 'No Google Analytics or GTM',
      detail:
        'Neither Google Analytics nor Google Tag Manager was detected. Without analytics, there is no data on visitor behavior, traffic sources, or conversion rates — decisions are being made blind.',
      category: 'analytics',
    });
  } else {
    annotations.push({
      id: 'followup-ga-present',
      position: { x: 50, y: 20 },
      type: 'positive',
      title: 'Google Analytics/GTM installed',
      detail:
        `${tracking.googleTagManager ? 'Google Tag Manager' : 'Google Analytics'} detected — visitor behavior is being tracked for data-driven optimization.`,
      category: 'analytics',
    });
  }

  // Google Ads
  if (!tracking.googleAdsTag) {
    annotations.push({
      id: 'followup-no-gads',
      position: { x: 50, y: 30 },
      type: 'opportunity',
      title: 'No Google Ads conversion tag',
      detail:
        'No Google Ads remarketing tag found. If running or planning Google Ads, adding the tag enables search retargeting and display remarketing — crucial for full-funnel paid media.',
      category: 'retargeting',
    });
  }

  // Behavior tracking
  if (!tracking.hotjar) {
    annotations.push({
      id: 'followup-no-heatmap',
      position: { x: 50, y: 40 },
      type: 'opportunity',
      title: 'No heatmap/session recording tool',
      detail:
        'No Hotjar or similar behavior tracking detected. Heatmaps and session recordings reveal exactly where visitors click, scroll, and drop off — essential for conversion rate optimization.',
      category: 'behavior_tracking',
    });
  }

  // Schema markup
  if (!tracking.schemaMarkup) {
    annotations.push({
      id: 'followup-no-schema',
      position: { x: 50, y: 60 },
      type: 'warning',
      title: 'No structured data (schema markup)',
      detail:
        'No JSON-LD or schema.org markup detected. Schema markup enables rich snippets in search results (star ratings, FAQs, pricing) which can improve click-through rates by 20-30%.',
      category: 'seo',
    });
  }

  // Cookie consent
  if (tracking.metaPixel || tracking.googleAnalytics || tracking.hotjar) {
    if (!tracking.cookieConsent) {
      annotations.push({
        id: 'followup-no-consent',
        position: { x: 50, y: 90 },
        type: 'warning',
        title: 'Tracking without cookie consent',
        detail:
          'Tracking pixels are installed but no cookie consent mechanism was detected. This may create GDPR/CCPA compliance risks. A cookie consent banner protects the business legally.',
        category: 'compliance',
      });
    }
  }

  return annotations;
}
