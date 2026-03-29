// src/lib/scanner/ad-detection.ts
// Detects active Meta (Facebook/Instagram) ads for a business
// using the Meta Ad Library API (public transparency data).
//
// Requires FACEBOOK_APP_ACCESS_TOKEN env var.
// Gracefully returns empty result if not configured.

import type { AdDetectionResult, MetaAdData } from '@/../../contracts/types';

const META_AD_LIBRARY_URL = 'https://graph.facebook.com/v19.0/ads_archive';
const MAX_SAMPLE_ADS = 5;
const REQUEST_TIMEOUT_MS = 10_000;

// ============================================================
// Main detection function
// ============================================================

/**
 * Detect active Meta ads for a business.
 * Searches by business name and domain to maximize matches.
 * Returns structured results for the traffic stage analyzer.
 */
export async function detectMetaAds(
  businessName: string,
  domain: string,
): Promise<AdDetectionResult | null> {
  const accessToken = process.env.FACEBOOK_APP_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('[ad-detection] FACEBOOK_APP_ACCESS_TOKEN not set — skipping Meta Ad Library check');
    return null;
  }

  try {
    // Search by business name first, fall back to domain
    const results = await searchAdLibrary(businessName, accessToken);

    // If no results by name, try the domain (without TLD sometimes helps)
    if (results.length === 0) {
      const domainName = extractDomainName(domain);
      if (domainName && domainName.toLowerCase() !== businessName.toLowerCase()) {
        const domainResults = await searchAdLibrary(domainName, accessToken);
        return buildResult(domainResults);
      }
    }

    return buildResult(results);
  } catch (error) {
    console.error('[ad-detection] Meta Ad Library lookup failed:', error);
    return null;
  }
}

// ============================================================
// Meta Ad Library API
// ============================================================

interface MetaApiAd {
  id: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  publisher_platforms?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
}

interface MetaApiResponse {
  data: MetaApiAd[];
  paging?: { cursors: { after: string }; next: string };
}

async function searchAdLibrary(
  searchTerm: string,
  accessToken: string,
): Promise<MetaApiAd[]> {
  const params = new URLSearchParams({
    search_terms: searchTerm,
    ad_reached_countries: "['US']",
    ad_active_status: 'ACTIVE',
    ad_type: 'ALL',
    fields: 'id,ad_creative_bodies,ad_creative_link_titles,publisher_platforms,ad_delivery_start_time,ad_delivery_stop_time',
    limit: '25',
    access_token: accessToken,
  });

  const url = `${META_AD_LIBRARY_URL}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      console.error(`[ad-detection] Meta API returned ${response.status}: ${errorBody}`);
      return [];
    }

    const data = (await response.json()) as MetaApiResponse;
    return data.data ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// Result builders
// ============================================================

function buildResult(ads: MetaApiAd[]): AdDetectionResult {
  const activeAds = ads.filter((ad) => !ad.ad_delivery_stop_time);
  const allPlatforms = new Set<string>();

  for (const ad of ads) {
    if (ad.publisher_platforms) {
      for (const platform of ad.publisher_platforms) {
        allPlatforms.add(platform);
      }
    }
  }

  const sampleAds: MetaAdData[] = activeAds.slice(0, MAX_SAMPLE_ADS).map((ad) => ({
    id: ad.id,
    creativeBody: ad.ad_creative_bodies?.[0] ?? null,
    creativeLinkTitle: ad.ad_creative_link_titles?.[0] ?? null,
    platforms: ad.publisher_platforms ?? [],
    startDate: ad.ad_delivery_start_time ?? '',
    status: 'active' as const,
  }));

  return {
    isAdvertising: activeAds.length > 0,
    platform: 'meta',
    activeAdCount: activeAds.length,
    totalAdsFound: ads.length,
    publisherPlatforms: [...allPlatforms],
    sampleAds,
    detectedAt: new Date().toISOString(),
  };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extract the human-readable part of a domain.
 * "www.acme-plumbing.com" → "acme plumbing"
 */
function extractDomainName(domain: string): string | null {
  try {
    let hostname = domain;
    // Strip protocol if present
    if (hostname.includes('://')) {
      hostname = new URL(hostname).hostname;
    }
    // Remove www prefix
    hostname = hostname.replace(/^www\./, '');
    // Take the domain name part (before TLD)
    const parts = hostname.split('.');
    if (parts.length < 2) return null;
    // Remove TLD
    const name = parts.slice(0, -1).join(' ');
    // Replace hyphens/underscores with spaces
    return name.replace(/[-_]/g, ' ').trim() || null;
  } catch {
    return null;
  }
}
