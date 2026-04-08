// src/lib/scanner/detect-google-ads.ts
// Detects Google Ads usage by inspecting the homepage HTML for conversion
// tracking, remarketing tags, and Google Ads scripts. More reliable than
// querying the Transparency Center (which requires JS rendering).
//
// No API key required. Uses HTML already captured by the pipeline.

// ============================================================
// Types
// ============================================================

export interface GoogleAdsResult {
  hasActiveAds: boolean;
  adCount: number | null;
  signals: string[];
  transparencyUrl: string;
}

// ============================================================
// Signal patterns — ordered by confidence
// ============================================================

interface SignalPattern {
  name: string;
  test: (html: string) => boolean;
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    name: 'Google Ads conversion tag (AW-)',
    test: (html) => /['"]AW-\d{5,}['"]/.test(html),
  },
  {
    name: 'googleadservices.com script',
    test: (html) => html.includes('googleadservices.com'),
  },
  {
    name: 'Google Ads conversion linker',
    test: (html) => html.includes('conversion_linker') || html.includes('conversionLinker'),
  },
  {
    name: 'Google Ads remarketing tag',
    test: (html) =>
      html.includes('google_remarketing') ||
      html.includes('googleads.g.doubleclick.net') ||
      html.includes('www.googleadservices.com/pagead/conversion'),
  },
  {
    name: 'gtag ads config',
    test: (html) => /gtag\s*\(\s*['"]config['"]\s*,\s*['"]AW-/.test(html),
  },
  {
    name: 'Google Ads phone conversion',
    test: (html) => html.includes('google_call_conversion') || html.includes('wcm.js'),
  },
  {
    name: 'Google Tag Manager (potential ads)',
    test: (html) => /GTM-[A-Z0-9]{4,}/.test(html),
  },
];

// GTM alone is weak evidence — many sites use it without ads.
// Only count it when combined with other signals.
const WEAK_SIGNALS = new Set(['Google Tag Manager (potential ads)']);

// ============================================================
// Main detection function
// ============================================================

/**
 * Detect Google Ads usage from captured homepage HTML.
 * Looks for conversion tags, remarketing scripts, and ad infrastructure.
 * Returns structured results for the traffic stage analyzer.
 */
export function detectGoogleAds(html: string, domain: string): GoogleAdsResult {
  const cleanDomain = normalizeDomain(domain);
  const transparencyUrl = `https://adstransparency.google.com/?domain=${encodeURIComponent(cleanDomain)}`;

  if (!html || html.length < 100) {
    return { hasActiveAds: false, adCount: null, signals: [], transparencyUrl };
  }

  const matchedSignals: string[] = [];

  for (const pattern of SIGNAL_PATTERNS) {
    if (pattern.test(html)) {
      matchedSignals.push(pattern.name);
    }
  }

  // Require at least one strong signal, or 2+ signals including weak ones
  const strongSignals = matchedSignals.filter((s) => !WEAK_SIGNALS.has(s));
  const hasActiveAds = strongSignals.length >= 1 || matchedSignals.length >= 2;

  return {
    hasActiveAds,
    adCount: null,
    signals: matchedSignals,
    transparencyUrl,
  };
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
