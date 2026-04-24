import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { apiError } from '@/lib/api-utils';
import { generateBlueprint } from '@/lib/blueprint/mockup-generator';
import type { GenerateBlueprintResponse, ApiError } from '@/../contracts/api';
import type {
  DbScan,
  DbLead,
  DbFunnelStage,
  DbScreenshot,
  DbBlueprint,
} from '@/lib/db/types';
import { buildScanResult } from '@/lib/db/mappers';

// ============================================================
// POST /api/blueprint/generate/[scanId]
// Generates an optimized funnel blueprint for a completed scan.
// Requires the lead to have provided their email.
// If a blueprint already exists for this scan, returns it.
// ============================================================

const ParamsSchema = z.object({
  scanId: z.string().min(1, 'Scan ID is required'),
});

// The `diagram` field (BlueprintDiagram) is persisted by piggybacking on the
// existing `funnel_map` JSONB column under the `__blueprint_diagram__` key.
// Keeps the demo path working without requiring a DB migration (migrations are
// frozen for this window). A follow-up migration can promote it to its own column.
type DiagramCarrier = { __blueprint_diagram__?: unknown };

function dbBlueprintToData(row: DbBlueprint): GenerateBlueprintResponse {
  const rawFunnelMap = row.funnel_map as (typeof row.funnel_map) & DiagramCarrier;
  const { __blueprint_diagram__, ...funnelMap } = rawFunnelMap ?? {};
  return {
    blueprint: {
      id: row.id,
      scanId: row.scan_id,
      funnelMap,
      mockupHtml: row.mockup_html,
      mockupTarget: row.mockup_target,
      brandColors: row.brand_colors,
      diagram: (__blueprint_diagram__ ?? null) as GenerateBlueprintResponse['blueprint']['diagram'],
      createdAt: row.created_at,
    },
  };
}

// --------------- Screenshot Base64 Fetcher ---------------

async function fetchScreenshotBase64(storageUrl: string): Promise<string> {
  const response = await fetch(storageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch screenshot from storage: ${response.status} ${response.statusText}`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString('base64');
  return base64;
}

// --------------- Route Handler ---------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
): Promise<NextResponse<GenerateBlueprintResponse | ApiError>> {
  try {
    const resolvedParams = await params;

    // 1. Validate scanId
    const parsed = ParamsSchema.safeParse(resolvedParams);
    if (!parsed.success) {
      return apiError(
        'INVALID_INPUT',
        parsed.error.issues[0]?.message ?? 'A valid scan ID is required.',
        400,
        parsed.error.flatten()
      );
    }

    const { scanId } = parsed.data;

    // 1b. Verify ANTHROPIC_API_KEY is set before proceeding
    if (!process.env.ANTHROPIC_API_KEY) {
      return apiError(
        'INTERNAL',
        'Blueprint generation is not available — AI service is not configured.',
        503,
      );
    }

    const supabase = createServiceClient();

    // 2. Fetch the scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single<DbScan>();

    if (scanError || !scan) {
      return apiError('NOT_FOUND', `Scan ${scanId} not found.`, 404);
    }

    // 3. Fetch the lead and verify email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', scan.lead_id)
      .single<DbLead>();

    if (leadError || !lead) {
      return apiError(
        'INTERNAL',
        'Failed to retrieve lead data for this scan.',
        500,
        process.env.NODE_ENV === 'development' ? String(leadError) : undefined
      );
    }

    if (!lead.email) {
      return apiError(
        'EMAIL_REQUIRED',
        'Please provide your email before generating a blueprint',
        403
      );
    }

    // 4. Check if a blueprint already exists — return it without regenerating
    const { data: existingBlueprint } = await supabase
      .from('blueprints')
      .select('*')
      .eq('scan_id', scanId)
      .maybeSingle<DbBlueprint>();

    if (existingBlueprint) {
      console.log(
        `[blueprint/generate] Returning existing blueprint for scanId=${scanId} → blueprintId=${existingBlueprint.id}`
      );
      return NextResponse.json(dbBlueprintToData(existingBlueprint), {
        status: 200,
      });
    }

    // 5. Fetch funnel stages and screenshots
    const [stagesResult, screenshotsResult] = await Promise.all([
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
    ]);

    const stagesData = stagesResult.data ?? [];
    const screenshotsData = screenshotsResult.data ?? [];

    // 6. Build the ScanResult from DB data
    const scanResult = buildScanResult(scan, stagesData, screenshotsData);

    // 7. Fetch homepage desktop screenshot base64
    const homepageScreenshot = screenshotsData.find(
      (s) =>
        s.stage === 'landing' &&
        s.source_type === 'website' &&
        s.viewport === 'desktop'
    );

    let homepageScreenshotBase64 = '';
    if (homepageScreenshot) {
      try {
        homepageScreenshotBase64 = await fetchScreenshotBase64(
          homepageScreenshot.storage_url
        );
      } catch (fetchErr) {
        console.warn(
          `[blueprint/generate] Failed to fetch homepage screenshot base64, proceeding without it:`,
          fetchErr
        );
      }
    } else {
      console.warn(
        `[blueprint/generate] No desktop homepage screenshot found for scanId=${scanId}`
      );
    }

    // 8. Generate the blueprint via AI
    const blueprint = await generateBlueprint({
      scanResult,
      homepageScreenshotBase64,
      businessName: lead.business_name,
    });

    // 9. Store in the blueprints table. Piggyback the BlueprintDiagram inside
    // funnel_map JSONB under __blueprint_diagram__ to avoid a schema migration.
    const funnelMapWithDiagram = blueprint.diagram
      ? { ...blueprint.funnelMap, __blueprint_diagram__: blueprint.diagram }
      : blueprint.funnelMap;

    const { error: insertError } = await supabase.from('blueprints').insert({
      id: blueprint.id,
      scan_id: scanId,
      funnel_map: funnelMapWithDiagram,
      mockup_html: blueprint.mockupHtml,
      mockup_target: blueprint.mockupTarget,
      brand_colors: blueprint.brandColors,
    });

    if (insertError) {
      console.error(
        '[blueprint/generate] Failed to store blueprint:',
        insertError
      );
      return apiError(
        'INTERNAL',
        'Blueprint was generated but could not be saved. Please try again.',
        500,
        process.env.NODE_ENV === 'development' ? String(insertError) : undefined
      );
    }

    console.log(
      `[blueprint/generate] Generated and stored blueprint for scanId=${scanId} → blueprintId=${blueprint.id}`
    );

    // 10. Return the blueprint
    const response: GenerateBlueprintResponse = { blueprint };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('[blueprint/generate] Unexpected error:', err);
    return apiError(
      'INTERNAL',
      'Something went wrong while generating the blueprint. Please try again.',
      500,
      process.env.NODE_ENV === 'development' ? String(err) : undefined
    );
  }
}
