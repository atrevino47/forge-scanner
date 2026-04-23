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

/**
 * Blocks SSRF targets: loopback, RFC1918, link-local, cloud metadata.
 * Static hostname/IP check — no DNS resolution required.
 */
function isPrivateOrMetadataHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  const blocked = ['localhost', 'metadata.google.internal'];
  if (blocked.includes(h)) return true;
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.test')) return true;

  // IPv6 loopback / private
  if (h === '::1' || h === '0:0:0:0:0:0:0:1') return true;
  if (/^f[cd]/i.test(h)) return true; // fc00::/7

  // IPv4 literal check
  const parts = h.split('.');
  if (parts.length === 4) {
    const nums = parts.map(Number);
    if (nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      const [a, b] = nums;
      if (a === 0) return true;            // 0.0.0.0/8
      if (a === 10) return true;           // 10.0.0.0/8
      if (a === 127) return true;          // 127.0.0.0/8 loopback
      if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / AWS metadata
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
    }
  }

  return false;
}

const StartScanSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .transform((val) => {
      let trimmed = val.trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = `https://${trimmed}`;
      }
      return trimmed.replace(/\/+$/, '');
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
  providedSocials: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

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

    const { url: normalizedUrl, utmSource, utmMedium, utmCampaign, providedSocials } = parsed.data;

    // (b) SSRF guard — reject private/metadata hosts
    try {
      const { hostname } = new URL(normalizedUrl);
      if (isPrivateOrMetadataHost(hostname)) {
        return apiError('INVALID_INPUT', 'URL is not permitted.', 400);
      }
    } catch {
      return apiError('INVALID_INPUT', 'Invalid URL.', 400);
    }

    // (c) Get client IP
    const clientIp = getClientIp(request);

    // (c) Check rate limits: 5/minute burst guard, then 3/24h daily limit
    const burstLimit = await checkRateLimit(clientIp, 'ip_api', 5, 60000);
    if (!burstLimit.allowed) {
      return apiError(
        'RATE_LIMITED',
        'Too many requests. Please slow down.',
        429,
        { remaining: 0, resetAt: burstLimit.resetAt }
      );
    }

    const rateLimit = await checkRateLimit(clientIp, 'ip_scan', 20, 86400000);
    if (!rateLimit.allowed) {
      return apiError(
        'RATE_LIMITED',
        'You have reached the maximum number of scans. Please try again later.',
        429,
        { remaining: rateLimit.remaining, resetAt: rateLimit.resetAt }
      );
    }

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
        ...(providedSocials && { provided_socials: providedSocials }),
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
    console.log(`[scan/start] Initiated scan scanId=${scan.id}`);

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
