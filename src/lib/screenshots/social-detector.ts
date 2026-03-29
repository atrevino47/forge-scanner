// src/lib/screenshots/social-detector.ts
// Detects social profile links, inner pages, and GBP presence from raw HTML.
// Uses regex and string parsing only — no DOM parser dependency.

import type { DetectedSocials, FunnelStage } from '../../../contracts/types';

// ============================================================
// Types
// ============================================================

type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin';

interface SocialMatch {
  platform: SocialPlatform;
  url: string;
  handle: string;
  inNavArea: boolean;
}

export interface InnerPageLink {
  url: string;
  stage: FunnelStage;
  label: string;
}

export interface SocialDetectionResult {
  resolved: DetectedSocials;
  ambiguous: Record<string, Array<{ handle: string; url: string }>>;
}

export interface GbpDetectionResult {
  found: boolean;
  placeId?: string;
  mapsUrl?: string;
}

// ============================================================
// Social platform URL patterns
// ============================================================

const SOCIAL_PATTERNS: ReadonlyArray<{
  platform: SocialPlatform;
  urlPattern: RegExp;
  handleExtractor: (url: string) => string;
}> = [
  {
    platform: 'instagram',
    urlPattern: /instagram\.com\/([a-zA-Z0-9_.]+)/i,
    handleExtractor: (url: string): string => {
      const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
      return match ? `@${match[1]}` : '';
    },
  },
  {
    platform: 'facebook',
    urlPattern: /facebook\.com\/([a-zA-Z0-9_./-]+)/i,
    handleExtractor: (url: string): string => {
      const match = url.match(/facebook\.com\/([a-zA-Z0-9_./-]+)/i);
      if (!match) return '';
      // Clean trailing slashes and query params
      const raw = match[1].replace(/\/+$/, '').split('?')[0];
      return `@${raw}`;
    },
  },
  {
    platform: 'tiktok',
    urlPattern: /tiktok\.com\/@?([a-zA-Z0-9_.]+)/i,
    handleExtractor: (url: string): string => {
      const match = url.match(/tiktok\.com\/@?([a-zA-Z0-9_.]+)/i);
      return match ? `@${match[1]}` : '';
    },
  },
  {
    platform: 'linkedin',
    urlPattern: /linkedin\.com\/(company|in)\/([a-zA-Z0-9_-]+)/i,
    handleExtractor: (url: string): string => {
      const match = url.match(/linkedin\.com\/(company|in)\/([a-zA-Z0-9_-]+)/i);
      return match ? `@${match[2]}` : '';
    },
  },
];

// ============================================================
// Navigation area detection
// ============================================================

/**
 * Checks if an anchor tag appears inside a header, footer, or nav element.
 * Uses a heuristic: looks backward from the anchor position for opening tags.
 */
function isInNavArea(html: string, anchorIndex: number): boolean {
  // Look at the surrounding context (up to 5000 chars before the anchor)
  const lookbackDistance = Math.min(anchorIndex, 5000);
  const preceding = html.substring(anchorIndex - lookbackDistance, anchorIndex).toLowerCase();

  // Find the most recent opening/closing of nav-area elements
  const navAreaTags = ['<header', '<footer', '<nav', '</header', '</footer', '</nav'];

  let lastOpenIndex = -1;
  let lastCloseIndex = -1;

  for (const tag of navAreaTags) {
    const idx = preceding.lastIndexOf(tag);
    if (idx === -1) continue;

    if (tag.startsWith('</')) {
      if (idx > lastCloseIndex) lastCloseIndex = idx;
    } else {
      if (idx > lastOpenIndex) lastOpenIndex = idx;
    }
  }

  // If the most recent nav-area tag is an opening tag (not a close), we're inside it
  return lastOpenIndex > lastCloseIndex;
}

// ============================================================
// detectSocialLinks
// ============================================================

