# FORGE FUNNEL SCANNER — PROJECT INSTRUCTIONS

@agents/cody.md

## Read order

1. **This file** (`CLAUDE.md`) — project rules, architecture, current state
2. **Cody identity** (`../../build/orchestrator/CLAUDE.md`) — read on boot step 1
3. **Scanner spec** (`../../canon/forge-scanner-spec.md`) — source of truth for what we're building
4. **Latest audit** (`docs/audits/AUDIT-{NNN}.md`) — where we are right now
5. **Fix log** (`docs/fixes/FIX-LOG.md`) — what's been done and pending
6. **Active plans** (`docs/plans/PLAN-LOG.md`) — multi-session context

---

## What we're building

**forgewith.ai scanner** — a premium AI-powered funnel scanner that IS Forge's primary lead generation machine. A user enters a URL, the system captures real screenshots of their website/socials/GBP/ads, AI annotates them with specific issues, generates an optimized blueprint + mockup, and an AI Sales Agent (Hormozi-trained CLOSER) drives them to book a strategy call with Adrián.

**The one goal:** Convert free scan users into Forge strategy calls. Every feature serves this conversion.

**The $100K feel rule:** Every interaction must make the prospect think serious money was invested. The scan tool IS Forge's portfolio piece. If a component doesn't feel like it belongs in a $100K product, it's not done.

### The critical path — if any step breaks, the product doesn't work

```
1.  User loads / → dark navy, FORGE. logo, URL input, GSAP animations
2.  User enters URL (bare domain OK) → POST /api/scan/start → redirect to /scan/{scanId}
3.  /scan/{scanId} loads → SSE connects → ProgressIndicator streams status
4.  Pipeline: Playwright captures (Hetzner VPS Chrome) → Supabase Storage uploads → DB records
5.  ~15s in: CapturePrompt slides in (email + phone) → POST /api/scan/capture-info
6.  AI analysis: Sonnet annotates each screenshot → SSE pushes annotation_ready events
7.  Results render: ScreenshotCards + annotation dots (GSAP stagger) → click → popover
8.  All stages complete → FunnelHealthSummary + BlueprintCTA
9.  "Generate blueprint" → POST /api/blueprint/generate/{scanId} → funnel map + mockup
10. 30s no booking → ChatContainer slides in → AI Sales Agent references their data
11. Chat → streaming via SSE → data cards + Cal.com embed inline
12. Book → Cal.com modal overlay → pre-filled → confirmation animation → followups stop
13. Leave without booking → exit detection → follow-up sequence triggers
```

---

## Tech stack — exact versions matter

| Tech | Version | Notes |
|------|---------|-------|
| Next.js | **16.2.0** | App Router. Use `after()` for background work, NOT `waitUntil()` |
| React | **19** | Server Components default, `'use client'` for interactivity |
| TypeScript | **Strict** | `tsc --noEmit` = zero errors at all times |
| Tailwind CSS | **v4** | Tokens via `@theme inline` in `globals.css` — NOT `tailwind.config` |
| GSAP | Latest + `@gsap/react` | `useGSAP` hook, ScrollTrigger. NOT Framer Motion. NOT CSS transitions. |
| Supabase | JS SDK v2 | Auth + PostgreSQL + Storage (screenshots bucket) |
| Anthropic SDK | Latest | Sonnet 4 for analysis/chat, Haiku 3.5 for fast checks |
| Playwright | CDP via `playwright-core` | Self-hosted Chrome on Hetzner VPS (`BROWSER_WS_ENDPOINT`), Browserless.io fallback |
| Cal.com | `@calcom/embed-react` | Modal overlay — user NEVER navigates away from results |
| Stripe | `stripe` + `@stripe/stripe-js` | Team-initiated payments only, not self-serve |
| Resend | SDK | Transactional + AI-generated drip emails |
| PostHog | `posthog-js` + provider | Analytics, initialized in `layout.tsx` |
| Zod | Latest | ALL API input validation, no exceptions |

---

## Architecture

### Contracts

`/contracts/` has three files: `types.ts`, `events.ts`, `api.ts`. Shared types, SSE event shapes, request/response schemas. All code imports from contracts — never redefine types locally.

### Key architectural patterns

**Background pipeline (serverless-safe):**
```typescript
// In /api/scan/start/route.ts — use after(), NOT fire-and-forget
import { after } from 'next/server';
after(async () => {
  await runScreenshotPipeline(scanId, url);
  await runScanAnalysis(scanId, screenshots);
});
```

