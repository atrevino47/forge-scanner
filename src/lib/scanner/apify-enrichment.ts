// src/lib/scanner/apify-enrichment.ts
// Enriches detected social profiles with quantitative metrics via Apify scrapers.
//
// Returns follower counts, engagement rates, post frequency, review data.
// This data feeds into the traffic stage AI analysis alongside screenshots,
// enabling specific annotations like "Your 2,400 followers generate 0.5% engagement."
//
// Requires APIFY_API_TOKEN env var. Gracefully returns empty if not configured.
// Estimated cost: ~$0.05-0.10 per scan.

import { ApifyClient } from 'apify-client';
import type {
  DetectedSocials,
  SocialEnrichmentResult,
  SocialProfileMetrics,
} from '@/../../contracts/types';

const APIFY_TIMEOUT_MS = 30_000; // 30s per scraper run
const ACTOR_MEMORY_MB = 256;

// Actor IDs for each platform scraper
const ACTORS = {
  instagram: 'apify/instagram-profile-scraper',
  tiktok: 'clockworks/free-tiktok-scraper',
  facebook: 'apify/facebook-pages-scraper',
  googleMaps: 'compass/crawler-google-places',
  youtube: 'streamers/youtube-scraper',
  twitter: 'apidojo/tweet-scraper',
} as const;

const YOUTUBE_MAX_VIDEOS = 10;
const TWITTER_MAX_TWEETS = 10;

// ============================================================
// Main enrichment function
// ============================================================

/**
 * Enrich detected social profiles with quantitative data from Apify scrapers.
 * Runs all available scrapers in parallel. Each scraper failure is isolated.
 */
export async function enrichSocialProfiles(
  socials: DetectedSocials,
  gbpPlaceId?: string | null,
): Promise<SocialEnrichmentResult | null> {
  const apiToken = process.env.APIFY_API_TOKEN;

  if (!apiToken) {
    console.warn('[apify-enrichment] APIFY_API_TOKEN not set — skipping social enrichment');
    return null;
  }

  const client = new ApifyClient({ token: apiToken });
  const scraperPromises: Promise<SocialProfileMetrics | null>[] = [];

  // Instagram
  if (socials.instagram?.confidence === 'high') {
    scraperPromises.push(
      scrapeInstagram(client, socials.instagram.handle),
    );
  }

  // TikTok
  if (socials.tiktok?.confidence === 'high') {
    scraperPromises.push(
      scrapeTikTok(client, socials.tiktok.handle),
    );
  }

  // Facebook
  if (socials.facebook?.confidence === 'high') {
    scraperPromises.push(
      scrapeFacebook(client, socials.facebook.url),
    );
  }

  // Google Maps / GBP
  if (gbpPlaceId) {
    scraperPromises.push(
      scrapeGoogleMaps(client, gbpPlaceId),
    );
  }

  // YouTube
  if (socials.youtube?.confidence === 'high') {
    scraperPromises.push(
      scrapeYouTube(client, socials.youtube.url),
    );
  }

  // X / Twitter
  if (socials.twitter?.confidence === 'high') {
    scraperPromises.push(
      scrapeTwitter(client, socials.twitter.handle),
    );
  }

  if (scraperPromises.length === 0) {
    return null;
  }

  const results = await Promise.allSettled(scraperPromises);
  const profiles: SocialProfileMetrics[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      profiles.push(result.value);
    }
  }

  if (profiles.length === 0) {
    return null;
  }

  return {
    profiles,
    enrichedAt: new Date().toISOString(),
  };
}

// ============================================================
// Instagram scraper
// ============================================================

interface InstagramProfileResult {
  username: string;
  fullName: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  biography: string;
  isVerified: boolean;
  latestPosts?: Array<{
    likesCount: number;
    commentsCount: number;
  }>;
}

async function scrapeInstagram(
  client: ApifyClient,
  handle: string,
): Promise<SocialProfileMetrics | null> {
  try {
    const run = await client.actor(ACTORS.instagram).call(
      { usernames: [handle.replace('@', '')] },
      { memory: ACTOR_MEMORY_MB, waitSecs: APIFY_TIMEOUT_MS / 1000 },
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) return null;

    const profile = items[0] as unknown as InstagramProfileResult;
    const avgLikes = calculateAverage(profile.latestPosts?.map((p) => p.likesCount));
    const avgComments = calculateAverage(profile.latestPosts?.map((p) => p.commentsCount));
    const engagementRate = profile.followersCount > 0 && avgLikes !== null
      ? ((avgLikes + (avgComments ?? 0)) / profile.followersCount) * 100
      : null;

    return {
      platform: 'instagram',
      handle: profile.username,
      followerCount: profile.followersCount,
      followingCount: profile.followsCount,
      postCount: profile.postsCount,
      engagementRate: engagementRate ? Math.round(engagementRate * 100) / 100 : null,
      avgLikes,
      avgComments,
      isVerified: profile.isVerified,
      bio: profile.biography || null,
      reviewCount: null,
      averageRating: null,
      totalPhotos: null,
    };
  } catch (error) {
    console.error(`[apify-enrichment] Instagram scrape failed for @${handle}:`, error);
    return null;
  }
}