/**
 * Scans HTML for social profile links (Instagram, Facebook, TikTok, LinkedIn).
 *
 * Detection strategy:
 * - Finds all <a> tags with href containing social platform domains
 * - Extracts handles from URLs
 * - Confidence: 'high' if link is in header/footer/nav OR only one link per platform
 * - If multiple different handles found for same platform with no clear winner,
 *   returns them as ambiguous (the pipeline will emit a social_ambiguous event)
 */
export function detectSocialLinks(html: string, _websiteUrl: string): SocialDetectionResult {
  const resolved: DetectedSocials = {};
  const ambiguous: Record<string, Array<{ handle: string; url: string }>> = {};

  // Extract all <a> tags with href attributes
  const anchorRegex = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const matches: Array<{ href: string; index: number }> = [];
  let anchorMatch: RegExpExecArray | null;

  while ((anchorMatch = anchorRegex.exec(html)) !== null) {
    matches.push({ href: anchorMatch[1], index: anchorMatch.index });
  }

  // Group social matches by platform
  const socialMatches = new Map<SocialPlatform, SocialMatch[]>();

  for (const { href, index } of matches) {
    for (const pattern of SOCIAL_PATTERNS) {
      if (pattern.urlPattern.test(href)) {
        const handle = pattern.handleExtractor(href);
        if (!handle) continue;

        const existing = socialMatches.get(pattern.platform) ?? [];
        existing.push({
          platform: pattern.platform,
          url: href,
          handle,
          inNavArea: isInNavArea(html, index),
        });
        socialMatches.set(pattern.platform, existing);
      }
    }
  }

  // Process each platform
  for (const [platform, platformMatches] of Array.from(socialMatches.entries())) {
    if (platformMatches.length === 0) continue;

    // Deduplicate by handle
    const uniqueHandles = new Map<string, SocialMatch>();
    for (const match of platformMatches) {
      const normalizedHandle = match.handle.toLowerCase();
      const existing = uniqueHandles.get(normalizedHandle);

      // Prefer nav-area matches over non-nav-area
      if (!existing || (!existing.inNavArea && match.inNavArea)) {
        uniqueHandles.set(normalizedHandle, match);
      }
    }

    const uniqueMatches = Array.from(uniqueHandles.values());

    if (uniqueMatches.length === 1) {
      // Single handle — high confidence if in nav area, otherwise still high (only one option)
      const match = uniqueMatches[0];
      resolved[platform] = {
        handle: match.handle,
        url: match.url,
        confidence: 'high',
      };
    } else {
      // Multiple different handles — pick the nav-area one if available
      const navMatch = uniqueMatches.find((m) => m.inNavArea);

      if (navMatch) {
        // Found one in nav area — high confidence
        resolved[platform] = {
          handle: navMatch.handle,
          url: navMatch.url,
          confidence: 'high',
        };
      } else {
        // Multiple handles, none in nav — ambiguous, let the user decide
        ambiguous[platform] = uniqueMatches.map((m) => ({
          handle: m.handle,
          url: m.url,
        }));
      }
    }
  }

  return { resolved, ambiguous };
}

// ============================================================
// Inner page detection
// ============================================================

/** Keywords that map link text or href segments to funnel stages */
const STAGE_KEYWORDS: ReadonlyArray<{
  stage: FunnelStage;
  keywords: ReadonlyArray<string>;
  priority: number;
}> = [
  {
    stage: 'capture',
    keywords: [
      'contact', 'quote', 'free-quote', 'get-started', 'book', 'schedule',
      'appointment', 'consultation', 'request', 'estimate', 'inquiry',
      'sign-up', 'signup', 'register', 'demo', 'trial',
    ],
    priority: 1,
  },
  {
    stage: 'offer',
    keywords: [
      'services', 'pricing', 'products', 'plans', 'packages', 'solutions',
      'features', 'offerings', 'rates', 'cost', 'shop', 'store',
      'what-we-do', 'our-work', 'menu',
    ],
    priority: 2,
  },
  {
    stage: 'landing',
    keywords: [
      'about', 'team', 'reviews', 'testimonials', 'who-we-are',
      'our-story', 'mission', 'values', 'staff', 'leadership',
      'case-studies', 'results', 'success-stories',
    ],
    priority: 3,
  },
  {
    stage: 'traffic',
    keywords: [
      'blog', 'portfolio', 'gallery', 'news', 'articles', 'resources',
      'insights', 'projects', 'media', 'press', 'videos',
    ],
    priority: 4,
  },
];

