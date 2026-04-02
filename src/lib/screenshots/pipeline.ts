// src/lib/screenshots/pipeline.ts
// Full screenshot capture pipeline — orchestrates browser connection,
// page capture, social/GBP detection, storage upload, and AI analysis.

import { createServiceClient } from '@/lib/db/client';
import { runScanAnalysis } from '@/lib/scanner/orchestrator';
import { buildBusinessContext } from '@/lib/scanner/utils';
import { detectMetaAds } from '@/lib/scanner/ad-detection';
import { enrichSocialProfiles, enrichmentToContext } from '@/lib/scanner/apify-enrichment';
import { connectBrowser, capturePageWithMetadata, disconnectBrowser as closeBrowser } from './client';
import { detectInnerPages, detectSocialLinks, detectGbpFromHtml } from './social-detector';
import type { Browser } from 'playwright-core';
import type { ScanEventCallbacks, ScanAnalysisInput } from '@/lib/scanner/orchestrator';
import type {
  FunnelStage,
  ScreenshotData,
  SourceType,
  Viewport,
  DetectedSocials,
  AdDetectionResult,
  SocialEnrichmentResult,
  Annotation,
  StageSummary,
  StageStatus,
} from '../../../contracts/types';
import type { ScanCompletedSummary } from '../../../contracts/events';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Constants
// ============================================================

const FUNNEL_STAGES: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];
const MAX_INNER_PAGES = 5;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

// ============================================================
// Types
// ============================================================

/** Google Places API response shape */
interface PlacesApiResponse {
  candidates: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
  }>;
  status: string;
}

// ============================================================
// Collected screenshot before upload
// ============================================================

interface PendingScreenshot {
  id: string;
  buffer: Buffer;
  stage: FunnelStage;
  sourceType: SourceType;
  sourceUrl: string;
  viewport: Viewport;
}

// ============================================================
// Main pipeline
// ============================================================

