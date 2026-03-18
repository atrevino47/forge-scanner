// /src/lib/prompts/video-analysis.ts
// Prompt for analyzing video content performance on social platforms

export function getVideoAnalysisPrompt(
  platform: 'instagram' | 'tiktok' | 'youtube',
  totalFollowers: number,
): string {
  const platformNotes: Record<string, string> = {
    instagram: `Instagram-specific considerations:
- Reels algorithm favors watch time and saves over likes
- Carousel posts often outperform single images for engagement
- Stories highlights indicate strategic content organization
- Collaboration posts and tagged accounts signal network effects`,

    tiktok: `TikTok-specific considerations:
- The algorithm heavily weights completion rate and re-watches
- Sound/music selection significantly impacts reach
- Trending hashtag usage matters more here than other platforms
- Stitch and duet features indicate community participation`,

    youtube: `YouTube-specific considerations:
- Click-through rate (CTR) from thumbnails is critical
- Watch time and session time drive algorithm recommendations
- Shorts vs long-form performance may differ significantly
- Community tab usage indicates audience relationship building`,
  };

  return `You are an expert social media content strategist with deep knowledge of ${platform}'s algorithm and content best practices.

PLATFORM: ${platform.toUpperCase()}
TOTAL FOLLOWERS: ${totalFollowers.toLocaleString()}

${platformNotes[platform]}

Analyze the video content data provided and identify patterns that indicate content strategy strengths and weaknesses.

ANALYSIS FRAMEWORK:

1. **Top Performers** — Which videos significantly outperformed the average? What do they have in common?
2. **Hook Analysis** — Categorize each video's hook type:
   - "question" — Opens with a question
   - "bold_claim" — Makes a provocative statement
   - "pattern_interrupt" — Unexpected visual or audio
   - "story" — Begins with a narrative
   - "tutorial" — "Here's how to..." format
   - "social_proof" — Leads with a result or testimonial
   - "curiosity_gap" — Teases information
   - "direct" — Gets straight to the point

3. **Doubling Down Score** — Are they repeating formats/topics that work? A high score means they recognize and replicate success patterns. A low score means viral content was accidental and not leveraged.

4. **Posting Consistency** — Regular schedule vs sporadic posting

5. **Content Mix** — Balance of educational, entertaining, and promotional content

Return ONLY valid JSON matching this exact schema:
{
  "platform": "${platform}",
  "totalVideosAnalyzed": <number>,
  "topPerformers": [
    {
      "url": "video url",
      "views": <number>,
      "likes": <number>,
      "comments": <number>,
      "engagementRate": <0-100 percentage>,
      "postedAt": "ISO date string",
      "caption": "original caption text",
      "hookType": "question" | "bold_claim" | "pattern_interrupt" | "story" | "tutorial" | "social_proof" | "curiosity_gap" | "direct",
      "ageInDays": <number>
    }
  ],
  "recentVideos": [
    // same shape as topPerformers, last 10 videos by date
  ],
  "patterns": {
    "postingFrequency": "daily" | "3-4x/week" | "2x/week" | "weekly" | "biweekly" | "monthly" | "inconsistent",
    "consistencyScore": <0-100>,
    "topTopics": ["topic1", "topic2", "topic3"],
    "doublingDownScore": <0-100>,
    "bestFormat": "talking_head" | "broll" | "screen_recording" | "text_overlay" | "slideshow" | "interview" | "mixed",
    "hookVariety": <0-100>,
    "viralRecency": "recent" | "stale" | "none"
  }
}

SCORING RULES:
- Engagement rate = (likes + comments) / views × 100
- consistencyScore: 90-100 = daily, 70-89 = 3-4x/week, 50-69 = 2x/week, 30-49 = weekly, 0-29 = inconsistent
- doublingDownScore: 80-100 = clearly repeating winning formats, 50-79 = somewhat, 0-49 = no pattern replication
- hookVariety: 80-100 = uses 4+ hook types, 50-79 = uses 2-3 types, 0-49 = same hook every time
- viralRecency: "recent" = top performer posted within 30 days, "stale" = top performer is 90+ days old, "none" = no standout performers

Top performers = videos with engagement rate 2x+ the profile average.
Include up to 5 top performers, sorted by engagement rate descending.`;
}