const MAX_INNER_PAGES = 5;

/**
 * Normalizes a relative or absolute URL against a base URL.
 * Returns null if the URL is external or invalid.
 */
function resolveUrl(href: string, baseUrl: string): string | null {
  // Skip anchors, mailto, tel, javascript
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:')
  ) {
    return null;
  }

  try {
    const base = new URL(baseUrl);
    const resolved = new URL(href, baseUrl);

    // Only keep same-origin links
    if (resolved.hostname !== base.hostname) {
      return null;
    }

    // Skip the homepage itself
    if (resolved.pathname === '/' || resolved.pathname === '') {
      return null;
    }

    // Return clean URL without hash
    resolved.hash = '';
    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * Extracts a human-readable label from anchor tag HTML.
 * Looks for text content, title attribute, or aria-label.
 */
function extractLabel(anchorHtml: string, closingIndex: number, fullHtml: string): string {
  // Get everything between the opening and closing </a> tag
  const afterOpen = fullHtml.substring(closingIndex);
  const closeTagIndex = afterOpen.indexOf('</a');
  if (closeTagIndex === -1) return '';

  const innerHtml = afterOpen.substring(0, closeTagIndex);

  // Strip all HTML tags to get text content
  const textContent = innerHtml.replace(/<[^>]*>/g, '').trim();

  if (textContent) return textContent;

  // Fallback: look for title or aria-label attributes
  const titleMatch = anchorHtml.match(/title\s*=\s*["']([^"']+)["']/i);
  if (titleMatch) return titleMatch[1].trim();

  const ariaMatch = anchorHtml.match(/aria-label\s*=\s*["']([^"']+)["']/i);
  if (ariaMatch) return ariaMatch[1].trim();

  return '';
}

/**
 * Classifies a link's funnel stage based on its URL path and link text.
 */
function classifyLink(
  url: string,
  label: string,
): { stage: FunnelStage; priority: number } | null {
  const lowerUrl = url.toLowerCase();
  const lowerLabel = label.toLowerCase();

  for (const stageConfig of STAGE_KEYWORDS) {
    for (const keyword of stageConfig.keywords) {
      if (lowerUrl.includes(keyword) || lowerLabel.includes(keyword)) {
        return { stage: stageConfig.stage, priority: stageConfig.priority };
      }
    }
  }

  return null;
}

/**
 * Finds internal page links from HTML and classifies them by funnel stage.
 * Returns up to 5 pages, prioritizing capture and offer stages.
 */
export function detectInnerPages(html: string, baseUrl: string): InnerPageLink[] {
  const anchorRegex = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const candidates: Array<InnerPageLink & { priority: number }> = [];
  const seenUrls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const resolvedUrl = resolveUrl(href, baseUrl);

    if (!resolvedUrl || seenUrls.has(resolvedUrl)) continue;
    seenUrls.add(resolvedUrl);

    // Get the end of the opening <a> tag to find inner text
    const openTagEnd = match.index + match[0].length;
    const label = extractLabel(match[0], openTagEnd, html);

    const classification = classifyLink(resolvedUrl, label);
    if (!classification) continue;

    candidates.push({
      url: resolvedUrl,
      stage: classification.stage,
      label: label || resolvedUrl,
      priority: classification.priority,
    });
  }

  // Sort by priority (capture=1, offer=2, landing=3, traffic=4)
  candidates.sort((a, b) => a.priority - b.priority);

  // Deduplicate by stage — keep at most 2 per stage
  const perStageCount = new Map<FunnelStage, number>();
  const filtered: InnerPageLink[] = [];

  for (const candidate of candidates) {
    if (filtered.length >= MAX_INNER_PAGES) break;

    const count = perStageCount.get(candidate.stage) ?? 0;
    if (count >= 2) continue;

    perStageCount.set(candidate.stage, count + 1);
    filtered.push({
      url: candidate.url,
      stage: candidate.stage,
      label: candidate.label,
    });
  }

  return filtered;
}