export async function runScreenshotPipeline(params: {
  scanId: string;
  leadId: string;
  websiteUrl: string;
  businessName?: string | null;
}): Promise<void> {
  const { scanId, websiteUrl, businessName } = params;
  // leadId is available in params for downstream consumers (e.g., follow-up scheduling)
  const supabase = createServiceClient();

  let browser: Browser | null = null;
  let homepageHtml = '';

  try {
    // --------------------------------------------------------
    // Step 1: Update scan status to 'capturing'
    // --------------------------------------------------------
    await updateScanStatus(supabase, scanId, 'capturing');

    // --------------------------------------------------------
    // Step 2: Create all 5 funnel stages in 'pending' status
    // --------------------------------------------------------
    const stageRows = FUNNEL_STAGES.map((stage) => ({
      scan_id: scanId,
      stage,
      status: 'pending' as StageStatus,
      summary: null,
      started_at: null,
      completed_at: null,
    }));

    const { error: stageInsertError } = await supabase
      .from('funnel_stages')
      .insert(stageRows);

    if (stageInsertError) {
      throw new Error(`Failed to create funnel stages: ${stageInsertError.message}`);
    }

    // --------------------------------------------------------
    // Step 3: Connect to Browserless
    // --------------------------------------------------------
    browser = await connectBrowser();

    const pendingScreenshots: PendingScreenshot[] = [];
    let detectedSocials: DetectedSocials = {};

    // --------------------------------------------------------
    // Step 4: Capture homepage — desktop + mobile
    // --------------------------------------------------------
    try {
      await updateStageStatus(supabase, scanId, 'landing', 'capturing');

      // Desktop capture — full patient visitor mode for homepage (client-facing screenshot)
      const desktopResult = await capturePageWithMetadata(browser, websiteUrl, 'desktop', 'full');
      homepageHtml = desktopResult.html;

      pendingScreenshots.push({
        id: generateScreenshotId(),
        buffer: desktopResult.screenshot,
        stage: 'landing',
        sourceType: 'website',
        sourceUrl: desktopResult.url,
        viewport: 'desktop',
      });

      // Mobile capture — full mode (also client-facing)
      const mobileResult = await capturePageWithMetadata(browser, websiteUrl, 'mobile', 'full');

      pendingScreenshots.push({
        id: generateScreenshotId(),
        buffer: mobileResult.screenshot,
        stage: 'landing',
        sourceType: 'website',
        sourceUrl: mobileResult.url,
        viewport: 'mobile',
      });
    } catch (captureError) {
      console.error(`[pipeline] Homepage capture failed for ${websiteUrl}:`, captureError);
      await updateStageStatus(supabase, scanId, 'landing', 'failed');
      // Continue — other stages may still succeed with limited data
    }

    // --------------------------------------------------------
    // Step 5: Detect and capture inner pages
    // --------------------------------------------------------
    try {
      if (homepageHtml) {
        const innerPages = detectInnerPages(homepageHtml, websiteUrl);
        console.log(`[pipeline] Inner page detection found ${innerPages.length} pages for ${websiteUrl}`);
        const pagesToCapture = innerPages.slice(0, MAX_INNER_PAGES);

        for (const pageInfo of pagesToCapture) {
          try {
            // Fast mode for inner pages — AI analysis matters more than pixel-perfect screenshots
            const result = await capturePageWithMetadata(browser, pageInfo.url, 'desktop');

            pendingScreenshots.push({
              id: generateScreenshotId(),
              buffer: result.screenshot,
              stage: pageInfo.stage,
              sourceType: 'website',
              sourceUrl: result.url,
              viewport: 'desktop',
            });

            // Update the stage to 'capturing' if it was still 'pending'
            await updateStageStatusIfPending(supabase, scanId, pageInfo.stage, 'capturing');
          } catch (innerPageError) {
            console.error(`[pipeline] Inner page capture failed for ${pageInfo.url}:`, innerPageError);
            // Individual page failure does not abort the pipeline
          }
        }
      }
    } catch (innerDetectError) {
      console.error('[pipeline] Inner page detection failed:', innerDetectError);
    }

    // --------------------------------------------------------
    // Step 6: Detect social links from homepage HTML
    // --------------------------------------------------------
    try {
      if (homepageHtml) {
        const detection = detectSocialLinks(homepageHtml, websiteUrl);
        detectedSocials = detection.resolved;
        const resolvedCount = Object.keys(detection.resolved).length;
        const ambiguousCount = Object.keys(detection.ambiguous).length;
        console.log(`[pipeline] Social detection: ${resolvedCount} resolved, ${ambiguousCount} ambiguous for ${websiteUrl}`);

        // Store both resolved and ambiguous socials in the scan record
        const socialsForDb: Record<string, unknown> = { ...detection.resolved };
        if (Object.keys(detection.ambiguous).length > 0) {
          socialsForDb._ambiguous = detection.ambiguous;
        }

        await supabase
          .from('scans')
          .update({ detected_socials: socialsForDb })
          .eq('id', scanId);
      }
    } catch (socialDetectError) {
      console.error('[pipeline] Social link detection failed:', socialDetectError);
    }

    // --------------------------------------------------------
    // Step 7: Enrich data — Meta ads + Apify social metrics (parallel, non-blocking)
    // --------------------------------------------------------
    let adDetection: AdDetectionResult | null = null;
    let socialEnrichment: SocialEnrichmentResult | null = null;

    try {
      // Extract business name from page title or URL for ad search
      const businessNameForSearch = businessName || extractBusinessNameFromUrl(websiteUrl);

      // Run ad detection and social enrichment in parallel
      // These are optional enrichments — pipeline continues if either fails
      const [adResult, enrichResult] = await Promise.allSettled([
        businessNameForSearch
          ? detectMetaAds(businessNameForSearch, websiteUrl)
          : Promise.resolve(null),
        enrichSocialProfiles(detectedSocials),
      ]);

      if (adResult.status === 'fulfilled') {
        adDetection = adResult.value;
        if (adDetection?.isAdvertising) {
          console.log(`[pipeline] Meta ads detected: ${adDetection.activeAdCount} active ads`);
        }
      } else {
        console.error('[pipeline] Ad detection failed:', adResult.reason);
      }

      if (enrichResult.status === 'fulfilled') {
        socialEnrichment = enrichResult.value;
        if (socialEnrichment) {
          console.log(`[pipeline] Social enrichment: ${socialEnrichment.profiles.length} profiles enriched`);
        }
      } else {
        console.error('[pipeline] Social enrichment failed:', enrichResult.reason);
      }
    } catch (enrichError) {
      console.error('[pipeline] Data enrichment step failed:', enrichError);
    }

    // --------------------------------------------------------
    // Step 8: Capture social profile screenshots
    // --------------------------------------------------------
    try {
      await updateStageStatusIfPending(supabase, scanId, 'traffic', 'capturing');

      const socialEntries = Object.entries(detectedSocials) as Array<
        [keyof DetectedSocials, DetectedSocials[keyof DetectedSocials]]
      >;

      for (const [platform, socialData] of socialEntries) {
        if (!socialData || socialData.confidence !== 'high') {
          continue;
        }

        try {
          const sourceType = platformToSourceType(platform);
          const result = await capturePageWithMetadata(browser, socialData.url, 'desktop');

          pendingScreenshots.push({
            id: generateScreenshotId(),
            buffer: result.screenshot,
            stage: 'traffic',
            sourceType,
            sourceUrl: socialData.url,
            viewport: 'desktop',
          });
        } catch (socialCaptureError) {
          console.error(`[pipeline] Social capture failed for ${platform}:`, socialCaptureError);
        }
      }
    } catch (socialStageError) {
      console.error('[pipeline] Social capture stage failed:', socialStageError);
    }

    // --------------------------------------------------------
    // Step 9: Detect and capture GBP
    // --------------------------------------------------------
    try {
      await updateStageStatusIfPending(supabase, scanId, 'followup', 'capturing');

      const gbpUrl = await detectGbpUrl(homepageHtml, websiteUrl);

      if (gbpUrl) {
        try {
          const result = await capturePageWithMetadata(browser, gbpUrl, 'desktop');

          pendingScreenshots.push({
            id: generateScreenshotId(),
            buffer: result.screenshot,
            stage: 'followup',
            sourceType: 'gbp',
            sourceUrl: gbpUrl,
            viewport: 'desktop',
          });
        } catch (gbpCaptureError) {
          console.error(`[pipeline] GBP page capture failed for ${gbpUrl}:`, gbpCaptureError);
        }
      }
    } catch (gbpError) {
      console.error('[pipeline] GBP detection failed:', gbpError);
    }

    // --------------------------------------------------------
    // Step 10: Upload all screenshots to Supabase Storage
    // --------------------------------------------------------
    const uploadedScreenshots: ScreenshotData[] = [];

    for (const pending of pendingScreenshots) {
      try {
        const storagePath = `${scanId}/${pending.id}.png`;

        const { error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(storagePath, pending.buffer, { contentType: 'image/png' });

        if (uploadError) {
          console.error(`[pipeline] Upload failed for ${pending.id}:`, uploadError.message);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('screenshots')
          .getPublicUrl(storagePath);

        uploadedScreenshots.push({
          id: pending.id,
          scanId,
          stage: pending.stage,
          sourceType: pending.sourceType,
          sourceUrl: pending.sourceUrl,
          storageUrl: publicUrl,
          viewport: pending.viewport,
          annotations: [],
          analyzedAt: null,
          createdAt: new Date().toISOString(),
        });
      } catch (uploadError) {
        console.error(`[pipeline] Screenshot upload failed for ${pending.id}:`, uploadError);
      }
    }

    // --------------------------------------------------------
    // Step 11: Create screenshot DB records
    // --------------------------------------------------------
    if (uploadedScreenshots.length > 0) {
      const screenshotRows = uploadedScreenshots.map((s) => ({
        id: s.id,
        scan_id: scanId,
        stage: s.stage,
        source_type: s.sourceType,
        source_url: s.sourceUrl,
        storage_url: s.storageUrl,
        viewport: s.viewport,
        annotations: [] as Annotation[],
        analyzed_at: null,
      }));

      const { error: screenshotInsertError } = await supabase
        .from('screenshots')
        .insert(screenshotRows);

      if (screenshotInsertError) {
        console.error('[pipeline] Screenshot DB insert failed:', screenshotInsertError.message);
      }
    }

    // --------------------------------------------------------
    // Step 12: Update funnel stages — mark as 'analyzing'
    // --------------------------------------------------------
    const stagesWithScreenshots = new Set(uploadedScreenshots.map((s) => s.stage));

    for (const stage of stagesWithScreenshots) {
      await updateStageStatus(supabase, scanId, stage, 'analyzing');
    }

    // --------------------------------------------------------
    // Step 13: Disconnect browser
    // --------------------------------------------------------
    await closeBrowser(browser);
    browser = null;

    // --------------------------------------------------------
    // Step 14: Run AI analysis
    // --------------------------------------------------------
    await updateScanStatus(supabase, scanId, 'analyzing');

    // Build business context, enriched with ad detection + social metrics
    let businessContext = buildBusinessContext({
      websiteUrl,
      businessName,
      detectedSocials: buildDetectedSocialsForContext(detectedSocials),
    });

    // Append enrichment data to business context for AI analysis
    if (socialEnrichment) {
      businessContext += '\n\n' + enrichmentToContext(socialEnrichment);
    }
    if (adDetection) {
      businessContext += '\n\n' + adDetectionToContext(adDetection);
    }

    const analysisInput: ScanAnalysisInput = {
      scanId,
      websiteUrl,
      screenshots: uploadedScreenshots,
      businessContext,
      businessName,
      screenshotFetcher: fetchScreenshotBase64,
      homepageHtml: homepageHtml || undefined,
      adDetection: adDetection || undefined,
      socialEnrichment: socialEnrichment || undefined,
    };

    const analysisCallbacks: ScanEventCallbacks = {
      onStageUpdate: async (stage: FunnelStage, update) => {
        const dbUpdate: Record<string, unknown> = {};

        if (update.status) {
          dbUpdate.status = update.status;
        }
        if (update.summary !== undefined) {
          dbUpdate.summary = update.summary;
        }
        if (update.completedAt) {
          dbUpdate.completed_at = update.completedAt;
        }
        if (update.startedAt) {
          dbUpdate.started_at = update.startedAt;
        }

        if (Object.keys(dbUpdate).length > 0) {
          await supabase
            .from('funnel_stages')
            .update(dbUpdate)
            .eq('scan_id', scanId)
            .eq('stage', stage);
        }
      },

      onAnnotationReady: async (screenshotId: string, annotations: Annotation[]) => {
        await supabase
          .from('screenshots')
          .update({
            annotations,
            analyzed_at: new Date().toISOString(),
          })
          .eq('id', screenshotId);
      },

      onVideoAnalysis: async () => {
        // Video analysis data is stored via the stage update callback.
        // This hook is available for SSE event emission by the API layer.
      },

      onStageCompleted: async (stage: FunnelStage, summary: StageSummary) => {
        await supabase
          .from('funnel_stages')
          .update({
            status: 'completed' as StageStatus,
            summary,
            completed_at: new Date().toISOString(),
          })
          .eq('scan_id', scanId)
          .eq('stage', stage);
      },

      onStageFailed: async (stage: FunnelStage, error: string) => {
        console.error(`[pipeline] AI analysis failed for stage ${stage}: ${error}`);
        await supabase
          .from('funnel_stages')
          .update({
            status: 'failed' as StageStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('scan_id', scanId)
          .eq('stage', stage);
      },

      onScanCompleted: async (_summary: ScanCompletedSummary) => {
        await supabase
          .from('scans')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', scanId);
      },
    };

    await runScanAnalysis(analysisInput, analysisCallbacks);
  } catch (pipelineError) {
    console.error(`[pipeline] Fatal error for scan ${scanId}:`, pipelineError);

    // Mark scan as failed
    try {
      await supabase
        .from('scans')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId);
    } catch (statusError) {
      console.error('[pipeline] Failed to update scan status to failed:', statusError);
    }
  } finally {
    // Always disconnect the browser
    if (browser) {
      await closeBrowser(browser);
    }
  }
}

// ============================================================
// Screenshot fetcher for AI analysis
// ============================================================

async function fetchScreenshotBase64(storageUrl: string): Promise<string> {
  const response = await fetch(storageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString('base64');
}

// ============================================================
// GBP detection via HTML + Google Places API
// ============================================================

async function detectGbpUrl(
  html: string,
  websiteUrl: string,
): Promise<string | null> {
  // First: check the HTML for direct GBP links
  if (html) {
    const gbpResult = detectGbpFromHtml(html);
    if (gbpResult.found && gbpResult.mapsUrl) {
      return gbpResult.mapsUrl;
    }
  }

  // Fallback: Google Places API lookup
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[pipeline] GOOGLE_PLACES_API_KEY not set — skipping Places API lookup');
    return null;
  }

  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(websiteUrl)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`[pipeline] Places API returned ${response.status}`);
      return null;
    }

    const data = (await response.json()) as PlacesApiResponse;

    if (data.status === 'OK' && data.candidates.length > 0) {
      const placeId = data.candidates[0].place_id;
      return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    }

    return null;
  } catch (placesError) {
    console.error('[pipeline] Google Places API lookup failed:', placesError);
    return null;
  }
}

