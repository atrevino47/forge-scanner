import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import type { ScanResultsResponse, ApiError } from '@/../contracts/api';
import type {
  DbScan,
  DbLead,
  DbScreenshot,
  DbFunnelStage,
} from '@/lib/db/types';
import { dbLeadToLead, buildScanResult } from '@/lib/db/mappers';

// ============================================================
// GET /api/scan/results/[id]
// Returns the complete scan result for a given scan ID,
// including all 5 funnel stages, screenshots, annotations,
// lead data, and blueprint availability.
// ============================================================

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
    const scanResult = buildScanResult(scan, stagesData, screenshotsData);

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
