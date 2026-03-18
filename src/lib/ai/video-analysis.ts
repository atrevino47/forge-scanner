// /src/lib/ai/video-analysis.ts
// Video content performance analysis for social media profiles

import type { VideoAnalysis, VideoData, VideoPattern } from '@/../../contracts/types';
import { analyzeWithSonnet, extractJSON } from './client';
import { getVideoAnalysisPrompt } from '../prompts/video-analysis';

// ============================================================
// Input types for video analysis
// ============================================================

export interface VideoInput {
  url: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  comments: number;
  caption: string;
  postedAt: string;
  thumbnailBase64?: string;
}

export interface ProfileVideoData {
  platform: 'instagram' | 'tiktok' | 'youtube';
  videos: VideoInput[];
  totalFollowers: number;
}

// ============================================================
// Main video analysis function
// ============================================================

export async function analyzeVideoContent(
  profileData: ProfileVideoData,
): Promise<VideoAnalysis> {
  const { platform, videos, totalFollowers } = profileData;

  // Not enough data to analyze
  if (videos.length < 3) {
    return buildInsufficientDataResult(platform, videos);
  }

  const systemPrompt = getVideoAnalysisPrompt(platform, totalFollowers);

  // Prepare video data for the AI (strip base64 thumbnails for prompt, they're too large)
  const videoDataForPrompt = videos.map((v) => ({
    url: v.url,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    caption: v.caption,
    postedAt: v.postedAt,
    engagementRate: v.views > 0
      ? Number((((v.likes + v.comments) / v.views) * 100).toFixed(2))
      : 0,
    ageInDays: Math.floor(
      (Date.now() - new Date(v.postedAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  const userPrompt = `Analyze these ${videos.length} videos from a ${platform} profile with ${totalFollowers.toLocaleString()} followers:

${JSON.stringify(videoDataForPrompt, null, 2)}`;

  const result = await analyzeWithSonnet({
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
  });

  try {
    const parsed = extractJSON<VideoAnalysis>(result);
    return validateVideoAnalysis(parsed, platform);
  } catch (error) {
    console.error(`[video-analysis] Failed to parse for ${platform}:`, error);
    return buildFallbackAnalysis(platform, videos, totalFollowers);
  }
}

// ============================================================
// Validation
// ============================================================

function validateVideoAnalysis(
  raw: VideoAnalysis,
  platform: 'instagram' | 'tiktok' | 'youtube',
): VideoAnalysis {
  return {
    platform,
    totalVideosAnalyzed: raw.totalVideosAnalyzed || 0,
    topPerformers: validateVideoDataArray(raw.topPerformers || []).slice(0, 5),
    recentVideos: validateVideoDataArray(raw.recentVideos || []).slice(0, 10),
    patterns: validatePatterns(raw.patterns),
  };
}

function validateVideoDataArray(videos: VideoData[]): VideoData[] {
  return videos.map((v) => ({
    url: v.url || '',
    thumbnailUrl: v.thumbnailUrl,
    views: Math.max(0, v.views || 0),
    likes: Math.max(0, v.likes || 0),
    comments: Math.max(0, v.comments || 0),
    engagementRate: Math.max(0, Math.min(100, v.engagementRate || 0)),
    postedAt: v.postedAt || new Date().toISOString(),
    caption: v.caption || '',
    hookType: v.hookType,
    ageInDays: Math.max(0, v.ageInDays || 0),
  }));
}

function validatePatterns(raw: VideoPattern | undefined): VideoPattern {
  if (!raw) {
    return {
      postingFrequency: 'inconsistent',
      consistencyScore: 0,
      topTopics: [],
      doublingDownScore: 0,
      bestFormat: 'mixed',
      hookVariety: 0,
      viralRecency: 'none',
    };
  }

  const validFrequencies = [
    'daily', '3-4x/week', '2x/week', 'weekly',
    'biweekly', 'monthly', 'inconsistent',
  ];
  const validFormats = [
    'talking_head', 'broll', 'screen_recording',
    'text_overlay', 'slideshow', 'interview', 'mixed',
  ];
  const validRecency = ['recent', 'stale', 'none'];

  return {
    postingFrequency: validFrequencies.includes(raw.postingFrequency)
      ? raw.postingFrequency
      : 'inconsistent',
    consistencyScore: clamp(raw.consistencyScore),
    topTopics: (raw.topTopics || []).slice(0, 5),
    doublingDownScore: clamp(raw.doublingDownScore),
    bestFormat: validFormats.includes(raw.bestFormat)
      ? raw.bestFormat
      : 'mixed',
    hookVariety: clamp(raw.hookVariety),
    viralRecency: validRecency.includes(raw.viralRecency)
      ? raw.viralRecency as 'recent' | 'stale' | 'none'
      : 'none',
  };
}

// ============================================================
// Fallback builders
// ============================================================

function buildInsufficientDataResult(
  platform: 'instagram' | 'tiktok' | 'youtube',
  videos: VideoInput[],
): VideoAnalysis {
  const videoData: VideoData[] = videos.map((v) => ({
    url: v.url,
    thumbnailUrl: v.thumbnailUrl,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    engagementRate: v.views > 0
      ? Number((((v.likes + v.comments) / v.views) * 100).toFixed(2))
      : 0,
    postedAt: v.postedAt,
    caption: v.caption,
    ageInDays: Math.floor(
      (Date.now() - new Date(v.postedAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  return {
    platform,
    totalVideosAnalyzed: videos.length,
    topPerformers: [],
    recentVideos: videoData,
    patterns: {
      postingFrequency: 'inconsistent',
      consistencyScore: 10,
      topTopics: [],
      doublingDownScore: 0,
      bestFormat: 'mixed',
      hookVariety: 0,
      viralRecency: 'none',
    },
  };
}

function buildFallbackAnalysis(
  platform: 'instagram' | 'tiktok' | 'youtube',
  videos: VideoInput[],
  totalFollowers: number,
): VideoAnalysis {
  // Calculate basic metrics from raw data
  const videoData: VideoData[] = videos.map((v) => ({
    url: v.url,
    thumbnailUrl: v.thumbnailUrl,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    engagementRate: v.views > 0
      ? Number((((v.likes + v.comments) / v.views) * 100).toFixed(2))
      : 0,
    postedAt: v.postedAt,
    caption: v.caption,
    ageInDays: Math.floor(
      (Date.now() - new Date(v.postedAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  // Sort by engagement rate to find top performers
  const sorted = [...videoData].sort(
    (a, b) => b.engagementRate - a.engagementRate,
  );
  const avgEngagement =
    sorted.reduce((sum, v) => sum + v.engagementRate, 0) / sorted.length;
  const topPerformers = sorted.filter(
    (v) => v.engagementRate > avgEngagement * 2,
  );

  // Sort by date for recent videos
  const recent = [...videoData]
    .sort(
      (a, b) =>
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    )
    .slice(0, 10);

  // Basic posting frequency calculation
  const dates = videos
    .map((v) => new Date(v.postedAt).getTime())
    .sort((a, b) => b - a);
  let frequency: string = 'inconsistent';
  if (dates.length >= 2) {
    const avgDaysBetween =
      (dates[0] - dates[dates.length - 1]) /
      (1000 * 60 * 60 * 24) /
      (dates.length - 1);
    if (avgDaysBetween <= 1.5) frequency = 'daily';
    else if (avgDaysBetween <= 2.5) frequency = '3-4x/week';
    else if (avgDaysBetween <= 4) frequency = '2x/week';
    else if (avgDaysBetween <= 8) frequency = 'weekly';
    else if (avgDaysBetween <= 16) frequency = 'biweekly';
    else if (avgDaysBetween <= 35) frequency = 'monthly';
  }

  // Viral recency
  const newestTopPerformer = topPerformers[0];
  let viralRecency: 'recent' | 'stale' | 'none' = 'none';
  if (newestTopPerformer) {
    viralRecency = newestTopPerformer.ageInDays <= 30 ? 'recent' : 'stale';
  }

  return {
    platform,
    totalVideosAnalyzed: videos.length,
    topPerformers: topPerformers.slice(0, 5),
    recentVideos: recent,
    patterns: {
      postingFrequency: frequency,
      consistencyScore: calculateConsistencyScore(frequency),
      topTopics: [],
      doublingDownScore: 0,
      bestFormat: 'mixed',
      hookVariety: 50,
      viralRecency,
    },
  };
}

// ============================================================
// Helpers
// ============================================================

function clamp(value: number | undefined): number {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function calculateConsistencyScore(frequency: string): number {
  const scores: Record<string, number> = {
    daily: 95,
    '3-4x/week': 80,
    '2x/week': 60,
    weekly: 45,
    biweekly: 30,
    monthly: 15,
    inconsistent: 10,
  };
  return scores[frequency] ?? 10;
}