// ============================================================
// GBP (Google Business Profile) detection
// ============================================================

/**
 * Looks for Google Business Profile indicators in the HTML:
 * - Google Maps embeds (<iframe> with google.com/maps)
 * - Links to google.com/maps
 * - Structured data (JSON-LD) with Google Place IDs
 *
 * Returns detection result with optional placeId and mapsUrl.
 */
export function detectGbpFromHtml(html: string): GbpDetectionResult {
  // ---- 1. Look for Google Maps iframe embeds ----
  const iframeRegex = /<iframe[^>]*src\s*=\s*["']([^"']*google\.com\/maps[^"']*)["'][^>]*>/gi;
  let iframeMatch: RegExpExecArray | null;

  while ((iframeMatch = iframeRegex.exec(html)) !== null) {
    const embedUrl = iframeMatch[1];

    // Try to extract a Place ID from the embed URL
    const placeIdMatch = embedUrl.match(/place_id[=:]([A-Za-z0-9_-]+)/i);

    return {
      found: true,
      placeId: placeIdMatch ? placeIdMatch[1] : undefined,
      mapsUrl: embedUrl,
    };
  }

  // ---- 2. Look for links to google.com/maps ----
  const mapsLinkRegex = /href\s*=\s*["'](https?:\/\/(?:www\.)?google\.com\/maps[^"']*)["']/gi;
  let mapsMatch: RegExpExecArray | null;

  while ((mapsMatch = mapsLinkRegex.exec(html)) !== null) {
    const mapsUrl = mapsMatch[1];

    // Extract Place ID if present
    const placeIdMatch = mapsUrl.match(/place_id[=:]([A-Za-z0-9_-]+)/i);

    return {
      found: true,
      placeId: placeIdMatch ? placeIdMatch[1] : undefined,
      mapsUrl,
    };
  }

  // ---- 3. Look for goo.gl/maps short links ----
  const shortLinkRegex = /href\s*=\s*["'](https?:\/\/goo\.gl\/maps\/[^"']*)["']/gi;
  const shortMatch = shortLinkRegex.exec(html);

  if (shortMatch) {
    return {
      found: true,
      mapsUrl: shortMatch[1],
    };
  }

  // ---- 4. Look for structured data (JSON-LD) with Place IDs ----
  const jsonLdRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch: RegExpExecArray | null;

  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    const jsonContent = jsonLdMatch[1];

    // Look for Google Place ID patterns in the JSON-LD
    const placeIdInJson = jsonContent.match(/(?:place_id|placeId|google_place_id)["'\s:]+["']?([A-Za-z0-9_-]{20,})["']?/i);

    if (placeIdInJson) {
      return {
        found: true,
        placeId: placeIdInJson[1],
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeIdInJson[1]}`,
      };
    }

    // Also check for hasMap property pointing to Google Maps
    const hasMapMatch = jsonContent.match(/["']hasMap["']\s*:\s*["'](https?:\/\/(?:www\.)?google\.com\/maps[^"']*)["']/i);

    if (hasMapMatch) {
      return {
        found: true,
        mapsUrl: hasMapMatch[1],
      };
    }
  }

  // ---- 5. Look for maps.google.com links (alternate domain) ----
  const altMapsRegex = /href\s*=\s*["'](https?:\/\/maps\.google\.com[^"']*)["']/gi;
  const altMatch = altMapsRegex.exec(html);

  if (altMatch) {
    return {
      found: true,
      mapsUrl: altMatch[1],
    };
  }

  return { found: false };
}