// ============================================================
// TikTok scraper
// ============================================================

interface TikTokProfileResult {
  authorMeta?: {
    name: string;
    fans: number;
    following: number;
    heart: number;
    video: number;
    verified: boolean;
    signature: string;
  };
}

async function scrapeTikTok(
  client: ApifyClient,
  handle: string,
): Promise<SocialProfileMetrics | null> {
  try {
    const cleanHandle = handle.replace('@', '');
    const run = await client.actor(ACTORS.tiktok).call(
      {
        profiles: [`https://www.tiktok.com/@${cleanHandle}`],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
      },
      { memory: ACTOR_MEMORY_MB, waitSecs: APIFY_TIMEOUT_MS / 1000 },
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) return null;

    const data = items[0] as unknown as TikTokProfileResult;
    const meta = data.authorMeta;
    if (!meta) return null;

    return {
      platform: 'tiktok',
      handle: meta.name,
      followerCount: meta.fans,
      followingCount: meta.following,
      postCount: meta.video,
      engagementRate: null, // TikTok engagement varies wildly, let AI analyze
      avgLikes: meta.heart > 0 && meta.video > 0 ? Math.round(meta.heart / meta.video) : null,
      avgComments: null,
      isVerified: meta.verified,
      bio: meta.signature || null,
      reviewCount: null,
      averageRating: null,
      totalPhotos: null,
    };
  } catch (error) {
    console.error(`[apify-enrichment] TikTok scrape failed for @${handle}:`, error);
    return null;
  }
}

// ============================================================
// Facebook page scraper
// ============================================================

interface FacebookPageResult {
  name: string;
  likes: number;
  followers: number;
  about: string;
  isVerified: boolean;
}

async function scrapeFacebook(
  client: ApifyClient,
  pageUrl: string,
): Promise<SocialProfileMetrics | null> {
  try {
    const run = await client.actor(ACTORS.facebook).call(
      { startUrls: [{ url: pageUrl }] },
      { memory: ACTOR_MEMORY_MB, waitSecs: APIFY_TIMEOUT_MS / 1000 },
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) return null;

    const page = items[0] as unknown as FacebookPageResult;

    return {
      platform: 'facebook',
      handle: page.name,
      followerCount: page.followers,
      followingCount: null,
      postCount: null,
      engagementRate: null,
      avgLikes: page.likes > 0 ? page.likes : null,
      avgComments: null,
      isVerified: page.isVerified,
      bio: page.about || null,
      reviewCount: null,
      averageRating: null,
      totalPhotos: null,
    };
  } catch (error) {
    console.error(`[apify-enrichment] Facebook scrape failed for ${pageUrl}:`, error);
    return null;
  }
}

// ============================================================
// Google Maps scraper
// ============================================================

interface GoogleMapsResult {
  title: string;
  totalScore: number;
  reviewsCount: number;
  imageCount: number;
  categoryName: string;
}

async function scrapeGoogleMaps(
  client: ApifyClient,
  placeId: string,
): Promise<SocialProfileMetrics | null> {
  try {
    const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const run = await client.actor(ACTORS.googleMaps).call(
      {
        startUrls: [{ url: mapsUrl }],
        maxCrawledPlacesPerSearch: 1,
        includeReviews: false,
      },
      { memory: ACTOR_MEMORY_MB, waitSecs: APIFY_TIMEOUT_MS / 1000 },
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) return null;

    const place = items[0] as unknown as GoogleMapsResult;

    return {
      platform: 'google_maps',
      handle: place.title,
      followerCount: null,
      followingCount: null,
      postCount: null,
      engagementRate: null,
      avgLikes: null,
      avgComments: null,
      isVerified: false,
      bio: place.categoryName || null,
      reviewCount: place.reviewsCount,
      averageRating: place.totalScore,
      totalPhotos: place.imageCount,
    };
  } catch (error) {
    console.error(`[apify-enrichment] Google Maps scrape failed for place ${placeId}:`, error);
    return null;
  }
}

// ============================================================
// YouTube scraper (streamers/youtube-scraper)
// ============================================================

interface YouTubeChannelResult {
  channelName?: string;
  channelUrl?: string;
  channelUsername?: string;
  numberOfSubscribers?: number;
  channelTotalVideos?: number;
  channelDescription?: string;
  viewCount?: number;
  likes?: number;
  commentsCount?: number;
}