// ============================================================
// DB update helpers
// ============================================================

async function updateScanStatus(
  supabase: SupabaseClient,
  scanId: string,
  status: 'capturing' | 'analyzing' | 'completed' | 'failed',
): Promise<void> {
  const { error } = await supabase
    .from('scans')
    .update({ status })
    .eq('id', scanId);

  if (error) {
    console.error(`[pipeline] Failed to update scan ${scanId} to ${status}:`, error.message);
  }
}

async function updateStageStatus(
  supabase: SupabaseClient,
  scanId: string,
  stage: FunnelStage,
  status: StageStatus,
): Promise<void> {
  const update: Record<string, unknown> = { status };

  if (status === 'capturing' || status === 'analyzing') {
    update.started_at = new Date().toISOString();
  }
  if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('funnel_stages')
    .update(update)
    .eq('scan_id', scanId)
    .eq('stage', stage);

  if (error) {
    console.error(`[pipeline] Failed to update stage ${stage} to ${status}:`, error.message);
  }
}

async function updateStageStatusIfPending(
  supabase: SupabaseClient,
  scanId: string,
  stage: FunnelStage,
  newStatus: StageStatus,
): Promise<void> {
  const { data } = await supabase
    .from('funnel_stages')
    .select('status')
    .eq('scan_id', scanId)
    .eq('stage', stage)
    .single();

  if (data && data.status === 'pending') {
    await updateStageStatus(supabase, scanId, stage, newStatus);
  }
}

