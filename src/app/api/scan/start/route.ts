import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import type { StartScanResponse, ApiError } from '@/../contracts/api';
import { createServiceClient } from '@/lib/db/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { apiError, getClientIp } from '@/lib/api-utils';
import { runScreenshotPipeline } from '@/lib/screenshots/pipeline';

// ============================================================
// POST /api/scan/start
// Initiates a new funnel scan for the given website URL.
// Returns a scanId, leadId, and SSE stream URL for real-time progress.
// ============================================================

const StartScanSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .transform((val) => {
      const trimmed = val.trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    })
    .pipe(
      z.string().url('Must be a valid URL').refine(
        (val) => {
          try {
            const parsed = new URL(val);
            return ['http:', 'https:'].includes(parsed.protocol);
          } catch {
            return false;
          }
        },
        { message: 'URL must use http or https protocol' }
      )
    ),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

/**
 * Normalize a URL: ensure it has a protocol and strip trailing slash.
 */
function normalizeUrl(raw: string): string {
  let url = raw.trim();

  // Ensure protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Strip trailing slash
  url = url.replace(/\/+$/, '');

  return url;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<StartScanResponse | ApiError>> {
  try {
    // (a) Parse and validate body
    const body: unknown = await request.json();

    const parsed = StartScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              parsed.error.issues[0]?.message ?? 'Invalid request body',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { url, utmSource, utmMedium, utmCampaign } = parsed.data;

    // (b) Get client IP
    const clientIp = getClientIp(request);

    // (c) Check rate limit: 3 scans per IP per 24h
    const rateLimit = await checkRateLimit(clientIp, 'ip_scan', 3, 86400000);

    if (!rateLimit.allowed) {
      return apiError(
        'RATE_LIMITED',
        'You have reached the maximum number of scans. Please try again later.',
        429,
        { remaining: rateLimit.remaining, resetAt: rateLimit.resetAt }
      );
    }

    // (d) Normalize URL
    const normalizedUrl = normalizeUrl(url);

    // (e) Create lead record
    const supabase = createServiceClient();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        website_url: normalizedUrl,
        source: 'organic',
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('[scan/start] Failed to create lead:', leadError);
      return apiError(
        'INTERNAL',
        'Failed to initiate scan. Please try again.',
        500
      );
    }

    // (f) Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        lead_id: lead.id,
        website_url: normalizedUrl,
        status: 'scanning',
        ...(utmSource && { utm_source: utmSource }),
        ...(utmMedium && { utm_medium: utmMedium }),
        ...(utmCampaign && { utm_campaign: utmCampaign }),
      })
      .select('id')
      .single();

    if (scanError || !scan) {
      console.error('[scan/start] Failed to create scan:', scanError);
      return apiError(
        'INTERNAL',
        'Failed to initiate scan. Please try again.',
        500
      );
    }

    // (g) Dispatch the screenshot pipeline — runs after response is sent
    // Uses Next.js after() to keep the serverless function alive on Vercel
    after(
      runScreenshotPipeline({
        scanId: scan.id,
        leadId: lead.id,
        websiteUrl: normalizedUrl,
      }).catch((err: unknown) => {
        console.error(
          `[scan/start] Pipeline failed for scan ${scan.id}:`,
          err
        );
      })
    );

    // (h) Return 201 with scan info
    console.log(
      `[scan/start] Initiated scan for ${normalizedUrl} → scanId=${scan.id}, leadId=${lead.id}`
    );

    const response: StartScanResponse = {
      scanId: scan.id as string,
      leadId: lead.id as string,
      streamUrl: `/api/scan/status/${scan.id}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('[scan/start] Unexpected error:', err);
    return apiError(
      'INTERNAL',
      'Something went wrong while starting the scan. Please try again.',
      500,
      process.env.NODE_ENV === 'development' ? String(err) : undefined
    );
  }
}