async function scrapeYouTube(
  client: ApifyClient,
  channelUrl: string,
): Promise<SocialProfileMetrics | null> {
  try {
    const run = await client.actor(ACTORS.youtube).call(
      {
        startUrls: [{ url: channelUrl }],
        maxResults: YOUTUBE_MAX_VIDEOS,
        maxResultStreams: 0,
        maxResultsShorts: 0,
      },
      { memory: ACTOR_MEMORY_MB, waitSecs: APIFY_TIMEOUT_MS / 1000 },
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (items.length === 0) return null;

    const videos = items as unknown as YouTubeChannelResult[];
    const channel = videos[0];

    const subs = channel.numberOfSubscribers ?? null;
    const views = videos.map((v) => v.viewCount).filter((v): v is number => typeof v === 'number');
    const likes = videos.map((v) => v.likes).filter((v): v is number => typeof v === 'number');
    const comments = videos.map((v) => v.commentsCount).filter((v): v is number => typeof v === 'number');

    const avgLikes = calculateAverage(likes);
    const avgComments = calculateAverage(comments);
    const avgViews = calculateAverage(views);
    // YouTube engagement rate: (likes + comments) / views across sampled videos
    const engagementRate = avgViews && avgViews > 0 && avgLikes !== null
      ? Math.round(((avgLikes + (avgComments ?? 0)) / avgViews) * 10000) / 100
      : null;

    return {
      platform: 'youtube',
      handle: channel.channelUsername || channel.channelName || 'unknown',
      followerCount: subs,
      followingCount: null,
      postCount: channel.channelTotalVideos ?? null,
      engagementRate,
      avgLikes,
      avgComments,
      isVerified: false,
      bio: channel.channelDescription || null,
      reviewCount: null,
      averageRating: null,
      totalPhotos: null,
    };
  } catch (error) {
    console.error(`[apify-enrichment] YouTube scrape failed for ${channelUrl}:`, error);
    return null;
  }
}

// ============================================================
// X / Twitter scraper (apidojo/tweet-scraper V2)
// ============================================================

interface TweetResult {
  author?: {
    userName?: string;
    name?: string;
    followers?: number;
    following?: number;
    statusesCount?: number;
    isVerified?: boolean;
    description?: string;
  };
  likeCount?: number;
  replyCount?: number;
  retweetCount?: number;
  viewCount?: number;
}

async function scrapeTwitter(
  client: ApifyClient,
  handle: string,
): Promise<SocialProfileMetrics | null> {
  try {
    const cleanHandle = handle.replace('@', '');
    const run = await client.actor(ACTORS.twitter).call(
      {
        twitterHandles: [cleanHandle],
        maxItems: TWITTER_MAX_TWEETS,
        sort: 'Latest',
      },
      { memory: ACTOR_MEMORY_MB, waitSecs: APIFY_TIMEOUT_MS / 1000 },
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (items.length === 0) return null;

    const tweets = items as unknown as TweetResult[];
    const author = tweets[0]?.author;
    if (!author) return null;

    const likes = tweets.map((t) => t.likeCount).filter((v): v is number => typeof v === 'number');
    const replies = tweets.map((t) => t.replyCount).filter((v): v is number => typeof v === 'number');
    const avgLikes = calculateAverage(likes);
    const avgComments = calculateAverage(replies);
    const followers = author.followers ?? 0;
    const engagementRate = followers > 0 && avgLikes !== null
      ? Math.round(((avgLikes + (avgComments ?? 0)) / followers) * 10000) / 100
      : null;

    return {
      platform: 'twitter',
      handle: author.userName || cleanHandle,
      followerCount: author.followers ?? null,
      followingCount: author.following ?? null,
      postCount: author.statusesCount ?? null,
      engagementRate,
      avgLikes,
      avgComments,
      isVerified: author.isVerified ?? false,
      bio: author.description || null,
      reviewCount: null,
      averageRating: null,
      totalPhotos: null,
    };
  } catch (error) {
    console.error(`[apify-enrichment] Twitter scrape failed for @${handle}:`, error);
    return null;
  }
}

// ============================================================
// Helpers
// ============================================================

function calculateAverage(values?: number[]): number | null {
  if (!values || values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

// ============================================================
// Convert enrichment data to business context string
// for AI annotation prompts
// ============================================================

export function enrichmentToContext(enrichment: SocialEnrichmentResult): string {
  const lines: string[] = ['SOCIAL MEDIA METRICS (from Apify scrapers):'];

  for (const profile of enrichment.profiles) {
    const parts: string[] = [`${profile.platform.toUpperCase()} (@${profile.handle}):`];

    if (profile.followerCount !== null) {
      parts.push(`  Followers: ${formatNumber(profile.followerCount)}`);
    }
    if (profile.postCount !== null) {
      parts.push(`  Posts: ${formatNumber(profile.postCount)}`);
    }
    if (profile.engagementRate !== null) {
      parts.push(`  Engagement rate: ${profile.engagementRate}%`);
    }
    if (profile.avgLikes !== null) {
      parts.push(`  Avg likes: ${formatNumber(profile.avgLikes)}`);
    }
    if (profile.reviewCount !== null) {
      parts.push(`  Reviews: ${profile.reviewCount} (${profile.averageRating ?? '?'}/5)`);
    }
    if (profile.totalPhotos !== null) {
      parts.push(`  Photos: ${profile.totalPhotos}`);
    }
    if (profile.isVerified) {
      parts.push(`  Verified: Yes`);
    }

    lines.push(parts.join('\n'));
  }

  return lines.join('\n');
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
