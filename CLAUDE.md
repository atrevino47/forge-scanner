# FORGE FUNNEL SCANNER — MASTER INSTRUCTIONS

> **Every Claude Code agent reads this file FIRST, then their specific agent file, then the latest audit.**

## Read order — non-negotiable

1. **This file** (`CLAUDE.md`) — shared rules, architecture, current state
2. **Your agent file** (`docs/AGENT-BACKEND.md`, `docs/AGENT-FRONTEND.md`, `docs/AGENT-AI-ENGINE.md`, or `docs/AGENT-ORCHESTRATOR.md`)
3. **Active plans** (`docs/plans/PLAN-LOG.md`) — find active plans, read their files for multi-session context
4. **The spec** (`docs/FORGE-FUNNEL-SCANNER-SPEC.md`) — source of truth for what we're building
5. **The business plan** (`docs/FORGE-BUSINESS-PLAN.md`) — why we're building it
6. **Latest audit** (`docs/audits/AUDIT-{NNN}.md`) — where we are right now
7. **Fix log** (`docs/fixes/FIX-LOG.md`) — what's been done and what's pending

Skipping any of these causes decisions that conflict with the spec, the architecture, or work already completed.

---

## What we're building

`audit.forgedigital.com` — a premium AI-powered funnel scanner that IS Forge Digital's primary lead generation machine. A user enters a URL, the system captures real screenshots of their website/socials/GBP/ads, AI annotates them with specific issues, generates an optimized blueprint + mockup, and an AI Sales Agent (Hormozi-trained CLOSER) drives them to book a strategy call with Adrián.

**The one goal:** Convert free scan users into Forge strategy calls. Every feature serves this conversion.

**The $100K feel rule:** Every interaction must make the prospect think serious money was invested. The scan tool IS Forge's portfolio piece. If a component doesn't feel like it belongs in a $100K product, it's not done.

### The critical path — if any step breaks, the product doesn't work