// ============================================================
// Utility helpers
// ============================================================

function generateScreenshotId(): string {
  return crypto.randomUUID();
}

function platformToSourceType(platform: keyof DetectedSocials): SourceType {
  const mapping: Record<keyof DetectedSocials, SourceType> = {
    instagram: 'instagram',
    facebook: 'facebook',
    tiktok: 'tiktok',
    linkedin: 'linkedin',
  };
  return mapping[platform];
}

function extractBusinessNameFromUrl(url: string): string | null {
  try {
    let hostname = url;
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }
    hostname = hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    if (parts.length < 2) return null;
    const name = parts.slice(0, -1).join(' ');
    return name.replace(/[-_]/g, ' ').trim() || null;
  } catch {
    return null;
  }
}

function adDetectionToContext(adDetection: AdDetectionResult): string {
  const lines = ['META AD LIBRARY DATA:'];
  lines.push(`  Active ads: ${adDetection.activeAdCount}`);
  lines.push(`  Total ads found: ${adDetection.totalAdsFound}`);
  lines.push(`  Platforms: ${adDetection.publisherPlatforms.join(', ') || 'none'}`);
  if (adDetection.sampleAds.length > 0) {
    lines.push('  Sample ad creatives:');
    for (const ad of adDetection.sampleAds.slice(0, 3)) {
      if (ad.creativeLinkTitle) {
        lines.push(`    - "${ad.creativeLinkTitle}" (since ${ad.startDate})`);
      } else if (ad.creativeBody) {
        lines.push(`    - "${ad.creativeBody.slice(0, 100)}..." (since ${ad.startDate})`);
      }
    }
  }
  return lines.join('\n');
}

function buildDetectedSocialsForContext(
  detected: DetectedSocials,
): Record<string, { handle: string; url: string }> | undefined {
  const entries = Object.entries(detected) as Array<
    [string, { handle: string; url: string; confidence: 'high' | 'low' } | undefined]
  >;

  const result: Record<string, { handle: string; url: string }> = {};
  let hasEntries = false;

  for (const [platform, data] of entries) {
    if (data) {
      result[platform] = { handle: data.handle, url: data.url };
      hasEntries = true;
    }
  }

  return hasEntries ? result : undefined;
}
