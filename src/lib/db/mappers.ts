// src/lib/db/mappers.ts
// Shared DB row → contract type mappers

import type {
  ScanResult,
  Lead,
  ScreenshotData,
  FunnelStageResult,
  FunnelStage,
  DetectedSocials,
  ProvidedSocials,
  SocialEnrichmentResult,
  AdDetectionResult,
  GoogleAdsDetectionResult,
} from '../../../contracts/types';
import type {
  DbScan,
  DbLead,
  DbScreenshot,
  DbFunnelStage,
} from './types';

const STAGE_ORDER: FunnelStage[] = [
  'traffic', 'landing', 'capture', 'offer', 'followup',
];

export function dbLeadToLead(row: DbLead): Lead {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    websiteUrl: row.website_url,
    businessName: row.business_name,
    source: row.source,
    captureMethod: row.capture_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dbScreenshotToData(row: DbScreenshot): ScreenshotData {
  return {
    id: row.id,
    scanId: row.scan_id,
    stage: row.stage,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    storageUrl: row.storage_url,
    viewport: row.viewport,
    annotations: row.annotations ?? [],
    analyzedAt: row.analyzed_at,
    createdAt: row.created_at,
  };
}

export function buildStageResult(
  stage: DbFunnelStage,
  screenshots: DbScreenshot[],
): FunnelStageResult {
  return {
    stage: stage.stage,
    status: stage.status,
    summary: stage.summary,
    screenshots: screenshots
      .filter((s) => s.stage === stage.stage)
      .map(dbScreenshotToData),
    startedAt: stage.started_at,
    completedAt: stage.completed_at,
  };
}

export function buildScanResult(
  scan: DbScan,
  stages: DbFunnelStage[],
  screenshots: DbScreenshot[],
): ScanResult {
  return {
    id: scan.id,
    websiteUrl: scan.website_url,
    status: scan.status,
    detectedSocials: (scan.detected_socials ?? {}) as DetectedSocials,
    providedSocials: (scan.provided_socials as ProvidedSocials) ?? null,
    socialEnrichment: (scan.social_enrichment as unknown as SocialEnrichmentResult) ?? null,
    adDetection: scan.ad_detection
      ? (scan.ad_detection as unknown as { meta: AdDetectionResult | null; google: GoogleAdsDetectionResult | null })
      : null,
    stages: STAGE_ORDER.map((stageName) => {
      const stageRow = stages.find((s) => s.stage === stageName);
      if (stageRow) {
        return buildStageResult(stageRow, screenshots);
      }
      return {
        stage: stageName,
        status: 'pending' as const,
        summary: null,
        screenshots: [],
        startedAt: null,
        completedAt: null,
      };
    }),
    completedAt: scan.completed_at,
    createdAt: scan.created_at,
  };
}
