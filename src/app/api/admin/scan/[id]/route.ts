// GET /api/admin/scan/[id]
// Returns full scan details for admin team view (used during strategy calls)
// Reuses the same query pattern as the public /api/scan/results/[id] route

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import type { ScanResultsResponse, ApiError } from '@/../contracts/api';
import type { DbScan, DbLead, DbScreenshot, DbFunnelStage } from '@/lib/db/types';
import { dbLeadToLead, buildScanResult } from '@/lib/db/mappers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ScanResultsResponse | ApiError>> {
  try {
    // TODO: Wire admin auth once ADMIN_EMAILS is configured

    const { id: scanId } = await params;

    if (!scanId || scanId.length < 4) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Scan ID is required' } },
        { status: 400 },
      );
    }

    const db = createServiceClient();

    // Fetch scan
    const { data: scan, error: scanError } = await db
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single<DbScan>();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Scan ${scanId} not found` } },
        { status: 404 },
      );
    }

    // Fetch lead, stages, screenshots, blueprint in parallel
    const [leadResult, stagesResult, screenshotsResult, blueprintResult] =
      await Promise.all([
        db.from('leads').select('*').eq('id', scan.lead_id).single<DbLead>(),
        db.from('funnel_stages').select('*').eq('scan_id', scanId).returns<DbFunnelStage[]>(),
        db.from('screenshots').select('*').eq('scan_id', scanId)
          .order('created_at', { ascending: true }).returns<DbScreenshot[]>(),
        db.from('blueprints').select('id').eq('scan_id', scanId)
          .maybeSingle<{ id: string }>(),
      ]);

    if (leadResult.error || !leadResult.data) {
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to retrieve lead data' } },
        { status: 500 },
      );
    }

    const scanResult = buildScanResult(
      scan,
      stagesResult.data ?? [],
      screenshotsResult.data ?? [],
    );

    const response: ScanResultsResponse = {
      scan: scanResult,
      lead: dbLeadToLead(leadResult.data),
      blueprintAvailable: blueprintResult.data !== null,
      blueprintId: blueprintResult.data?.id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch scan details',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
