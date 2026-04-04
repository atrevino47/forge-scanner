# FULL CODEBASE INVESTIGATION — 2026-04-04

**Investigator:** Cody (Coding Orchestrator)
**Date:** 2026-04-04
**Branch:** vps-tryout
**Scope:** Every file in `src/`, `contracts/`, `supabase/`, and all config files
**Files read:** 110+ source files, 3 contract files, 3 migrations, 7 config files, 2 known-issue documents
**Mode:** Read-only — zero code changes

---

## Table of Contents

1. [CRITICAL Findings](#1-critical-findings)
2. [HIGH Findings](#2-high-findings)
3. [MEDIUM Findings](#3-medium-findings)
4. [LOW Findings](#4-low-findings)
5. [IDEA — Beyond Spec](#5-idea--beyond-spec)
6. [Spec Compliance Matrix](#6-spec-compliance-matrix)
7. [Contract Compliance](#7-contract-compliance)
8. [Known Issues Cross-Reference](#8-known-issues-cross-reference)
9. [Dependency Audit](#9-dependency-audit)
10. [File-by-File Summary](#10-file-by-file-summary)
11. [COPY QUALITY — Brand Voice & Offer Alignment](#11-copy-quality--brand-voice--offer-alignment-audit)

---

## 1. CRITICAL Findings

### CRIT-01: `users` table does not exist in any migration

**Files:** `src/app/api/auth/link-scan/route.ts:49-56`, `supabase/migrations/*.sql`
**Impact:** The Google OAuth "Save your results" flow will crash with a Supabase error.

`link-scan/route.ts` calls `db.from('users').upsert(...)` at line 49 and `db.from('users').update(...)` at line 82, but no `users` table exists in any of the 3 migration files. The initial migration creates 11 tables (leads, scans, funnel_stages, screenshots, blueprints, conversations, messages, followups, bookings, payments, rate_limits) — but not `users`.

**Root cause:** The table was likely assumed to come from Supabase Auth's built-in `auth.users`, but the code treats it as a separate public-schema table with custom columns (`lead_id`, `role`, `avatar_url`).

**Fix:** Create a migration adding a `public.users` table with columns: `id uuid primary key references auth.users(id)`, `email text`, `full_name text`, `avatar_url text`, `lead_id uuid references leads(id)`, `role text default 'user'`, `created_at timestamptz`.

---

### CRIT-02: CSRF protection is defined but never used

**Files:** `src/lib/api-utils.ts:94-130` (definition), every API route (missing call)
**Impact:** All state-mutating POST endpoints are vulnerable to cross-site request forgery.

The `verifyCsrf()` function exists in `api-utils.ts` and is well-implemented (checks Origin + Referer headers against `NEXT_PUBLIC_APP_URL`). However, **zero API route handlers call it**. The scan/start, capture-info, chat/message, chat/start, followup/trigger, blueprint/generate, payments/create-intent, and all admin POST routes are all unprotected.

**Note:** SameSite=Lax cookies provide baseline protection, but CSRF verification is defense-in-depth that was clearly intended (someone wrote the function).

**Fix:** Add `verifyCsrf(request)` calls to all state-mutating routes, especially `scan/start`, `capture-info`, `chat/message`, and `followup/trigger`.

---

### CRIT-03: Follow-up trigger route has no authentication

**Files:** `src/app/api/followup/trigger/route.ts` (entire file)
**Impact:** Anyone can trigger follow-up email sequences to any lead by guessing scan/lead UUIDs.

The `/api/followup/trigger` route accepts `{scanId, leadId, reason}` with Zod validation — but has **no auth check, no rate limiting, and no CSRF protection**. An attacker who obtains a scanId (which is in the URL of the results page) could trigger unwanted email sequences.

Similarly, `/api/followup/scrape-contact/route.ts` has no auth — anyone can trigger AI-powered contact scraping for any scan.

**Fix:** Add at minimum a CSRF check and/or require that the request comes from the app (e.g., a signed token or session validation).

---

### CRIT-04: Rate limiter has a TOCTOU race condition

**Files:** `src/lib/rate-limit/index.ts:36-116`
**Impact:** Under concurrent requests, the read-then-update pattern allows bursts past the limit.

The rate limiter does:
1. `SELECT` the current count (line 36-42)
2. Check if `newCount > limit` (line 55)
3. `UPDATE` the count (line 62-65)

Between steps 1 and 3, another request can read the same count and both pass the check. With high concurrency (e.g., a bot hammering `/api/scan/start`), this allows bypass.

**Fix:** Use a single atomic SQL upsert with `count + 1` or a Supabase RPC function that does the check-and-increment in one transaction. Example: `INSERT ... ON CONFLICT DO UPDATE SET count = rate_limits.count + 1 RETURNING count`.

---

### CRIT-05: Payments routes lack admin authentication

**Files:** `src/app/api/payments/create-intent/route.ts:21` (TODO comment), `src/app/api/payments/verify/route.ts:21` (TODO comment)
**Impact:** Anyone can create Stripe PaymentIntents and verify payments — these are supposed to be admin-only.

Both routes have `// TODO: Wire admin auth once ADMIN_EMAILS is configured` comments but no actual auth check. The `create-intent` route creates real Stripe PaymentIntents and stores payment records. In production, an attacker could create arbitrary payment intents.

**Fix:** Add `const authError = await requireAdminSession(request); if (authError) return authError;` — the pattern is already used in all other admin routes.

---

### CRIT-06: Stripe webhook processes events without signature verification in production

**Files:** `src/app/api/payments/webhook/route.ts:21-28`
**Impact:** Fake Stripe webhook events can be sent to update payment statuses.

Lines 21-28 show: if `STRIPE_WEBHOOK_SECRET` is not set, the route falls back to `JSON.parse(rawBody)` — accepting any POST body as a legitimate Stripe event. The `STRIPE_WEBHOOK_SECRET` is documented as "commented out" in the env vars section. This means production currently accepts unauthenticated webhook POSTs.

**Fix:** Fail hard if `STRIPE_WEBHOOK_SECRET` is missing in production (return 503), and configure the secret in Vercel.

---

### CRIT-07: Chat `classifyAndUpdate` uses fire-and-forget without `after()`

**Files:** `src/app/api/chat/message/route.ts:172-175`
**Impact:** On Vercel, the classification and DB update may be killed when the response is sent.

Line 174: `void classifyAndUpdate();` — this fires the objection classification asynchronously but without Next.js `after()`. On Vercel's serverless runtime, the function shuts down after the response is sent. The classification result (which updates the conversation's objection tracking) may never be written.

Contrast with `scan/start/route.ts:158` which correctly uses `after()` for the pipeline.

**Fix:** Wrap in `after(classifyAndUpdate())` — the import already exists in the scan/start route.

---

## 2. HIGH Findings

### HIGH-01: Cron routes check CRON_SECRET but it's not configured

**Files:** `src/app/api/cron/followup-sender/route.ts:40-45`, `stale-scans/route.ts:29-33`, `nurture-sender/route.ts:18-25`
**Impact:** Follow-up emails and stale scan cleanup cannot run.

All three cron routes require `Bearer ${process.env.CRON_SECRET}` in the Authorization header. CRON_SECRET is documented as "not configured" in CLAUDE.md. Vercel Cron sends requests without auth headers by default — you need to configure `CRON_SECRET` in Vercel and add it to cron request headers.

Additionally, `vercel.json` only defines 2 cron jobs (`followup-sender` at `* * * * *` and `stale-scans` at `*/15 * * * *`). The `nurture-sender` route exists but is **not registered in vercel.json** — it will never be called.

---

### HIGH-02: `nurture-sender` is a complete stub

**Files:** `src/app/api/cron/nurture-sender/route.ts:28-36` (5 TODO comments)
**Impact:** Post-initial-sequence lead nurturing does not work.

The route has the auth check and response types, but the body is 5 TODO comments and returns `{sent: 0, skipped: 0}` always. No nurture logic exists.

---

### HIGH-03: SMS and WhatsApp webhook routes are stubs

**Files:** `src/app/api/followup/webhook/sms/route.ts` (3 TODOs), `whatsapp/route.ts` (3 TODOs)
**Impact:** Inbound SMS/WhatsApp messages are acknowledged but never processed.

Both routes read the raw body, do nothing with it, and return `{received: true}`. No Twilio signature verification, no message parsing, no routing to the AI Sales Agent.

---

### HIGH-04: Team management API uses mock data

**Files:** `src/app/api/admin/team/route.ts:57-85` (MOCK_MEMBERS), lines 94, 138, 189, 235 (TODO comments)
**Impact:** Team member management in the admin panel is non-functional.

GET returns hardcoded mock data. POST, PUT, DELETE validate inputs but don't touch the database. All operations use in-memory `MOCK_MEMBERS` array.

---

### HIGH-05: Admin login rate limiter shares key with scan API

**Files:** `src/app/api/admin/auth/login/route.ts:20`
**Impact:** Login attempts and scan start share the `ip_api` type with different limits, potentially interfering.

Login uses `checkRateLimit(clientIp, 'ip_api', 10, 15 * 60 * 1000)` — same `ip_api` type as scan/start's burst guard at line 89 which uses `checkRateLimit(clientIp, 'ip_api', 5, 60000)`. Since rate limits are stored as `(key, type)` unique pairs, these two limits are actually **the same counter**. A user who attempts 5 scans won't be able to log in to admin.

**Fix:** Use a distinct type like `'ip_admin_login'` for admin login. This requires adding it to the `rate_limit_type` enum in the DB.

---

### HIGH-06: Playbook loader reads from filesystem — fails on Vercel

**Files:** `src/lib/ai/playbook-loader.ts:17-28`
**Impact:** The Hormozi objection playbook and core principles are never loaded in production.

`loadPlaybookSection()` uses `readFile()` from `fs/promises` to read markdown files from a path specified by `SALES_KNOWLEDGE_PATH`. This env var is not documented in the env vars section, and even if set, Vercel's read-only filesystem won't have these files (they're vault files, not deployed code).

The system prompt builder has fallback text (the hardcoded CLOSER framework in `sales-agent-system.ts:87-113`), so the agent still works — but without the specialized playbook content.

**Fix:** Either: (a) embed the playbook content as string constants in the codebase, or (b) store them in Supabase Storage and fetch at runtime with caching.

---

### HIGH-07: `admin/scans` query filters by `status = 'complete'` but enum value is `'completed'`

**Files:** `src/lib/db/admin-queries.ts:343`
**Impact:** The stages completed count is always 0 for every scan in the admin panel.

Line 343: `.eq('status', 'complete')` — but the PostgreSQL enum and contract type use `'completed'` (with the 'd'). This query silently returns no rows.

**Fix:** Change `'complete'` to `'completed'`.

---

### HIGH-08: Auth callback has an open redirect vulnerability

**Files:** `src/app/api/auth/callback/route.ts:16-17`
**Impact:** The `next` query parameter is used in a redirect without validation.

Line 16: `const next = searchParams.get('next') ?? '/';` then line 17: `const redirectTo = new URL(next, origin)`. If `next` is an absolute URL like `https://evil.com`, `new URL('https://evil.com', origin)` returns `https://evil.com` — bypassing the origin. An attacker can craft an OAuth callback URL that redirects the user to a phishing page after successful authentication.

**Fix:** Validate that `next` is a relative path (starts with `/` and doesn't start with `//`).

---

### HIGH-09: SSE status endpoint creates excessive DB connections

**Files:** `src/app/api/scan/status/[id]/route.ts:82`
**Impact:** Each SSE connection creates a new Supabase client inside the stream, and polls every 1.5s with 3 queries per poll.

Line 82: `const db = createServiceClient();` is called once inside the stream's `start()`. Then every 1.5s it makes 3 queries (scan, screenshots, funnel_stages). For N concurrent viewers, that's N × 3 × 40 queries/minute. The Supabase client is at least reused within a single connection, but there's no connection pooling or query batching.

---

### HIGH-10: `scan/results` endpoint has no rate limiting or caching

**Files:** `src/app/api/scan/results/[id]/route.ts`
**Impact:** The results endpoint can be hammered to increase DB load. Results are static after completion but re-queried every time.

The endpoint makes 4 parallel DB queries on every request. For a completed scan, these results never change. No cache headers are set, and no CDN caching is configured.

**Fix:** Add `Cache-Control: public, max-age=300` for completed scans, or use Next.js `revalidate`.

---

## 3. MEDIUM Findings

### MED-01: Health endpoint does no actual health checks

**Files:** `src/app/api/health/route.ts:16-23` (3 TODO comments)
**Impact:** Monitoring tools get false positives — the endpoint always returns `{status: 'ok'}` even if Supabase is down.

---

### MED-02: `capture_prompt` event fires on pure time (15s), not scan progress

**Files:** `src/app/api/scan/status/[id]/route.ts:154-157`
**Impact:** The email capture prompt may appear before any screenshots are ready, or long after the scan is mostly done.

The `CAPTURE_PROMPT_DELAY_MS = 15_000` fires the prompt exactly 15 seconds after the SSE stream opens, regardless of how many screenshots have been captured or what stage the scan is at.

**Fix:** Tie the prompt to a progress threshold (e.g., after 2+ screenshots are captured).

---

### MED-03: `generateInitialMessage` is synchronous but used as if it might be async

**Files:** `src/lib/ai/sales-agent.ts:46-61`, `src/app/api/chat/start/[scanId]/route.ts:173`
**Impact:** No current bug, but the function generates a static opener without AI — the initial message is template-based, not AI-generated.

The spec describes the initial message as contextual and AI-generated. The current implementation uses `generateOpener()` which builds a template string from scan data — no AI call. This means the first message is always the same pattern, just with different data.

---

### MED-04: CSP allows `'unsafe-eval'` in script-src

**Files:** `src/middleware.ts:25`
**Impact:** Weakens XSS protection. `unsafe-eval` allows `eval()`, `Function()`, and `setTimeout(string)`.

This is likely needed for GSAP or one of the other libraries, but it's a significant security relaxation. Ideally, identify which library needs it and use a nonce-based approach instead.

---

### MED-05: Video analysis pipeline is fully implemented but never wired in

**Files:** `src/lib/ai/video-analysis.ts` (295 lines), `src/lib/prompts/video-analysis.ts`, `contracts/types.ts:294-323`, `contracts/events.ts:68-74`
**Impact:** The spec describes video content performance analysis. The code exists. But `videoData` is never populated in the pipeline.

`src/lib/screenshots/pipeline.ts` passes `videoData: undefined` to the scan analysis input (it's not in the params). The scanner orchestrator accepts `videoData` and passes it to `analyzeTrafficStage`, but it's always empty. No code fetches video data from Apify or any other source.

---

### MED-06: Admin queries fetch all records for enrichment sub-queries

**Files:** `src/lib/db/admin-queries.ts:34` (payments sum), `134` (scans enrichment), `234-239` (revenue summary)
**Impact:** As the database grows, these queries will become increasingly slow.

`getAdminDashboardMetrics()` at line 34 fetches ALL `payments.amount_cents` where `status = 'succeeded'` to sum them in JavaScript. With thousands of payments, this transfers unnecessary data. Same pattern for `getAdminPayments()` lines 234-239 which runs 3 separate full-table queries for revenue summary.

**Fix:** Use `SUM()` aggregation in SQL: `.select('amount_cents.sum()').eq('status', 'succeeded')`.

---

### MED-07: Screenshot capture mobile mode uses wrong fullPage logic

**Files:** `src/lib/screenshots/client.ts:607`
**Impact:** Mobile screenshots in fast mode may not capture the full page.

Line 607: `const useFullPage = mode !== 'full' && viewport === 'desktop';` — this means in fast mode + mobile, `useFullPage` is `false`, so mobile screenshots are viewport-only. But mobile pages are typically much taller than the viewport. Desktop fast mode also gets `fullPage: true` while mobile does not.

---

### MED-08: GBP detection put under 'followup' stage instead of 'traffic'

**Files:** `src/lib/screenshots/pipeline.ts:320`
**Impact:** GBP screenshots are categorized as 'followup' stage instead of 'traffic' which is the more logical location.

Line 320: `await updateStageStatusIfPending(supabase, scanId, 'followup', 'capturing');` — GBP is a traffic source / local presence indicator. Having it under 'followup' means the traffic stage may have no screenshots while followup has the GBP one.

---

### MED-09: Duplicate `normalizeUrl` logic

**Files:** `src/app/api/scan/start/route.ts:16-26` (Zod transform), `route.ts:47-58` (normalizeUrl function)
**Impact:** URL normalization happens twice — once in Zod validation and again in the `normalizeUrl` function. They do slightly different things (Zod adds protocol, normalizeUrl also strips trailing slash).

---

### MED-10: No test files exist in the entire project

**Files:** None
**Impact:** Zero automated test coverage. No unit tests, no integration tests, no E2E tests.

The spec and Cody's identity document emphasize test-first development, but no test files exist anywhere in the project. The `package.json` has no test script defined beyond the default `bun run test`.

---

## 4. LOW Findings

### LOW-01: `components.json` exists but shadcn/ui is not used

**Files:** `components.json` (root)
**Impact:** Dead config file. `class-variance-authority`, `clsx`, and `tailwind-merge` are in deps (shadcn primitives) but no actual shadcn components are imported.

---

### LOW-02: `@vercel/analytics` imported but may not be initialized

**Files:** `package.json` (dependency), `src/app/layout.tsx` (import)
**Impact:** Minor — analytics is imported in layout but initialization depends on the component being rendered. PostHog is the primary analytics tool.

---

### LOW-03: Queue writer creates files inside project repo

**Files:** `src/lib/vault/queue-writer.ts:22`
**Impact:** `QUEUE_DIR = resolve(process.cwd(), 'sales/queues/pending')` — creates markdown files inside the project directory. These show up in git status as untracked files (there's currently one: `sales/queues/pending/e4768699-...-pos1.md`).

**Fix:** Either add `sales/` to `.gitignore` or adjust the path to write to the vault (`../../sales/queues/pending`).

---

### LOW-04: `capture-info/route.ts` has inline `LeadRow` type and `toContractLead` mapper

**Files:** `src/app/api/scan/capture-info/route.ts:48-77`
**Impact:** Duplicates `DbLead` from `db/types.ts` and `dbLeadToLead` from `db/mappers.ts`. The inline versions are identical.

---

### LOW-05: The `scan/status` SSE endpoint doesn't send `event:` field

**Files:** `src/app/api/scan/status/[id]/route.ts:91-97`
**Impact:** Standard SSE format includes `event: eventType\ndata: ...\n\n`. The implementation only sends `data:` lines. The frontend may still work since it parses the JSON `type` field, but it doesn't follow the SSE spec for named events.

---

### LOW-06: `capture_prompt` fires even for already-completed scans

**Files:** `src/app/api/scan/status/[id]/route.ts:154-157`
**Impact:** If a user opens the SSE stream for an already-completed scan, the capture prompt fires after 15 seconds even though the scan is done.

---

### LOW-07: `console.log` used for logging scan info with lead email

**Files:** `src/app/api/scan/capture-info/route.ts:231`
**Impact:** Lead email addresses appear in plain text in server logs: `[scan/capture-info] Captured info for scanId=..., lead=..., email=user@example.com`. On Vercel, these logs are visible to all team members.

---

### LOW-08: Missing `ADMIN_EMAILS` env var documentation

**Files:** CLAUDE.md env var section
**Impact:** `ADMIN_EMAILS` is used by middleware and all admin routes but isn't listed in the env vars section of CLAUDE.md. It's only mentioned in the setup page checks.

---

### LOW-09: `@react-email/components` is unused

**Files:** `package.json` (line 14)
**Impact:** The dependency is installed but the email template at `src/lib/followup/email-template.ts` uses raw HTML string templating, not React Email components.

---

### LOW-10: `eslint.config.mjs` uses `eslint/config` import

**Files:** `eslint.config.mjs:1`
**Impact:** The import `from "eslint/config"` with `defineConfig` and `globalIgnores` suggests ESLint flat config. This works but `defineConfig` is from ESLint 9.x — verify compatibility with the installed version.

---

## 5. IDEA — Beyond Spec

### IDEA-01: Add request ID to all API responses
Attach a `X-Request-Id` header to every response for debugging. Log it alongside errors.

### IDEA-02: Scan results expiry
Scans currently live forever. Consider auto-deleting screenshots from Supabase Storage after 30 days to control storage costs, while keeping the scan metadata.

### IDEA-03: Webhook event deduplication
Cal.com and Stripe can send duplicate webhooks. Add an `idempotency_key` column to bookings/payments to prevent duplicate processing.

### IDEA-04: Admin scan detail page — show conversation history
The admin scan detail page (`/admin/scan/[id]`) returns scan data but doesn't include the conversation. During strategy calls, seeing the chat history with the AI sales agent would be valuable.

### IDEA-05: Batch screenshot upload
The pipeline uploads screenshots one at a time in a loop (pipeline.ts:350-382). Batching these would reduce upload latency.

### IDEA-06: Progressive scan results (streaming initial screenshots)
Currently the frontend waits for all screenshots to capture before analysis begins. Consider starting AI analysis on the homepage screenshot immediately while inner pages are still capturing.

### IDEA-07: Comparative benchmark learning across scans

**Origin:** Adrián, during fix execution review (2026-04-04).

Every scan currently runs in isolation — the AI analyzes each business with zero knowledge of how other businesses score. If we accumulated anonymized benchmark data across all completed scans, the AI could make comparative statements:

> "Your landing page scored 38/100. The average across 847 service businesses we've scanned is 52. Your lead capture is in the bottom 15%."

This transforms the scanner from "here's what we found" to "here's how you compare to your industry" — a fundamentally stronger value prop and a moat that grows with every scan.

**Implementation (two pieces):**

1. **Benchmark aggregation table** — after each scan completes, write anonymized data to a `benchmarks` table: stage scores, industry vertical (auto-detected or user-provided), business size indicator, annotation type counts. Aggregate with percentile distributions by vertical.

2. **Comparative context injection** — when annotating a new scan, inject benchmark data into the AI system prompt: "Average landing score for service businesses: 52/100. This business scored 38." The AI naturally produces comparative insights. Same injection for the sales agent prompt — "Your client is in the bottom 15% for lead capture" is more persuasive than a raw score.

**Data requirements:** ~50+ scans per vertical before percentiles are statistically meaningful. Until then, use cross-vertical averages as a baseline.

**Why this matters for Forge:** Every scan makes the product smarter. Competitors who launch a similar tool later start with zero benchmark data. This is a compounding moat.

**Scope:** Product feature, not a quick fix. Needs schema design, aggregation logic, prompt injection, and a frontend display component. Worth a PLAN doc.

### IDEA-08: Post-agent-session copy revisit
After the Offer Architect, Leads Agent, and Money Model Agent complete their next session, revisit all scanner copy (landing page, results page, sales agent prompts, follow-up emails). These agents may refine the offer positioning, value props, or pricing language in ways that should flow downstream into the scanner's customer-facing copy. The copy rewrite in Session 2 is a first pass aligned with current locked decisions — treat it as a living document that gets a second pass once the business agents produce updated outputs.

### IDEA-09: Custom Cal.com booking page HTML
The Cal.com embed currently uses the default Cal.com booking UI. Build a custom-styled booking page that matches the Forge brand (Outfit font, warm white background, Forge Orange accents, glassmorphism). The current embed works but visually breaks the $100K feel — it looks like a third-party widget dropped into a premium product. Custom HTML for the booking flow would maintain brand continuity from scan results → chat → booking.

### IDEA-10: Conversational onboarding flow (Unrot-style)

**Origin:** Adrián, during Session 2 review (2026-04-04). Reference: Unrot app onboarding screenshots in `~/Downloads/example flow/`.

**Priority: HIGH — this is a product-level redesign, not a copy tweak.**

The current landing page is a static hero section with a form. Unrot (a screen time app) proves that the onboarding experience IS the product experience. Their flow:

1. **Animated mascot splash** with stats badge (4.8 rating, 300K users) — credibility in 2 seconds
2. **Personalization first** — "What's your name?" → uses it everywhere after
3. **Conversational progression** — chat bubbles with typing indicators, not a wall of text. The app talks TO you.
4. **Pattern interrupt** — calls out the user's pain directly ("The one you kept ignoring at 2am")
5. **Social proof mid-flow** — "290,000 people share the same story" — embedded in conversation, not a stat card
6. **Choice-based engagement** — user picks from response options, feels in control, every path converges

**What this means for the Forge scanner:**

Replace the static hero → form → results flow with a guided conversational entry:

- **Splash:** Animated FORGE wordmark entrance → stats bar (live scan count + "Free forever") with GSAP
- **Conversational input:** "What's your website?" → user types → "Got it. Want us to check your socials too?" → optional fields → "Starting your scan..."
- **Personalization:** If they provide a name during capture-info, the entire results page uses it. The AI Sales Agent already does this — extend it to the scan experience.
- **Social proof in flow:** Not a stat section — weave proof into the conversation: "We've scanned X funnels. Yours is about to be next."
- **The results page already has the chat** — but the entry should feel like a conversation too, not a traditional SaaS landing page.

**Scope:** This is a PLAN-level initiative — either a new PLAN or folded into PLAN-0001 (Stitch redesign). Requires: new component architecture, GSAP sequenced animations, state machine for the conversational flow, mobile-first design. Estimated: Frontend Agent, multi-session.

**Key constraint:** Must still work as a shareable URL for outreach. Someone clicking a link from an email should land on a page that works — not require a 10-step onboarding. The conversational flow should be the delightful path, with a fast-track "just paste your URL" escape hatch visible.

### IDEA-11: Live scan counter replacing fake stat
Replace the hardcoded "500+ Scans Completed" trust stat on the landing page with a live count from the `scans` table (`status = 'completed'`). Honest number that grows with outreach. Even "12" is more credible than a fabricated "500+". Aligns with brand direction's "anti-hype honesty" principle. Slated for Session 2 (copy rewrite).

---

## 6. Spec Compliance Matrix

Cross-referencing the spec (FORGE-FUNNEL-SCANNER-SPEC.md) against actual code:

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | User loads / → landing page | **BUILT** | Full design system, GSAP, dark→light Brand v2 |
| 2 | URL input → POST /api/scan/start | **BUILT** | Zod validation, rate limiting, after() pipeline |
| 3 | Redirect to /scan/{id} → SSE | **BUILT** | SSE polling at 1.5s intervals |
| 4 | Playwright captures on VPS | **BUILT** | Self-hosted Chrome via CDP, Browserless fallback |
| 5 | Supabase Storage uploads | **BUILT** | Public bucket, full URLs stored |
| 6 | CapturePrompt (email gate) | **BUILT** | Time-based (15s), blur/unblur not verified |
| 7 | AI annotations (5 stages) | **BUILT** | Sonnet vision, position-accurate dots |
| 8 | Results render with annotations | **BUILT** | ScreenshotCard + AnnotationMarker + Popover |
| 9 | FunnelHealthSummary + BlueprintCTA | **BUILT** | Components exist |
| 10 | Blueprint generation | **BUILT** | Funnel map + mockup HTML |
| 11 | AI Sales Agent chat | **BUILT** | Streaming SSE, Hormozi CLOSER framework |
| 12 | Data cards in chat | **BUILT** | [DATA_CARD:id] marker parsing |
| 13 | Cal.com embed in chat | **BUILT** | [CALCOM_EMBED] marker, modal overlay |
| 14 | Exit detection + follow-up | **BUILT** | sendBeacon trigger, 3-touch sequence |
| 15 | Follow-up email system | **BUILT** | Resend + AI-generated content + branded templates |
| 16 | Social detection + disambiguation | **BUILT** | HTML regex, nav-area confidence |
| 17 | GEO analysis | **BUILT** | 6 signals, HTML-based |
| 18 | AEO analysis | **BUILT** | 6 signals, HTML-based |
| 19 | Prescriptions system | **BUILT** | 12+ rules, severity scoring, dedup |
| 20 | Meta Ad Library detection | **BUILT** | Requires FACEBOOK_APP_ACCESS_TOKEN |
| 21 | Google Ads Transparency | **BUILT** | Domain lookup |
| 22 | Apify social enrichment | **BUILT** | IG, TikTok, FB, Google Maps |
| 23 | Stripe payments | **BUILT** | PaymentIntent + webhook (auth missing) |
| 24 | Admin dashboard | **BUILT** | Metrics, recent scans |
| 25 | Admin leads/scans/payments | **BUILT** | Paginated, filterable |
| 26 | Admin scan detail | **BUILT** | Full scan view for calls |
| 27 | Admin setup (env checks) | **BUILT** | 25 checks across all services |
| 28 | Google OAuth ("Save results") | **BUILT** | But `users` table missing → crashes |
| 29 | PostHog analytics | **BUILT** | Provider + layout integration |
| 30 | /offer sales page | **BUILT** | Tiers + ROI visualization |
| 31 | Video content analysis | **PARTIAL** | Code exists but not wired into pipeline |
| 32 | Multi-channel follow-up (SMS) | **STUB** | Webhook route exists, no implementation |
| 33 | Multi-channel follow-up (WhatsApp) | **STUB** | Webhook route exists, no implementation |
| 34 | Nurture sequence (post-initial) | **STUB** | Route exists, all TODOs |
| 35 | Team management | **STUB** | Mock data only |
| 36 | Contact scraping for exit recovery | **BUILT** | AI-powered, HTML + GBP |
| 37 | Carousel content capture | **MISSING** | Known gap, parked |
| 38 | Resend domain verification | **MISSING** | Operational — blocks email delivery |
| 39 | Frontend Stitch redesign | **DEFERRED** | PLAN-0001 |

---

## 7. Contract Compliance

### Types in `contracts/types.ts` that are USED correctly:
- `FunnelStage`, `ScanStatus`, `StageStatus`, `AnnotationType` — used everywhere
- `ScanResult`, `ScreenshotData`, `FunnelStageResult` — used in mappers + routes
- `Lead`, `Booking`, `Conversation`, `ChatMessage` — used in routes
- `BlueprintData`, `FunnelMapData` — used in blueprint route + sales agent
- `DetectedSocials`, `ProvidedSocials` — used in pipeline + capture-info
- `AdDetectionResult`, `SocialEnrichmentResult`, `GoogleAdsDetectionResult` — used in pipeline
- `Annotation`, `StageSummary`, `StageFinding` — used in AI pipeline

### Types that exist but are DEAD or UNUSED:
- `VideoAnalysis`, `VideoData`, `VideoPattern` — types exist, `video-analysis.ts` implementation exists, but never called from the pipeline. The `video_analysis` SSE event type exists in `contracts/events.ts:68-74` but is never emitted.

### Type mismatches found:
- `DbScan.detected_socials` is typed as `Record<string, unknown>` in `db/types.ts:52` but cast to `DetectedSocials` in mappers. The `_ambiguous` key stored in DB doesn't exist in the `DetectedSocials` contract type — it's an undocumented extension.
- `DbScan.social_enrichment` and `DbScan.ad_detection` are `Record<string, unknown> | null` but cast to specific contract types via `as unknown as`. Type safety is lost.

### API contract compliance:
All API routes return shapes matching `contracts/api.ts` types. Error responses consistently use the `ApiError` shape. The `CaptureInfoRequest.socialConfirmation` field is properly optional as defined in the contract.

### Events contract compliance:
SSE events in `scan/status/[id]/route.ts` emit all documented event types from `contracts/events.ts`. The `page_discovered` event is documented in contracts but never emitted (known decision #8 in CLAUDE.md).

---

## 8. Known Issues Cross-Reference

### From `2026-04-02-scanner-issues-full-list.md`:

| # | Issue | Verified? | Status |
|---|-------|-----------|--------|
| 1 | Git push needed | N/A | Operational |
| 2 | Social profile capture | ✅ Fixed | Two-tier capture implemented |
| 3 | Blank homepage screenshots | ✅ Fixed | Tall viewport approach implemented (commit ecbc22d) |
| 4 | SSE reconnect loop | ✅ Fixed | |
| 5 | CRON_SECRET not configured | ⚠️ Still pending | Code checks it, env var missing |
| 6 | Resend domain not verified | ⚠️ Still pending | Operational task |
| 7 | Pricing not finalized | N/A | Business decision |
| 8 | Hetzner VPS | ✅ Done | WSS via Cloudflare Tunnel |
| 9 | FACEBOOK_APP_ACCESS_TOKEN | ⚠️ Still missing | |
| 10 | APIFY_API_TOKEN | ⚠️ Unclear | Memory says empty |
| 11 | Carousel content | Known gap | Parked |
| 12 | Twilio/WhatsApp | Stubs exist | No implementation |
| 13 | Google Ads check | ✅ Built | `detect-google-ads.ts` exists |
| 14 | Stripe webhook secret | ⚠️ Still missing | CRIT-06 above |
| 15 | Cal.com webhook secret | ⚠️ Still missing | Route checks but env missing |
| 16 | Copy placeholders | ✅ Resolved | Per CLAUDE.md decision #9 |
| 17 | Frontend polish | Deferred | PLAN-0001 |

### From `2026-04-04-scanner-bugs-research.md`:

| Bug | Verified? | Status |
|-----|-----------|--------|
| Blank screenshots (tile eviction) | ✅ Root cause confirmed | Tall viewport fix applied in latest commit (ecbc22d). The research also recommends ScreenshotOne as alternative. |
| Apify data not showing | ✅ Confirmed | 3 layers: env var empty, migration not applied to prod, no dedicated UI component |
| Playwright version mismatch | ✅ Confirmed | `package.json` has `1.58.2`, Docker likely still on older version |

### Issues the known docs MISSED:

1. **CRIT-01:** `users` table missing from migrations (Google OAuth flow crashes)
2. **CRIT-02:** CSRF protection defined but never called
3. **CRIT-03:** Follow-up trigger has no auth
4. **CRIT-05:** Payment routes have no admin auth
5. **HIGH-05:** Rate limiter type collision between login and scan
6. **HIGH-06:** Playbook loader uses filesystem (fails on Vercel)
7. **HIGH-07:** `'complete'` vs `'completed'` typo in admin queries
8. **HIGH-08:** Open redirect in auth callback

---

## 9. Dependency Audit

### `package.json` review:

| Dependency | Version | Status | Notes |
|------------|---------|--------|-------|
| next | 16.2.0 | ✅ Current | Matches CLAUDE.md |
| react | 19.2.4 | ✅ Current | React 19 as specified |
| @anthropic-ai/sdk | ^0.80.0 | ✅ | Latest SDK |
| playwright-core | ^1.58.2 | ⚠️ | Version mismatch with Docker image |
| @calcom/embed-react | ^1.5.3 | ✅ | |
| gsap | ^3.14.2 | ✅ | |
| @react-email/components | ^1.0.10 | ⚠️ Unused | Not imported anywhere |
| @vercel/analytics | ^2.0.1 | ✅ Used | Imported in layout.tsx |
| class-variance-authority | ^0.7.1 | ⚠️ | shadcn dep, minimal usage |
| clsx | ^2.1.1 | ✅ | Used in components |
| tailwind-merge | ^3.5.0 | ✅ | Used via cn() utility |
| components.json | — | ⚠️ | shadcn config file, no shadcn components used |
| zod | ^4.3.6 | ✅ | Zod 4 — latest |
| posthog-js | ^1.362.0 | ✅ | |

### Missing dependencies:
None found — all imports resolve to installed packages.

### Security:
No known CVEs in the current dependency versions at time of investigation.

---

## 10. File-by-File Summary

### Config Files

| File | Status | Key Finding |
|------|--------|-------------|
| `next.config.ts` | ✅ Clean | Proper Supabase image hostname extraction |
| `tsconfig.json` | ✅ Clean | Strict mode, proper path alias |
| `vercel.json` | ⚠️ | Only 2 crons, `nurture-sender` missing. `followup-sender` runs every minute — might be expensive |
| `eslint.config.mjs` | ✅ Clean | Flat config, proper ignores |
| `postcss.config.mjs` | ✅ Clean | Standard Tailwind v4 setup |
| `package.json` | ⚠️ | `@react-email/components` unused, no test script |

### API Routes (30 routes)

| Route | Auth | Zod | Error Handling | Findings |
|-------|------|-----|----------------|----------|
| `scan/start` | Rate limit | ✅ | ✅ | Clean. Uses after() correctly |
| `scan/capture-info` | None | ✅ | ✅ | Inline mapper duplicates shared code |
| `scan/results/[id]` | None | Partial | ✅ | No caching for completed scans |
| `scan/status/[id]` | None | Partial | ✅ | DB polling, no SSE event names |
| `blueprint/generate/[scanId]` | Email required | ✅ | ✅ | Good idempotency (returns existing) |
| `chat/message` | None | ✅ | ✅ | classify fire-and-forget (CRIT-07) |
| `chat/start/[scanId]` | None | ✅ | ✅ | Good idempotency (returns existing conv) |
| `chat/stream/[convId]` | None | ✅ | ✅ | Well-implemented marker parser |
| `cron/followup-sender` | CRON_SECRET | ✅ | ✅ | Solid implementation |
| `cron/nurture-sender` | CRON_SECRET | N/A | ✅ | **Complete stub** |
| `cron/stale-scans` | CRON_SECRET | N/A | ✅ | Clean cleanup + follow-up trigger |
| `followup/trigger` | **None** | ✅ | ✅ | **No auth — CRIT-03** |
| `followup/scrape-contact` | **None** | ✅ | ✅ | No auth |
| `followup/webhook/calcom` | CALCOM_SECRET | ✅ | ✅ | Well-structured handler |
| `followup/webhook/sms` | None | N/A | ✅ | **Complete stub** |
| `followup/webhook/whatsapp` | None | N/A | ✅ | **Complete stub** |
| `health` | None | N/A | ✅ | **Stub — always returns ok** |
| `payments/create-intent` | **None (TODO)** | ✅ | ✅ | **No admin auth — CRIT-05** |
| `payments/verify` | **None (TODO)** | ✅ | ✅ | **No admin auth** |
| `payments/webhook` | Stripe sig (optional) | N/A | ✅ | **Falls back to raw parse — CRIT-06** |
| `admin/auth/login` | Rate limit | ✅ | ✅ | Rate limit type collision (HIGH-05) |
| `admin/dashboard` | ✅ Admin | N/A | ✅ | Clean |
| `admin/leads` | ✅ Admin | ✅ | ✅ | Clean |
| `admin/scans` | ✅ Admin | ✅ | ✅ | 'complete' typo (HIGH-07) |
| `admin/payments` | ✅ Admin | ✅ | ✅ | Full-table sum queries (MED-06) |
| `admin/scan/[id]` | ✅ Admin | Partial | ✅ | Clean |
| `admin/setup` | ✅ Admin | N/A | ✅ | Comprehensive env checks |
| `admin/team` | ✅ Admin | ✅ | ✅ | **All mock data** |
| `auth/callback` | OAuth | N/A | ✅ | **Open redirect (HIGH-08)** |
| `auth/link-scan` | Session | ✅ | ✅ | **`users` table missing (CRIT-01)** |

### Lib Files

| File | LOC | Status | Key Finding |
|------|-----|--------|-------------|
| `ai/client.ts` | 137 | ✅ | Clean. Good extractJSON fallback chain |
| `ai/annotate.ts` | 250 | ✅ | Good validation + fallback annotations |
| `ai/sales-agent.ts` | 299 | ✅ | Comprehensive fallback builders |
| `ai/objection-classifier.ts` | 53 | ✅ | Clean. Good confidence threshold (0.6) |
| `ai/playbook-loader.ts` | 64 | ⚠️ | Filesystem read fails on Vercel (HIGH-06) |
| `ai/contact-scraper.ts` | 258 | ✅ | Good validation + merge logic |
| `ai/video-analysis.ts` | 295 | ⚠️ | Built but never wired (MED-05) |
| `db/client.ts` | 66 | ✅ | Clean. Proper SSR + service clients |
| `db/types.ts` | 224 | ✅ | Complete. Matches all migrations |
| `db/mappers.ts` | 106 | ✅ | Clean. Stage ordering correct |
| `db/admin-queries.ts` | 380 | ⚠️ | 'complete' typo, full-table sums |
| `screenshots/client.ts` | 669 | ✅ | Tall viewport implemented. Comprehensive lazy-load handling |
| `screenshots/pipeline.ts` | 760 | ✅ | Well-structured 14-step pipeline |
| `screenshots/social-detector.ts` | 504 | ✅ | Good nav-area heuristic |
| `scanner/orchestrator.ts` | 329 | ✅ | Clean parallel stage execution |
| `prescriptions.ts` | 427 | ✅ | Comprehensive rule engine |
| `rate-limit/index.ts` | 117 | ⚠️ | TOCTOU race condition (CRIT-04) |
| `auth/admin.ts` | 37 | ✅ | Clean wrapper |
| `auth/config.ts` | 94 | ✅ | Proper admin email verification |
| `api-utils.ts` | 151 | ⚠️ | CSRF function unused (CRIT-02) |
| `stripe/client.ts` | 20 | ✅ | Clean singleton |
| `vault/event-writer.ts` | 61 | ✅ | Proper Vercel guard, fire-and-forget |
| `vault/queue-writer.ts` | 61 | ⚠️ | Writes into project repo (LOW-03) |
| `followup/email-template.ts` | — | ✅ | Branded HTML template |
| `design-tokens.ts` | — | ✅ | Single source of truth |
| `gsap-presets.ts` | — | ✅ | Proper preset factories |
| `utils.ts` | — | ✅ | cn() utility |

### Database Schema

| Table | Indexes | RLS | Notes |
|-------|---------|-----|-------|
| leads | 4 | ✅ | updated_at trigger |
| scans | 4 | ✅ | Anon read policy = `using (true)` — all scans publicly readable |
| funnel_stages | 2 | ✅ | Unique (scan_id, stage) constraint |
| screenshots | 2 | ✅ | Public read |
| blueprints | 1 | ✅ | Unique (scan_id) |
| conversations | 3 | ✅ | updated_at trigger, engagement tracking |
| messages | 2 | ✅ | |
| followups | 4 | ✅ Service only | Partial index on pending+scheduled |
| bookings | 3 | ✅ | |
| payments | 3 | ✅ Service only | |
| rate_limits | 2 | ✅ Service only | Unique (key, type) |
| **users** | — | — | **TABLE MISSING** |

### Middleware

The middleware (`src/middleware.ts`) is well-implemented:
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, XSS-Protection, Permissions-Policy, CSP)
- ✅ Admin route protection with email verification
- ✅ Supabase session refresh
- ⚠️ CSP includes `'unsafe-eval'` (MED-04)
- ✅ Proper matcher excluding static files

---

## Summary

### By severity count:

| Severity | Count |
|----------|-------|
| CRITICAL | 7 |
| HIGH | 10 |
| MEDIUM | 10 |
| LOW | 10 |
| IDEA | 6 |

### Top 5 fixes needed before production:

1. **CRIT-01:** Create `users` table migration (blocks Google OAuth)
2. **CRIT-05 + CRIT-06:** Add admin auth to payment routes + require Stripe webhook secret
3. **CRIT-02 + CRIT-03:** Wire CSRF protection + add auth to followup trigger
4. **CRIT-04:** Make rate limiter atomic (prevents abuse)
5. **HIGH-07:** Fix `'complete'` → `'completed'` typo (admin panel data broken)

### What's actually solid:

- **The core scan pipeline** (pipeline.ts → orchestrator.ts → stage analyzers) is well-architected with proper error isolation, parallel execution, and graceful degradation.
- **The AI integration** (client.ts, annotate.ts, sales-agent.ts) has consistent patterns: try/catch, extractJSON fallbacks, validation, and Sonnet/Haiku routing.
- **The contract system** (contracts/*.ts, db/types.ts, db/mappers.ts) provides clean separation between DB shapes and API shapes.
- **The sales agent system prompt** is remarkably thorough — the Hormozi CLOSER framework, objection handling, channel rules, data card protocols, and prescription integration are all production-quality.
- **The follow-up system** (trigger → scheduler → cron sender → branded emails) is a complete end-to-end pipeline that just needs the CRON_SECRET configured.
- **Security posture** is above average for a pre-launch product — CSP headers, admin email verification, Supabase RLS, rate limiting (with caveats), and bot detection.

---

---

## 11. COPY QUALITY — Brand Voice & Offer Alignment Audit

**Reference documents:**
- `shared/decisions/2026-03-31-brand-direction.md` — LOCKED brand direction
- `shared/outputs/offer-architect-2026-04-02-tier-details.md` — 3-tier offer structure

### Brand Direction Summary (for context)

| Element | Locked Decision |
|---------|----------------|
| Target market | US service businesses, $500K–$5M revenue |
| One Outcome | "Client owns their AI-powered sales infrastructure. It keeps working without Forge." |
| Contrarian take | "AI isn't magic. It's infrastructure. And infrastructure takes engineering, not prompts." |
| Brand energy | Anti-hype honesty, generosity without scarcity, confidence without desperation |
| Voice | Direct, honest, deliberate. "Structured thinking out loud." |
| Banned patterns | "Get X results in Y minutes", urgency tricks, "growth hacking", "leverage AI", "10x", "in today's digital landscape", corporate buzzwords |
| Logo | **FORGE** (dark) + **WITH.AI** (orange) |
| Attraction offer | Forge Scanner (free). "Gift the diagnosis, sell the surgery." |

---

### Landing Page (`/`) — Component-by-Component Audit

#### TopBanner.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Left CTA | "Book a Free Strategy Call" | **GOOD.** Direct, no hype, clear action. |
| Logo | "FORGE" | **MISALIGNED.** Brand direction (Section 4) specifies the wordmark as **FORGE** + **WITH.AI** (dark + orange). The banner only shows "FORGE" — missing the "WITH.AI" orange portion. Same issue in FooterSection.tsx. |
| Right hamburger | Decorative (no menu) | **NEUTRAL.** Non-functional hamburger is a UX concern — user expects a menu. |

#### HeroSection.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Badge | "AI-Powered Funnel Audit" | **WEAK.** Generic SaaS badge. Doesn't use the brand's contrarian positioning. Compare to the offer page badge "AI-Powered Sales Infrastructure" which uses the exact brand language. |
| Headline | "Find what's broken in your funnel — in 60 seconds" | **VIOLATES BRAND DIRECTION.** The brand explicitly bans time-promise patterns: *"Never say 'Get X results in Y minutes.' Say: State the real timeline honestly."* This headline is exactly the banned pattern — a speed promise. The brand voice should be confident without resorting to urgency tricks. |
| Subheadline | "Enter your URL. We capture real screenshots, AI annotates every issue, and generate an optimized blueprint — free." | **MEDIUM.** Technically accurate but feature-focused. The brand direction says sell the vacation, not the plane flight. This sells the plane flight (screenshots, annotations, blueprint) instead of the outcome (discovering what's costing you customers). |
| CTA button | "Scan My Funnel" | **GOOD.** Action-oriented, clear, no hype. |
| Trust line 1 | "Free, no card required" | **GOOD.** Clear, honest. |
| Trust line 2 | "Results in 60 seconds" | **VIOLATES BRAND.** Same time-promise pattern as the headline. |
| Trust line 3 | "AI-powered analysis" | **WEAK.** Generic. Every SaaS tool claims this in 2026. |

**Suggested headline rewrite** (aligned with brand voice):
> "Your funnel is leaking revenue. Let's find where."

Or using the contrarian take:
> "AI isn't magic. It's infrastructure. See what yours is missing."

#### HowItWorksSection.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Section label | "How It Works" | **NEUTRAL.** Standard, fine. |
| Step 1 title | "Enter Your URL" | **GOOD.** Clear. |
| Step 1 body | "Paste your website URL. Our AI starts scanning your entire digital presence immediately." | **OK.** "Immediately" is a mild urgency word but not a time promise. |
| Step 2 title | "AI Analyzes Everything" | **OK.** Slightly vague — "everything" is a bold claim. |
| Step 2 body | "We capture real screenshots of your site, socials, ads, and GBP. AI annotates every issue with specific callouts." | **GOOD.** Specific, honest, grounded in what actually happens. |
| Step 3 title | "Get Your Blueprint" | **GOOD.** |
| Step 3 body | "See your optimized funnel map and a professional mockup of your weakest piece. Then book a free strategy call." | **GOOD.** Clean funnel flow — diagnosis → action. Mentions the strategy call naturally. |

#### TrustSection.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Headline | "Built for businesses that want to grow" | **GENERIC.** Every SaaS tool says this. The brand direction identifies the target as "US service businesses, $500K–$5M revenue." This headline should speak to THAT audience. Not everyone. |
| Stat: "500+" | "Scans Completed" | **QUESTIONABLE.** This is a pre-launch product. If the number is real, keep it. If fabricated, it violates the brand's "anti-hype honesty" principle. Fake social proof is exactly the kind of thing the brand says to avoid. |
| Stat: "< 60s" | "Average Scan Time" | **VIOLATES BRAND.** Third instance of the time-promise pattern on the same page. |
| Stat: "5" | "Funnel Stages Analyzed" | **OK.** Factual. |
| Stat: "Free" | "Always" | **GOOD.** Clear, honest positioning. |

**Suggested headline rewrite:**
> "Designed for service businesses doing $500K–$5M"

Or:
> "The infrastructure audit your agency never gave you"

#### FAQSection.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Headline | "Common Questions" | **NEUTRAL.** Functional. |
| Q1: "Is it really free?" | Answer mentions "We make money when you hire Forge to fix what we find." | **EXCELLENT.** Transparent, honest, aligns with "gift the diagnosis, sell the surgery." This IS the brand voice. |
| Q2: "What exactly do you scan?" | Accurate, specific answer. | **GOOD.** |
| Q3: "How does the AI analysis work?" | Mentions "Claude (Anthropic's AI)" by name. | **GOOD.** Technical specificity builds trust. Aligns with "earned confidence." |
| Q4: "Do I need to create an account?" | Clear, honest. | **GOOD.** |
| Q5: "What happens after the scan?" | Mentions AI Sales Agent and strategy call. | **GOOD.** Natural funnel progression. |
| Q6: "How long does the scan take?" | "Most scans complete in under 60 seconds." | **BORDERLINE.** It's answering a direct question honestly, which is fine. But the page has already made the "60 seconds" promise THREE other times, making this the fourth repetition. |

#### FooterSection.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| CTA headline | "Your funnel has blind spots. Let us find every one." | **STRONG.** Direct, confident, problem-aware. This is closer to the brand voice than the hero headline. |
| CTA subtext | "Free scan. Free strategy call. No obligation. Just answers." | **EXCELLENT.** Anti-hype, generous, no scarcity. Perfect brand alignment. |
| CTA button | "Book a Free Strategy Call" | **GOOD.** Consistent with top banner. |
| Logo | "FORGE" | **MISALIGNED.** Missing "WITH.AI" per brand direction. |
| Footer links | Privacy, Terms | **NOTE:** These are dead links (no /privacy or /terms pages exist in the app). |

---

### Offer Page (`/offer`) — OfferPage.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Badge | "AI-Powered Sales Infrastructure" | **EXCELLENT.** Uses the exact brand positioning. |
| Headline | "Your sales infrastructure is broken. We build one that works." | **EXCELLENT.** Direct, confident, no hype. This IS the brand voice at its best. Compare to the landing page's "Find what's broken in your funnel — in 60 seconds" — the offer page headline is categorically better. |
| Subheadline | "For service businesses doing $500K–$5M. We build your AI-powered sales machine in 90 days. You own everything. Month 4, you pay for optimization — not dependency." | **PERFECT.** Hits every locked brand position: target market, timeline, ownership, and the "infrastructure not dependency" framing. |
| Problems section | Specific stats + direct copy (e.g., "A lead fills out your form. Nobody responds for 4 hours.") | **STRONG.** Pain-aware, data-driven, no corporate buzzwords. Exactly the "hard truth + genuine care" contrast the brand aims for. |
| FAQ answers | Uses the exact tier positioning from the offer architecture. Mentions $12,500/mo Core, $2,500/mo Minimum. | **ALIGNED.** Tier descriptions match the locked offer document. "You own everything we built" and "head chef who keeps the kitchen at its ceiling" are the locked metaphors. |
| "What if it doesn't work?" | Mentions Day 21 fast-win target and 90-day performance guarantee. | **ALIGNED.** Matches offer-architect deliverable schedule. |

**Assessment:** The offer page copy is significantly stronger and more brand-aligned than the landing page. It reads like it was written by someone who read the brand direction. The landing page reads like it was written before the brand workshop.

---

### Results Page Components (Scan Results)

#### BlueprintCTA.tsx

| Element | Copy | Verdict |
|---------|------|---------|
| Headline | "Generate Your Optimized Blueprint" | **OK.** Generic but functional. |
| Body | "See what your funnel should look like — with your brand colors and a rebuilt landing page." | **OK.** Sells the deliverable, not the outcome. Could be: "See exactly what's costing you customers — and what the fix looks like." |

#### AI Sales Agent System Prompt (`sales-agent-system.ts`)

| Element | Verdict |
|---------|---------|
| Personality | **EXCELLENT.** "Direct and confident. Like a smart friend who happens to be a marketing expert." Matches brand voice. |
| Conviction fuel | **ALIGNED.** "Full execution, not strategy decks." "We eat our own cooking." Uses infrastructure language. |
| Proof | **ALIGNED.** References Adrian's food business as real proof, not vague claims. |
| Absolute rules | **STRONG.** "Never fabricate data," "Never be pushy," "Never discuss pricing specifics" — all match brand energy. |
| Objection handling | **ALIGNED.** Uses Hormozi CLOSER framework. Tone is direct but respectful. |
| Prescription context | **ALIGNED.** Uses the exact service names and outcomes from the offer architecture. |

---

### Follow-up Email System (`email-followup.ts`, `followup-sender`)

| Element | Verdict |
|---------|---------|
| AI-generated content | **RISK.** Follow-up emails are generated by Claude Sonnet at send time, with a system prompt that says "You are a senior marketing strategist at Forge (forgewith.ai)." But the prompt does NOT include the banned words list, brand voice rules, or contrarian take. The AI may generate copy using phrases like "leverage AI" or "10x your business" that the brand explicitly bans. |
| Fallback emails | **OK.** The hardcoded fallback emails in `sales-agent.ts:188-214` are functional but don't use the brand voice. They read like generic SaaS follow-ups: "Your funnel scan for [business] is ready. Overall score: X/100." Compare to the offer page's problem-aware copy. |

**Recommendation:** Inject the brand voice rules and banned words list into the follow-up email system prompt.

---

### Copy Quality Summary — Severity Ratings

| Finding | Severity | Location |
|---------|----------|----------|
| Headline uses banned time-promise pattern ("in 60 seconds") | **HIGH** | HeroSection.tsx:135 |
| Trust section repeats time-promise pattern 2 more times | **HIGH** | TrustSection.tsx:10-11, HeroSection.tsx:210 |
| Logo missing "WITH.AI" orange portion (4 locations) | **HIGH** | TopBanner.tsx:61, FooterSection.tsx:79 |
| Trust section headline is generic, doesn't target $500K-$5M | **MEDIUM** | TrustSection.tsx:58 |
| "500+ Scans Completed" may be fabricated pre-launch | **MEDIUM** | TrustSection.tsx:9 |
| Hero badge "AI-Powered Funnel Audit" doesn't use brand language | **MEDIUM** | HeroSection.tsx:120 |
| Contrarian take appears NOWHERE on the landing page | **MEDIUM** | Entire landing page |
| Subheadline is feature-focused, not outcome-focused | **MEDIUM** | HeroSection.tsx:142-148 |
| Follow-up email AI prompt lacks brand voice constraints | **MEDIUM** | followup-sender/route.ts:197 |
| /privacy and /terms links are dead (no pages exist) | **LOW** | FooterSection.tsx:84-99 |
| Landing page copy quality is significantly below offer page quality | **LOW** | page.tsx overall |
| Non-functional hamburger menu in TopBanner | **LOW** | TopBanner.tsx:67-73 |

---

### Comparative Assessment: Landing Page vs. Offer Page

The offer page (/offer) is a **masterclass in brand-aligned copy**. It uses the locked positioning, the contrarian take, the kitchen metaphor, the $500K-$5M target qualifier, and the "own everything / pay for intelligence" framing. Every paragraph sounds like Adrian.

The landing page (/) reads like a **pre-brand-workshop draft**. It falls back on generic SaaS patterns (time promises, inflated stats, "built for businesses that want to grow") that the brand workshop explicitly banned. The disconnect is jarring if a prospect reads both pages.

**Priority fix:** Rewrite the landing page headline, subheadline, badge, and trust section to match the quality and brand alignment of the offer page. The offer page copy proves the team knows how to write in the brand voice — the landing page just hasn't been updated to match.

---

*Investigation complete (with copy quality addendum). Zero files modified. Report written to `docs/audits/FULL-CODEBASE-INVESTIGATION-2026-04-04.md`.*
