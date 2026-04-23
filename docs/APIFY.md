# Apify Integration — Social Profile Enrichment

**Location:** `src/lib/scanner/apify-enrichment.ts`
**Wired from:** `src/lib/screenshots/pipeline.ts` (parallel with ad-detection + screenshot capture)
**Env var:** `APIFY_API_TOKEN` (required for live runs; scan continues gracefully without it)
**Cost envelope:** ~$0.05–0.12 per full-platform scan

## What it does

Given a set of detected social profiles from a prospect's website, enrich each one with quantitative metrics (followers, engagement, recent-post signals, reviews) via Apify actors. Metrics flow into the Traffic stage AI analysis so annotations can be specific — "Your 2,400 followers generate 0.5% engagement" instead of "your engagement looks low."

Runs all available scrapers in **parallel with `Promise.allSettled`** so one failing actor never blocks the rest.

## Actor registry

| Platform | Actor | Cost / 1k items | Typical cost / prospect | Notes |
|---|---|---|---|---|
| Instagram | `apify/instagram-profile-scraper` | $2.60 | ~$0.003 | 1 result per prospect; pulls bio + last 12 posts |
| TikTok | `clockworks/free-tiktok-scraper` | free tier, then $5.00 | ~$0.00–0.005 | profile-only mode (`shouldDownloadVideos: false`) |
| Facebook | `apify/facebook-pages-scraper` | $5.00 | ~$0.005 | page likes + followers + about |
| Google Maps | `compass/crawler-google-places` | $7.00 | ~$0.007 | review count + avg rating + photo count |
| YouTube | `streamers/youtube-scraper` | $5.00 | ~$0.05 | `maxResults: 10` videos + channel metadata |
| X / Twitter | `apidojo/tweet-scraper` (V2) | $0.40 | ~$0.004 | `maxItems: 10` latest tweets; profile lives on each tweet's `author` |

**Free tier:** Apify gives $5/mo credit — ~70 full-platform scans before any spend.

## Data model

All scrapers normalize into `SocialProfileMetrics` (`contracts/types.ts`):

```ts
{
  platform: 'instagram' | 'tiktok' | 'facebook' | 'google_maps' | 'youtube' | 'twitter';
  handle: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  engagementRate: number | null;   // 0-100 %
  avgLikes: number | null;
  avgComments: number | null;
  isVerified: boolean;
  bio: string | null;
  // Google Maps only
  reviewCount: number | null;
  averageRating: number | null;
  totalPhotos: number | null;
}
```

A scan can return 0..N profiles; the aggregate is `SocialEnrichmentResult { profiles, enrichedAt }`.

Persisted inside the scan's JSON result — **no dedicated table, no new migrations.**

## Flow

1. `pipeline.ts` captures screenshots → extracts HTML → `detectSocialLinks()` returns `DetectedSocials` with high/low confidence handles per platform.
2. In parallel with ad detection, `enrichSocialProfiles(detectedSocials, gbpPlaceId)` fires.
3. Per-platform scrapers launch concurrently; each has its own try/catch and 30s `waitSecs` cap.
4. `enrichmentToContext()` converts results to a prompt-friendly string for the Traffic stage AI annotations.
5. Full `SocialEnrichmentResult` surfaces in the final scan report via `ScanResult.socialEnrichment`.

## Setup

1. Sign up at https://console.apify.com (free $5/mo credit, no card required).
2. Go to **Settings → Integrations → API Token**. Copy the personal token.
3. Set in your deployment env (Vercel, Fly, wherever scanner runs):
   ```bash
   APIFY_API_TOKEN=apify_api_xxxxxxxxxx
   ```
4. Verify via `/admin/setup` — the dashboard shows a green check when the token is present.
5. Run a scan. Without a token: scan completes, `socialEnrichment: null`, warning logged. With a token: metrics appear in the Traffic stage AI annotations.

## Adding a new platform

1. **Type:** extend `SocialProfileMetrics.platform` union + `DetectedSocials` + `ProvidedSocials` in `contracts/types.ts`.
2. **Detector:** add a regex + `handleExtractor` entry to `SOCIAL_PATTERNS` in `src/lib/screenshots/social-detector.ts`.
3. **Actor:** add to `ACTORS` map in `apify-enrichment.ts`.
4. **Scraper:** write `scrapePlatform(client, handle)` that normalizes into `SocialProfileMetrics`. Always wrap in try/catch and return `null` on failure.
5. **Dispatch:** add conditional push into `scraperPromises` in `enrichSocialProfiles()`.
6. **Docs:** add row to the actor registry above with cost + notes.

~80 lines of additive code per platform. No schema changes, no config changes.

## Known quirks

- **Instagram** aggressively blocks scraping. Apify rotates residential proxies, but runs can occasionally return empty. `Promise.allSettled` keeps the scan alive.
- **TikTok** actor counts videos toward result totals; the profile-only config keeps per-scan cost near zero.
- **YouTube** `streamers/youtube-scraper` doesn't have a true "channel-only" mode; we cap `maxResults: 10` to get channel + 10 videos for ~$0.05.
- **X/Twitter** frequently rotates auth. `apidojo/tweet-scraper` ships fixes faster than alternatives.
- **Serverless timeouts:** each actor call is sync-blocking. Instagram/TikTok runs can exceed Vercel's 60s function cap. Scanner runs in a long-running Node server context (Hetzner VM per `docs/HETZNER-SETUP.md`), so this is not currently a constraint. If you ever deploy to Vercel Pro, wrap in webhook-based async runs.
- **LinkedIn:** intentionally not implemented. LinkedIn ToS bans scraping; even public-profile scraping carries CFAA risk. Leave unbuilt until there's a commercial reason.

## Reliability

- `Promise.allSettled` → one failing actor never blocks the others.
- Per-call `waitSecs: 30` timeout.
- Per-call try/catch + `console.error` log + `null` return.
- No-token path: early return with warning, `socialEnrichment: null`, scan proceeds.

## Cost monitoring

Apify console → **Usage → Per actor**. Set billing alert at $10/mo until volume is known. All six actors combined at 500 scans/month ≈ $30-35.
