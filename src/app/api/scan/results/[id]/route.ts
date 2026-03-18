import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import type { ScanResultsResponse, ApiError } from '@/../contracts/api';
import type {
  ScanResult,
  Lead,
  ScreenshotData,
  FunnelStageResult,
  FunnelStage,
  DetectedSocials,
  ProvidedSocials,
} from '@/../contracts/types';
import type {
  DbScan,
  DbLead,
  DbScreenshot,
  DbFunnelStage,
} from '@/lib/db/types';

// ============================================================
// GET /api/scan/results/[id]
// Returns the complete scan result for a given scan ID,
// including all 5 funnel stages, screenshots, annotations,
// lead data, and blueprint availability.
// ============================================================

const STAGE_ORDER: FunnelStage[] = [
  'traffic',
  'landing',
  'capture',
  'offer',
  'followup',
];

// --------------- DB → Contract Mappers ---------------

function dbLeadToLead(row: DbLead): Lead {
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

function dbScreenshotToData(row: DbScreenshot): ScreenshotData {
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

function buildStageResult(
  stage: DbFunnelStage,
  screenshots: DbScreenshot[]
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

// --------------- Route Handler ---------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ScanResultsResponse | ApiError>> {
  try {
    const { id: scanId } = await params;

    if (!scanId || scanId.length < 4) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'A valid scan ID is required.',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single<DbScan>();

    if (scanError || !scan) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Scan ${scanId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Fetch lead, funnel stages, screenshots, and blueprint in parallel
    const [leadResult, stagesResult, screenshotsResult, blueprintResult] =
      await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('id', scan.lead_id)
          .single<DbLead>(),
        supabase
          .from('funnel_stages')
          .select('*')
          .eq('scan_id', scanId)
          .returns<DbFunnelStage[]>(),
        supabase
          .from('screenshots')
          .select('*')
          .eq('scan_id', scanId)
          .order('created_at', { ascending: true })
          .returns<DbScreenshot[]>(),
        supabase
          .from('blueprints')
          .select('id')
          .eq('scan_id', scanId)
          .maybeSingle<{ id: string }>(),
      ]);

    if (leadResult.error || !leadResult.data) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to retrieve lead data for this scan.',
            details:
              process.env.NODE_ENV === 'development'
                ? String(leadResult.error)
                : undefined,
          },
        },
        { status: 500 }
      );
    }

    const leadRow = leadResult.data;
    const stagesData = stagesResult.data ?? [];
    const screenshotsData = screenshotsResult.data ?? [];

    // Build the scan result with stages in canonical order
    const scanResult: ScanResult = {
      id: scan.id,
      websiteUrl: scan.website_url,
      status: scan.status,
      detectedSocials: (scan.detected_socials ?? {}) as DetectedSocials,
      providedSocials: (scan.provided_socials as ProvidedSocials) ?? null,
      stages: STAGE_ORDER.map((stageName) => {
        const stageRow = stagesData.find((s: DbFunnelStage) => s.stage === stageName);
        if (stageRow) {
          return buildStageResult(stageRow, screenshotsData);
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

    const lead = dbLeadToLead(leadRow);

    const blueprintAvailable = blueprintResult.data !== null;
    const blueprintId = blueprintResult.data?.id;

    const response: ScanResultsResponse = {
      scan: scanResult,
      lead,
      blueprintAvailable,
      blueprintId,
    };

    console.log(`[scan/results] Returning results for scanId=${scanId}`);

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[scan/results] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to retrieve scan results. Please try again.',
          details:
            process.env.NODE_ENV === 'development' ? String(err) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