**DB ↔ contract type conversion:**
```typescript
// Always use shared mappers — never inline mapping in route handlers
import { dbScreenshotToData, buildScanResult } from '@/lib/db/mappers';
```

**Data fetching (Frontend):**
```typescript
// ✅ Correct — Frontend calls API routes
const res = await fetch(`/api/scan/results/${id}`);

// ❌ Wrong — Frontend never imports from /src/lib/db/
import { getScanResults } from '@/lib/db/queries';
```

---

## Design system

### Brand tokens (CSS variables in globals.css) — Brand v2 Light Mode
```css
--forge-base: #FAFAF7;         /* Page background (warm white) */
--forge-surface: #F5F4F0;      /* Cards, nav */
--forge-card: #ECEAE4;         /* Elevated cards */
--forge-accent: #E8530E;       /* Forge Orange — CTAs, hovers */
--forge-accent-bright: #FF6B2B;
--forge-text: #1A1917;         /* Primary text (near-black) */
--forge-text-secondary: #6B6860; /* Secondary text */
--forge-text-muted: #B8B5AD;   /* Muted text */
--forge-glass: rgba(250, 250, 247, 0.92);
--forge-glass-border: #ECEAE4;
--forge-critical: #D93636;     /* Red dots */
--forge-warning: #D4890A;      /* Amber dots */
--forge-opportunity: #2B7BD4;  /* Blue dots */
--forge-positive: #2D8C4E;     /* Green dots */
```

### Design system files
- `src/lib/design-tokens.ts` — Single source of truth for all visual values in JS
- `src/lib/gsap-presets.ts` — Animation preset factories (`fadeSlideUp`, `scaleIn`, `clipReveal`, `fadeSlideRight`, `scaleOut`, `popIn`)

### Typography — three specific fonts, already loaded
- **Display/Headlines:** Outfit (`font-display` class, `t.font.display` in JS), weight 800/700
  - `letter-spacing: -0.02em`, `line-height: 1.08`
  - Use `clamp()` for responsive sizing, NOT breakpoint stacking
- **Body:** Space Grotesk (`font-body` class, `t.font.body` in JS)
  - `line-height: 1.65`
- **Mono/Data:** JetBrains Mono (`font-mono` class, `t.font.mono` in JS)
- NEVER use system defaults for display text

### Color rules
- Gold accent (`--forge-accent`) in **MAX 5 places per viewport**
- NEVER use pure black or pure white
- Backgrounds follow 3-tier depth: base → surface → surfaceElevated
- Semantic colors (green/yellow/red) ONLY for data display, never decoration

### Animation rules
- ALL animations use GSAP presets from `gsap-presets.ts`. NOT Framer Motion. NOT CSS transitions (except hover states).
- `useGSAP` hook with scope refs. Plugins registered once in layout.
- Stagger delays: 100–200ms between sequential elements
- NEVER use opacity fade alone — always combine with translateY or scale
- Headlines: use `clipReveal` preset. Cards/panels: use `scaleIn` or `fadeSlideUp`.
- Document every animation sequence in a comment block:
```
/* ANIMATION SEQUENCE:
 * Beat 1 (0.00s): Badge — fadeSlideUp
 * Beat 2 (0.15s): Headline — clipReveal
 * Beat 3 (0.30s): Cards — scaleIn, 120ms stagger
 */
```

### Layout rules
- Text content max-width: 960px
- Card grids max-width: 1120px
- Section vertical padding: minimum 80px
- Sharp corners: 8–12px radius max. Thin borders. Generous whitespace.
- Grain overlay on body (`body::after`). Dot grid for depth.

### Mandatory workflow for visual work
1. Read design tokens FIRST: `src/lib/design-tokens.ts`
2. Read GSAP presets: `src/lib/gsap-presets.ts`
3. Build static layout first — no animations until layout approved
4. Add GSAP animations using presets, document timing in comments
5. Run quality checklist before presenting

### Banned patterns
- Particle effects or mesh gradient backgrounds
- Typewriter/typed effects on headlines
- Gradient circle avatars as social proof
- Rainbow gradients
- Tailwind `animate-bounce` or `animate-pulse` on visible elements
- Stock icon grids (circle + icon × 6 in identical cards)
- Parallax on text elements
- Same animation params on every element in a section

