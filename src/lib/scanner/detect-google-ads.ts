// src/lib/scanner/detect-google-ads.ts
// Checks Google Ads Transparency Center for active ads by a given domain.
// No API key required — the Transparency Center is publicly accessible.
// Gracefully returns { hasActiveAds: false } on any error.

const TRANSPARENCY_URL = 'https://adstransparency.google.com';
const REQUEST_TIMEOUT_MS = 10_000;

// ============================================================
// Types
// ============================================================

export interface GoogleAdsResult {
  hasActiveAds: boolean;
  adCount: number | null;
  transparencyUrl: string;
}

// ============================================================
// Main detection function
// ============================================================

/**
 * Check Google Ads Transparency Center for active ads by a given domain.
 * Returns structured results for the traffic stage analyzer.
 *
 * This is a best-effort check — the Transparency Center doesn't have a
 * public API, so we inspect the advertiser page for content indicators.
 */
export async function detectGoogleAds(domain: string): Promise<GoogleAdsResult> {
  // Normalize domain — strip protocol and www
  const cleanDomain = normalizeDomain(domain);
  const searchUrl = `${TRANSPARENCY_URL}/advertiser/${encodeURIComponent(cleanDomain)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgeScanner/1.0)' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { hasActiveAds: false, adCount: null, transparencyUrl: searchUrl };
    }

    const html = await response.text();
    // Check for indicators of active ads in the page content
    const hasAds = html.includes('ad-creative') || html.includes('advertiser-page');

    return {
      hasActiveAds: hasAds,
      adCount: null, // Exact count requires JS rendering — defer for now
      transparencyUrl: searchUrl,
    };
  } catch {
    // Timeout or network error — don't block the scan
    return { hasActiveAds: false, adCount: null, transparencyUrl: searchUrl };
  }
}

// ============================================================
// Helpers
// ============================================================

function normalizeDomain(domain: string): string {
  let hostname = domain;
  if (hostname.includes('://')) {
    try {
      hostname = new URL(hostname).hostname;
    } catch {
      // If URL parsing fails, use as-is
    }
  }
  return hostname.replace(/^www\./, '');
}
