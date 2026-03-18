// POST /api/followup/scrape-contact
// Scrapes contact information from a website (and optionally GBP) for follow-up outreach

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ScrapeContactResponse, ApiError } from '@/../contracts/api';
import { apiError, validateBody } from '@/lib/api-utils';
import { createServiceClient } from '@/lib/db/client';
import type { DbScan, DbScreenshot } from '@/lib/db/types';
import {
  scrapeContactsFromHtml,
  scrapeContactsFromGBP,
  mergeContactResults,
} from '@/lib/ai/contact-scraper';

const scrapeContactSchema = z.object({
  scanId: z.string().min(1, 'scanId is required'),
  websiteUrl: z.string().url('websiteUrl must be a valid URL'),
});

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch a URL with a hard timeout. Returns the text body or throws.
 */
async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ScrapeContactResponse | ApiError>> {
  let body: z.infer<typeof scrapeContactSchema>;

  try {
    body = await validateBody(request, scrapeContactSchema);
  } catch (thrown: unknown) {
    // validateBody throws a NextResponse on failure
    return thrown as NextResponse<ApiError>;
  }

  const { scanId, websiteUrl } = body;

  try {
    // ── 1. Verify the scan exists ──────────────────────────────
    const supabase = createServiceClient();

    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single<DbScan>();

    if (scanError || !scan) {
      return apiError('NOT_FOUND', `Scan ${scanId} not found`, 404);
    }

    // ── 2. Fetch website HTML ──────────────────────────────────
    let html: string;
    try {
      html = await fetchWithTimeout(websiteUrl);
    } catch (fetchErr: unknown) {
      const message =
        fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error';
      return apiError(
        'FETCH_FAILED',
        `Could not fetch ${websiteUrl}: ${message}`,
        502,
      );
    }

    // ── 3. Scrape contacts from the HTML ───────────────────────
    const htmlResult = await scrapeContactsFromHtml(html);

    // ── 4. Check for GBP screenshot and scrape if present ──────
    const { data: gbpScreenshots } = await supabase
      .from('screenshots')
      .select('source_url')
      .eq('scan_id', scanId)
      .eq('source_type', 'gbp')
      .limit(1)
      .returns<Pick<DbScreenshot, 'source_url'>[]>();

    let gbpResult: Awaited<ReturnType<typeof scrapeContactsFromGBP>> | undefined;

    if (gbpScreenshots && gbpScreenshots.length > 0) {
      const gbpUrl = gbpScreenshots[0].source_url;
      try {
        const gbpHtml = await fetchWithTimeout(gbpUrl);
        gbpResult = await scrapeContactsFromGBP(gbpHtml);
      } catch {
        // GBP fetch failure is non-fatal — continue with HTML-only results
        console.warn(`[scrape-contact] GBP fetch failed for ${gbpUrl}`);
      }
    }

    // ── 5. Merge results ───────────────────────────────────────
    const merged = mergeContactResults(htmlResult, gbpResult);

    // ── 6. Update lead record if we found contact info ─────────
    if (merged.email || merged.phone) {
      const updateData: Record<string, string> = { capture_method: 'scraped' };
      if (merged.email) updateData.email = merged.email;
      if (merged.phone) updateData.phone = merged.phone;

      await supabase
        .from('leads')
        .update(updateData)
        .eq('id', scan.lead_id);
    }

    // ── 7. Return response ─────────────────────────────────────
    const response: ScrapeContactResponse = {
      found: !!(merged.email || merged.phone),
      email: merged.email ?? undefined,
      phone: merged.phone ?? undefined,
      source: merged.source,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[scrape-contact] Unhandled error:', message);
    return apiError('INTERNAL', 'Failed to scrape contact information', 500, message);
  }
}