```
1.  User loads / → dark navy, FORGE. logo, URL input, GSAP animations
2.  User enters URL (bare domain OK) → POST /api/scan/start → redirect to /scan/{scanId}
3.  /scan/{scanId} loads → SSE connects → ProgressIndicator streams status
4.  Pipeline: Browserless captures → Supabase Storage uploads → DB records
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
| Browserless.io | CDP via `playwright-core` | Headless screenshot capture over WebSocket |
| Cal.com | `@calcom/embed-react` | Modal overlay — user NEVER navigates away from results |
| Stripe | `stripe` + `@stripe/stripe-js` | Team-initiated payments only, not self-serve |
| Resend | SDK | Transactional + AI-generated drip emails |
| PostHog | `posthog-js` + provider | Analytics, initialized in `layout.tsx` |
| Zod | Latest | ALL API input validation, no exceptions |

---

## Architecture — 4 agents, strict ownership

### Agent boundaries are walls, not suggestions

| Agent | Instruction File | Owns |
|-------|-----------------|------|
| **Orchestrator** | `docs/AGENT-ORCHESTRATOR.md` | `/contracts/`, `/docs/` |
| **Backend** | `docs/AGENT-BACKEND.md` | `/src/app/api/`, `/src/lib/db/`, `/src/lib/auth/`, `/src/lib/screenshots/`, `/src/lib/followup/`, `/src/lib/stripe/`, `/src/lib/rate-limit/`, `/src/middleware.ts`, `/supabase/`, `/next.config.ts` |
| **Frontend** | `docs/AGENT-FRONTEND.md` | `/src/app/layout.tsx`, `/src/app/page.tsx`, `/src/app/scan/`, `/src/app/admin/`, `/src/components/`, `/src/styles/`, `/public/` |
| **AI Engine** | `docs/AGENT-AI-ENGINE.md` | `/src/lib/ai/`, `/src/lib/prompts/`, `/src/lib/scanner/`, `/src/lib/blueprint/` |

**Why strict ownership matters:** Agents can work in parallel without merge conflicts. The Orchestrator audits impartially because it never writes the code it judges. Cross-agent bugs get fix sub-tickets. This separation is what keeps concurrent sessions from destroying each other's work.

### Contracts — the API between agents

`/contracts/` has three files: `types.ts`, `events.ts`, `api.ts`. These define every shared type, SSE event shape, and request/response schema.

- **Only the Orchestrator modifies contracts**
- All agents import from contracts — never redefine types locally
- If you need a new type, tell Adrián → Orchestrator adds it

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

### Brand tokens (CSS variables in globals.css)
```css
--forge-base: #0B1120;         /* Page background */
--forge-surface: #0F172A;      /* Cards, nav */
--forge-card: #1E293B;         /* Elevated cards */
--forge-accent: #D4A537;       /* Gold — CTAs, hovers */
--forge-accent-hover: #E5B84A;
--forge-text: #F8FAFC;         /* Primary text */
--forge-text-muted: #94A3B8;   /* Secondary text */
--forge-glass: rgba(30, 41, 59, 0.5);
--forge-glass-border: rgba(212, 165, 55, 0.12);
--forge-critical: #EF4444;     /* Red dots */
--forge-warning: #F59E0B;      /* Amber dots */
--forge-opportunity: #3B82F6;  /* Blue dots */
--forge-positive: #22C55E;     /* Green dots */
```

### Design system files
- `src/lib/design-tokens.ts` — Single source of truth for all visual values in JS
- `src/lib/gsap-presets.ts` — Animation preset factories (`fadeSlideUp`, `scaleIn`, `clipReveal`, `fadeSlideRight`, `scaleOut`, `popIn`)

### Typography — three specific fonts, already loaded
- **Display/Headlines:** Instrument Serif (`font-display` class, `t.font.display` in JS)
  - `letter-spacing: -0.02em`, `line-height: 1.08`
  - Use `clamp()` for responsive sizing, NOT breakpoint stacking
- **Body:** Plus Jakarta Sans (`font-body` class, `t.font.body` in JS)
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
- Dark mode default. No toggle on public pages.
- Glassmorphism: `backdrop-filter: blur(16px)`, translucent cards, subtle glow borders.
- Gold accents on hover + CTAs only — not everywhere.
- Screenshots displayed large, as cards — not thumbnails. Each is a narrative beat.
- Chat feels like iMessage — NOT Intercom/Drift/Zendesk.
- Loading = skeleton screens with shimmer. NEVER spinners.

---

## Audit & fix system

The Orchestrator manages quality through a formal audit/fix cycle. Every agent must understand this system.

### Audit files
- Location: `docs/audits/AUDIT-{NNN}.md` — append-only, never modify previous audits

### Fix log
- Location: `docs/fixes/FIX-LOG.md` — single append-only table tracking every fix

### Fix tickets
- Location: `docs/fixes/FIX-{NNNN}.md` — created by Orchestrator, executed by owning agent
- Cross-agent fixes: sub-tickets `FIX-{NNNN}a.md`, `FIX-{NNNN}b.md`

### Plan registry
- Location: `docs/plans/PLAN-LOG.md` — index of multi-session initiatives
- Each plan: `docs/plans/PLAN-{NNNN}.md` — full context for cross-session continuity
- Read active plans at session start. Update "Current State" at session end.

### When you receive a fix ticket
1. Read the ticket file completely
2. Read the file(s) listed in "File(s) to modify"
3. Apply **ONLY** the change described — no refactoring, no "while I'm here" improvements
4. Do NOT modify files outside your owned directories
5. Do NOT modify the fix ticket or FIX-LOG.md (Orchestrator-owned)
6. After applying the fix, confirm to Adrián what you changed

### Branch discipline
- All agent work on `claude/<description>` branches (e.g., `claude/phase-d-polish`)
- Before first commit: if on `main` or `dev`, create a `claude/*` branch first
- **Agents NEVER merge into `main` or `dev`** — Adrián handles all merges
- **Agents NEVER push to remote** — Adrián handles all pushes

---

## Environment variables — current status

### Working
```
NEXT_PUBLIC_SUPABASE_URL         ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY    ✅
SUPABASE_SERVICE_ROLE_KEY        ✅
ANTHROPIC_API_KEY                ✅
BROWSERLESS_API_KEY              ✅
NEXT_PUBLIC_CALCOM_EMBED_URL     ✅
CALCOM_API_KEY                   ✅
RESEND_API_KEY                   ✅
GOOGLE_PAGESPEED_API_KEY         ✅ (integrated)
GOOGLE_PLACES_API_KEY            ✅ (used by GBP detection)
NEXT_PUBLIC_POSTHOG_KEY          ✅ (initialized)
STRIPE_SECRET_KEY                ✅ (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅
```

### Needs attention
```
NEXT_PUBLIC_APP_URL              ⚠️  Set to localhost — change for production
STRIPE_WEBHOOK_SECRET            ⚠️  Commented out — webhooks won't verify
CALCOM_WEBHOOK_SECRET            ⚠️  Commented out — webhooks won't verify
```

### Not yet configured (blocks follow-up system)
```
TWILIO_ACCOUNT_SID               ❌ Empty
TWILIO_AUTH_TOKEN                 ❌ Empty
TWILIO_PHONE_NUMBER              ❌ Empty
WHATSAPP_API_TOKEN               ❌ Empty
WHATSAPP_PHONE_NUMBER_ID         ❌ Empty
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
9. **Copy placeholders** — All user-facing text uses `[COPY: description]` until the dedicated copy phase. Exception: loading messages can be real ("Capturing your homepage...").

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
/admin              → Admin dashboard (leads, payments, scans)
/admin/scan/[id]    → Team view of scan (for calls + Stripe payments)
```

Three public pages. Two admin pages. Cal.com is always a modal overlay, never its own page.

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
- Clean TypeScript build, all 26 API routes + 4 pages compile
- Landing page with full design system (dark mode, glass, grain, 3 fonts, GSAP)
- URL input → scan pipeline → Browserless captures → Supabase Storage → DB records
- SSE streaming for real-time scan progress
- AI annotations via Claude Sonnet vision (5 stages, position-accurate dots)
- Progressive capture with GSAP blur/unblur email gate
- Social handle detection + disambiguation
- Blueprint generation (funnel map + mockup with brand color extraction)
- AI Sales Agent chat with streaming + data cards + inline Cal.com embed
- Cal.com modal overlay with pre-fill + booking source tracking
- Top banner CTA (Aupale-style)
- PostHog analytics, PageSpeed API, Google Places API
- `after()` for serverless pipeline survival
- Middleware for auth session refresh
- Shared DB mappers (no route-level duplication)
- Exit detection with sendBeacon follow-up trigger
- Google OAuth soft prompt ("Save your results")

### What's not built yet
- **Multi-channel follow-up system** — the revenue engine (email/SMS/WhatsApp drip after exit)
- **Stripe payments + admin panel** — team-initiated during strategy calls
- **Hormozi Sales Agent training** — system prompt framework built, transcripts not yet processed
- **Ad detection** — Meta Ad Library + Google Ads Transparency checks
- **Frontend polish** — pending Phase D redesign via Stitch (`docs/stitch-w-google/`)

### Active plan
See `docs/plans/PLAN-0001.md` — Frontend redesign using Stitch by Google, Phase D implementation.

Check `docs/fixes/FIX-LOG.md` for the complete list of pending work.

---

*Build the scanner. Execute the outreach. Close founding clients. Deliver results. Build case studies. Raise prices. Move to Dubai.*