### Visual identity
- Light mode default (Brand v2). No toggle on public pages.
- Glassmorphism: `backdrop-filter: blur(16px)`, translucent cards, subtle glow borders.
- Gold accents on hover + CTAs only — not everywhere.
- Screenshots displayed large, as cards — not thumbnails. Each is a narrative beat.
- Chat feels like iMessage — NOT Intercom/Drift/Zendesk.
- Loading = skeleton screens with shimmer. NEVER spinners.

---

## Audit & fix system

Full audit/fix protocol in `../../build/orchestrator/procedures.md`.

- Audits: `docs/audits/AUDIT-{NNN}.md` — append-only
- Fix log: `docs/fixes/FIX-LOG.md` — append-only table
- Fix tickets: `docs/fixes/FIX-{NNNN}.md`
- Plans: `docs/plans/PLAN-LOG.md` — read active plans at session start

---

## Environment variables — current status

### Working
```
NEXT_PUBLIC_SUPABASE_URL         ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY    ✅
SUPABASE_SERVICE_ROLE_KEY        ✅
ANTHROPIC_API_KEY                ✅
BROWSER_WS_ENDPOINT              ✅ (wss://chrome.forgewith.ai — Hetzner VPS via Cloudflare Tunnel)
NEXT_PUBLIC_CALCOM_EMBED_URL     ✅
CALCOM_API_KEY                   ✅
RESEND_API_KEY                   ✅
GOOGLE_PAGESPEED_API_KEY         ✅ (integrated)
GOOGLE_PLACES_API_KEY            ✅ (used by GBP detection)
NEXT_PUBLIC_POSTHOG_KEY          ✅ (initialized)
STRIPE_SECRET_KEY                ✅ (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅
BROWSERLESS_API_KEY              ✅ (fallback — only used if BROWSER_WS_ENDPOINT not set)
```

### Needs attention
```
NEXT_PUBLIC_APP_URL              ⚠️  Set to localhost — change for production
STRIPE_WEBHOOK_SECRET            ⚠️  Commented out — webhooks won't verify
CALCOM_WEBHOOK_SECRET            ⚠️  Commented out — webhooks won't verify
CRON_SECRET                      ⚠️  Not configured — cron routes unprotected
```

### Not yet configured (blocks multi-channel follow-up)
```
TWILIO_ACCOUNT_SID               ❌ Empty (email follow-up works without this)
TWILIO_AUTH_TOKEN                 ❌ Empty
TWILIO_PHONE_NUMBER              ❌ Empty
WHATSAPP_API_TOKEN               ❌ Empty
WHATSAPP_PHONE_NUMBER_ID         ❌ Empty
FACEBOOK_APP_ACCESS_TOKEN        ❌ Empty (Meta Ad Library detection — graceful fallback)
APIFY_API_TOKEN                  ❌ Empty (social data enrichment — graceful fallback)
```

---

## Known decisions — don't "fix" these

These are intentional tradeoffs. Agents who don't read this list will waste time reversing them:

1. **English only** — i18n/next-intl removed. All content in clean American English.
2. **No self-serve payments** — Stripe is team-initiated during calls only. No checkout page.
3. **No auth gate on blueprint** — Email + phone from scan is enough. Google OAuth = optional save.
4. **Screenshots always complete** — Even if lead bounces, pipeline finishes. Results become outreach ammunition.
5. **UTMs on scans table, not leads** — Spec says leads, built as scans. One lead can have multiple scans — scans is better.
6. **Storage URLs, not paths** — DB stores full public Supabase URLs for screenshots, not just paths. Better for frontend.
7. **Carousel content is a known gap** — FIX-0012 simplified CSS injection. Some slider content won't capture perfectly. Parked.
8. **`page_discovered` events don't fire** — No DB mechanism for transient events. Progress shows screenshot captures and stage updates instead.
9. **Copy placeholders resolved** — All `[COPY: description]` instances in UI code have been replaced. The format still appears in AI prompt templates (`src/lib/prompts/mockup.ts`) where it's intentional — it instructs the AI to generate copy. Don't touch those.

---

## Rules — ALL agents follow these

### Code quality
- `tsc --noEmit` must pass with **zero errors** after every change
- `bun run build` must succeed
- No `any` types. No `@ts-ignore`. No `@ts-expect-error`.
- Zod validation on ALL API inputs
- Every async has try/catch. Every AI JSON parse wrapped in try/catch with fallback.
- Error responses: `{ error: { code: string, message: string, details?: unknown } }`

### Root cause fixes only
Every fix must address the underlying cause, not the symptom. No temporary workarounds. If the root cause is unclear, investigate deeper before writing code. A fix that silences an error without understanding why it happens is not a fix.

### Data flow
- Frontend **NEVER** imports from `/src/lib/db/` — always calls API routes
- Backend returns contract-shaped responses via mappers (`src/lib/db/mappers.ts`)
- SSE events match types in `contracts/events.ts`

### Performance
- `next/image` for all images
- Dynamic imports for heavy components (Cal.com, Stripe, chat)
- GSAP plugins registered once in layout, not per component
- Lighthouse 90+ target on landing page
- Respect `prefers-reduced-motion`

---

## Pages

```
/                   → Landing page (URL input hero, Aupale-style top banner)
/scan/[id]          → Results page (streaming → complete → blueprint + chat — all in one)
/offer              → Sales/pricing page (tiers, ROI visualization, FAQ)
/admin              → Admin dashboard (metric cards, recent scans)
/admin/leads        → Leads table (filterable, searchable, paginated)
/admin/scans        → Scans table (sortable, status badges)
/admin/payments     → Payments view
/admin/scan/[id]    → Team view of scan (for calls + Stripe payments)
/admin/setup        → Environment health checks (25 checks across 6 groups)
/admin/login        → Admin auth gate
```

Three public pages + seven admin pages. Cal.com is always a modal overlay, never its own page.

---

## Key commands

```bash
bun run dev            # Start dev server
bun run build          # Production build (must succeed)
bunx tsc --noEmit      # TypeScript check (must be zero errors)
bun run lint           # ESLint
bunx supabase start    # Local Supabase
bunx supabase db push  # Push migrations to remote
```

---

## Current project status

**Always check the latest `docs/audits/AUDIT-{NNN}.md` for the most current state.** Below is a high-level summary that gets updated periodically.

### What works end-to-end
- Clean TypeScript build, all API routes + 10 pages compile
- Landing page with full design system (Brand v2 light mode, glass, grain, 3 fonts, GSAP)
- URL input → scan pipeline → self-hosted Chrome (Hetzner VPS) → Supabase Storage → DB records
- Patient visitor screenshot capture (slow scroll + idle detection for lazy-loaded content)
- SSE streaming for real-time scan progress
- AI annotations via Claude Sonnet vision (5 stages, position-accurate dots)
- Progressive capture with GSAP blur/unblur email gate
- Social handle detection + disambiguation
- GEO + AEO AI Search Readiness modules (6 signals each, parallel analysis)
- Prescription offers system (12 rules, severity scoring, priority deduplication)
- Blueprint generation (funnel map + mockup with brand color extraction)
- Hormozi CLOSER framework + objection playbook in AI Sales Agent
- AI Sales Agent chat with streaming + data cards + inline Cal.com embed
- Cal.com modal overlay with pre-fill + booking source tracking
- Meta Ad Library detection (requires FACEBOOK_APP_ACCESS_TOKEN)
- Google Ads Transparency detection
- Apify social data enrichment (Instagram, TikTok, Facebook, Google Maps)
- Follow-up email system: branded HTML templates, 3-touch sequence, cron sender
- Stale scan cleanup cron with abandoned-scan follow-up trigger
- Stripe PaymentIntent creation + webhook handler + verify route
- Admin panel: dashboard, leads, scans, payments, scan detail, setup, login
- /offer sales page with tiers and ROI visualization
- Top banner CTA (Aupale-style)
- PostHog analytics, PageSpeed API, Google Places API
- `after()` for serverless pipeline survival
- Middleware for auth session refresh
- Shared DB mappers (no route-level duplication)
- Exit detection with sendBeacon follow-up trigger
- Google OAuth soft prompt ("Save your results")

### What's not built yet
- **Multi-channel follow-up beyond email** — Twilio SMS + WhatsApp (env vars not configured, code stubs exist)
- **Contact scraping for exit recovery** — when lead leaves without email
- **Carousel/lazy-loaded below-fold content** — known capture gap, parked
- **Frontend polish via Stitch redesign** — PLAN-0001, deferred
- **Video content performance analysis** — spec item, not started
- **Resend domain verification** — operational task, blocks email sending in production

### Active plan
See `docs/plans/PLAN-0003.md` — Scanner issues execution (Hetzner VPS + code polish). Phases 1+3 complete, Phase 2 (Adrián ops tasks) pending.

Check `../../shared/project-logs/forge-scanner.md` for latest status and `docs/fixes/FIX-LOG.md` for pending work.

---

*Build the scanner. Execute the outreach. Close founding clients. Deliver results. Build case studies. Raise prices. Move to Dubai.*
