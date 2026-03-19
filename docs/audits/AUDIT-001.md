# FORGE FUNNEL SCANNER — ORCHESTRATOR AUDIT REPORT

**Audit ID:** AUDIT-001
**Date:** 2026-03-18
**Triggered by:** Post Phase 3 integration review
**Scope:** Full end-to-end audit (Audits 1-11 + Spec Completeness)

---

## Build Status

- **TypeScript:** `tsc --noEmit` — zero errors
- **Production build:** `npm run build` — succeeds, all 26 API routes + 4 pages compile
- **Dependencies:** All installed, no missing packages
- **Tailwind v4:** Configured via `@theme inline` in `globals.css` — correct for the version
- **Cross-agent imports:** No violations found (Frontend does not import from `src/lib/db/`)

**Verdict: Builds clean. No compiler issues.**

---

## Critical Bugs

### BUG-1: Screenshot IDs are not valid UUIDs — all DB inserts fail

- **File:** `src/lib/screenshots/pipeline.ts:582-587`
- **Issue:** `generateScreenshotId()` produces IDs like `ss_lxyz123_abc12345` (custom text format). The `screenshots` table defines `id uuid primary key` (migration line 101). PostgreSQL rejects non-UUID values on insert.
- **Impact:** ALL screenshot DB inserts fail silently (line 314-316). No screenshots stored in DB. SSE status endpoint never finds screenshots to stream. The entire scan pipeline produces no visible output to the user.
- **Fix:** Replace the function body with `return crypto.randomUUID();`

### BUG-2: URL validation rejects URLs without protocol

- **File:** `src/app/api/scan/start/route.ts:16-34`
- **Issue:** Zod schema uses `.url()` (requires `https://` prefix) BEFORE `normalizeUrl()` runs (line 93). Users typing `example.com` get rejected with "Must be a valid URL."
- **Impact:** Most users don't type `https://` — this breaks the "zero friction entry" principle from spec Section 3 Phase 1.
- **Fix:** Apply `.transform()` in the Zod chain to normalize before `.url()` validates. Or restructure to: parse raw string → normalize → validate the normalized URL.

### BUG-3: SocialConfirmation sends empty email — always fails validation

- **File:** `src/components/scan/SocialConfirmation.tsx:52-64`
- **Issue:** `handleConfirm()` sends `email: ''` in the request body. The capture-info Zod schema at `src/app/api/scan/capture-info/route.ts:33-36` requires `email: z.string().min(1).email()`. Empty string fails `min(1)`.
- **Impact:** Social profile confirmation always returns 400. The user's social selection is never saved to the DB.
- **Fix:** Either (a) make `email` optional in the capture-info schema when `socialConfirmation` is provided, or (b) create a separate `/api/scan/confirm-social` endpoint.

### BUG-4: Cal.com embed uses wrong calLink path

- **File:** `src/components/shared/CalcomModal.tsx:114`
- **Issue:** `calLink` is hardcoded to `forge-digital/strategy-call`. The actual Cal.com URL in `.env.local` is `https://cal.com/adrian-trevino-kjqlqe/30min`. The `@calcom/embed-react` `Cal` component expects a `calLink` in `username/event-type` format — `forge-digital/strategy-call` doesn't match the real Cal.com account.
- **Impact:** Cal.com modal loads a 404 or the wrong event type. Booking doesn't work.
- **Fix:** Read `NEXT_PUBLIC_CALCOM_EMBED_URL`, strip `https://cal.com/` prefix, use the result (`adrian-trevino-kjqlqe/30min`) as the `calLink` value.

---

## Likely Runtime Failures

### RUNTIME-1: Pipeline runs fire-and-forget in serverless

- **File:** `src/app/api/scan/start/route.ts:141-150`
- **Issue:** `runScreenshotPipeline()` is called with `.catch()` only — no `await`, no `waitUntil()`. In Next.js on Vercel, the serverless function returns the response and may be killed before the 13-step pipeline completes (browser connection, multiple page captures, storage uploads, AI analysis).
- **Impact:** Works in `npm run dev` (long-running process). Will be killed prematurely on Vercel production.
- **Fix:** Use Next.js 15's `after()` or `waitUntil()` to extend function lifetime.

### RUNTIME-2: Supabase migration may not be applied to remote

- **File:** `supabase/migrations/20260318203853_initial_schema.sql`
- **Issue:** The migration creates all 11 tables + the `screenshots` storage bucket via SQL INSERT. If not applied to the remote Supabase instance, all DB operations fail.
- **Fix:** Run `npx supabase db push` against the remote instance. Verify tables exist.

### RUNTIME-3: No `page_discovered` SSE events ever emitted

- **File:** `src/app/api/scan/status/[id]/route.ts`
- **Issue:** The SSE endpoint polls the DB for screenshots, stages, and socials. But the pipeline doesn't record page discoveries to any DB table — it captures pages directly. The contract defines `page_discovered` events (`contracts/events.ts:25`) but nothing in the system produces them.
- **Impact:** Frontend progress messages like "Discovering your landing experience..." never appear. ProgressIndicator only shows screenshot capture and stage analysis messages.
- **Fix:** Either add a `scan_events` table for transient events, or accept this as a known gap and remove the event type from the contract.

### RUNTIME-4: CapturePrompt may appear before leadId is set

- **File:** `src/components/scan/ScanLayout.tsx:469-478`
- **Issue:** SSE sends `capture_prompt` after 15 seconds. The `leadId` comes from the initial data fetch (`/api/scan/results/{scanId}`). If that fetch is slow, `leadId` is null. CapturePrompt sends `leadId ?? ''` (line 60 of CapturePrompt.tsx) which fails Zod validation (`min(1)` rejects empty string).
- **Impact:** Race condition. If the results API responds slower than 15s, the capture form submission fails.
- **Fix:** Add `state.leadId !== null` to the CapturePrompt visibility condition at ScanLayout line 469.

---

## Integration Mismatches

### MISMATCH-1: DB schema diverges from spec schema

Comparing `supabase/migrations/` against spec Section 15.2:

| Spec column | Built | Issue |
|------------|-------|-------|
| `leads.language` | Missing | Spec has it, DB doesn't. i18n deprioritized per CLAUDE.md |
| `leads.utm_source/medium/campaign` | On `scans` table instead | Spec puts UTMs on leads. Built puts them on scans. Minor — scans is arguably better |
| `leads.ip_address` | Missing | Spec has it for rate limiting. Built uses separate `rate_limits` table with a `key` field instead |
| `screenshots.storage_path` | Named `storage_url` | Different column name. Built stores the full public URL; spec stores just the path. Built is actually better for frontend consumption |
| `messages.delivered/opened/clicked/replied` | Missing | Spec has engagement tracking columns. Built schema doesn't track email opens/clicks. Needed for multi-channel follow-up analytics |
| `followups.sequence_position` | Named `sequence_step` + added `sequence_id` | Different naming. Built version adds a `sequence_id` grouping field which is more flexible |
| `blueprints.lead_id` | Missing | Spec has it, built derives it via scan → lead join. Not a blocker |
| `scans.completed_without_lead` | Missing | Spec has it for exit recovery tracking. Needed when wiring exit recovery |
| `scans.language` | Missing | Spec has it for i18n. Deprioritized per CLAUDE.md |

### MISMATCH-2: DB mapper functions duplicated across 4 routes

- **Files:** `src/app/api/scan/results/[id]/route.ts`, `src/app/api/blueprint/generate/[scanId]/route.ts`, `src/app/api/chat/start/[scanId]/route.ts`, `src/app/api/chat/stream/[convId]/route.ts`
- **Issue:** Each route independently implements identical `dbScreenshotToData()`, `buildStageResult()`, and `buildScanResult()` mapper functions. If the contract types change, all 4 must be updated separately.
- **Fix:** Extract shared mappers to `src/lib/db/mappers.ts`.

---

## Missing Functionality

### Checked against spec sections:

| # | Spec Section | Feature | Status | Notes |
|---|---|---|---|---|
| 1 | §4.1 Traffic | Meta Ad Library check | **Not built** | Spec says check for active ads via Meta Ad Library |
| 2 | §4.1 Traffic | Google Ads Transparency check | **Not built** | Spec says check for active ads via Google Ads Transparency Center |
| 3 | §4.2 Landing | PageSpeed API integration | **Not built** | Spec says Core Web Vitals via PageSpeed API. `GOOGLE_PAGESPEED_API_KEY` is set in .env.local but never referenced in code |
| 4 | §7 AI Sales Agent | Data cards in chat | **Partially built** | `data_card` event type defined in contracts, ChatContainer handles it, but the chat stream endpoint never emits this event |
| 5 | §7 AI Sales Agent | Cal.com embed in chat | **Partially built** | `calcom_embed` event type defined in contracts, ChatContainer handles it, but the chat stream endpoint never emits this event |
| 6 | §7 AI Sales Agent | Hormozi training data | **Not loaded** | System prompt framework built (`sales-agent-system.ts`), but no actual Hormozi transcripts have been processed or distilled into the prompt |
| 7 | §8 Multi-Channel | Exit detection | **Not built** | Spec says `visibilitychange` + `beforeunload` + server-side timeout (no requests for 2+ min). No frontend exit detection code exists |
| 8 | §8 Multi-Channel | Auto-trigger follow-up | **Not wired** | API at `/api/followup/trigger` exists with full Zod validation but nothing ever calls it |
| 9 | §9 Exit Recovery | Contact scraping trigger | **Not wired** | API at `/api/followup/scrape-contact` exists but is never called from the scan pipeline or results page |
| 10 | §9 Exit Recovery | WHOIS lookup | **Not built** | Spec mentions WHOIS as a contact recovery method. No implementation exists |
| 11 | §9 Exit Recovery | Outbound with scan results | **Not built** | No code to send unsolicited outreach emails with scan results to scraped contacts |
| 12 | §12 Cal.com | Booking source tracking | **Partially built** | CalcomContext tracks `hasBooked` state but doesn't record the booking `source` (banner_cta, ai_agent, results_cta, etc.) to the database |
| 13 | §13 Stripe | Admin UI for team payments | **Stub only** | Payment API routes exist, admin pages render placeholder text only |
| 14 | §15 Pages | Admin dashboard | **Stub only** | `src/app/admin/page.tsx` renders `[COPY: Admin Dashboard]` text. No data fetching, metrics, or leads table |
| 15 | §15 Pages | Admin team scan view | **Stub only** | `src/app/admin/scan/[id]/page.tsx` renders only the scan ID. No scan details, no Stripe payment embed |
| 16 | §15 Tech | `middleware.ts` | **Not built** | CLAUDE.md lists it as Backend-owned. No auth session refresh, no admin route protection |
| 17 | §15 Tech | PostHog initialization | **Not built** | `NEXT_PUBLIC_POSTHOG_KEY` set in env but no PostHog client initialization or tracking code in layout |
| 18 | §15 Tech | next-intl (i18n) | **Removed per CLAUDE.md** | Spec mentions EN/ES, CLAUDE.md says "English only for now (remove next-intl dependency)" |
| 19 | §21 Rate Limiting | 1 scan per email | **Not built** | Only IP-based rate limiting exists (`ip_scan` type). No email-based dedup |
| 20 | §21 Rate Limiting | 60 API requests/min/IP | **Not built** | Only scan-specific rate limiting exists. No general API rate limiting |

---

## Spec Gaps

Where contracts/types don't cover what the spec or code needs:

1. **No `completed_without_lead` field** — Spec §9 needs to track scans where the user left without providing email. Neither `ScanResult` contract type nor DB `scans` table has this flag.

2. **No message engagement tracking** — Spec §8 needs `delivered`, `opened`, `clicked`, `replied` tracking per message. The `DbMessage` type and DB schema lack these columns. Needed for follow-up analytics and to stop sequences when engagement occurs.

3. **No `booking_source` passed from frontend** — Contract `CalcomWebhookPayload` expects `metadata` with `leadId` and `scanId`, but the Cal.com embed prefill doesn't include booking source context. `CalcomContext` doesn't pass which CTA triggered the booking.

4. **No video data collection in pipeline** — The `VideoAnalysis` and `VideoData` types are defined in `contracts/types.ts` and imported in the orchestrator, but the pipeline never collects actual video data. No scraping of Instagram/TikTok video metrics. `videoData` parameter is always `undefined`.

5. **No ad detection types** — Spec §4.1 mentions Meta Ad Library and Google Ads Transparency checks. No contract types exist for ad presence detection results. No API integration built.

6. **No PageSpeed/Core Web Vitals types** — Spec §4.2 mentions PageSpeed API for loading speed analysis. No types defined, no integration built, despite API key being configured.

---

## Env/Config Issues

| Variable | Status | Impact |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Set | OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | Set | OK |
| `ANTHROPIC_API_KEY` | Set | OK |
| `BROWSERLESS_API_KEY` | Set | OK |
| `STRIPE_SECRET_KEY` | Set (test mode) | OK for dev |
| `STRIPE_WEBHOOK_SECRET` | Commented out | Stripe webhooks won't verify signatures — payment webhooks will fail |
| `RESEND_API_KEY` | Set | OK |
| `TWILIO_ACCOUNT_SID` | **Empty** | SMS follow-ups will fail |
| `TWILIO_AUTH_TOKEN` | **Empty** | SMS follow-ups will fail |
| `TWILIO_PHONE_NUMBER` | **Empty** | SMS follow-ups will fail |
| `WHATSAPP_API_TOKEN` | **Empty** | WhatsApp follow-ups will fail |
| `WHATSAPP_PHONE_NUMBER_ID` | **Empty** | WhatsApp follow-ups will fail |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | **Empty** | WhatsApp follow-ups will fail |
| `NEXT_PUBLIC_CALCOM_EMBED_URL` | Set | OK — but CalcomModal doesn't read it (see BUG-4) |
| `CALCOM_API_KEY` | Set | OK |
| `CALCOM_WEBHOOK_SECRET` | Commented out | Cal.com webhooks won't verify signatures |
| `GOOGLE_PAGESPEED_API_KEY` | Set | OK — but never referenced in code |
| `GOOGLE_PLACES_API_KEY` | Set | OK — used by GBP detection in pipeline |
| `NEXT_PUBLIC_POSTHOG_KEY` | Set | OK — but no initialization code exists |
| `NEXT_PUBLIC_POSTHOG_HOST` | Set | OK — but no initialization code exists |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Must change to `https://audit.forgedigital.com` for production |

---

## Recommended Fix Order

### Priority 1 — Make the scan pipeline work end-to-end

| # | Fix | File | Effort |
|---|-----|------|--------|
| 1 | **Fix screenshot ID generation** — use `crypto.randomUUID()` | `src/lib/screenshots/pipeline.ts:582-587` | 1 line change |
| 2 | **Fix URL validation** — normalize before Zod validates | `src/app/api/scan/start/route.ts:15-34` | ~10 lines |
| 3 | **Verify Supabase migration applied** | Run `npx supabase db push` | Command only |

### Priority 2 — Fix remaining bugs that break user flows

| # | Fix | File | Effort |
|---|-----|------|--------|
| 4 | **Fix Cal.com calLink** — read from env var | `src/components/shared/CalcomModal.tsx:114` | ~5 lines |
| 5 | **Fix SocialConfirmation** — make email optional for social confirm | `src/app/api/scan/capture-info/route.ts` + `SocialConfirmation.tsx` | ~15 lines |
| 6 | **Guard CapturePrompt on leadId** — add null check | `src/components/scan/ScanLayout.tsx:469` | 1 line |

### Priority 3 — Production reliability

| # | Fix | File | Effort |
|---|-----|------|--------|
| 7 | **Fix fire-and-forget pipeline** — use `after()` or `waitUntil()` | `src/app/api/scan/start/route.ts:141` | ~10 lines |
| 8 | **Build middleware.ts** — auth session refresh + admin route protection | `src/middleware.ts` (new file) | ~40 lines |
| 9 | **Extract shared DB mappers** — eliminate duplication | `src/lib/db/mappers.ts` (new file), update 4 routes | ~80 lines |

### Priority 4 — Wire missing integrations

| # | Fix | File | Effort |
|---|-----|------|--------|
| 10 | **Wire exit detection** — `visibilitychange` + `beforeunload` triggers followup API | ScanLayout + new hook | ~50 lines |
| 11 | **Wire contact scraping** — trigger after scan completes without email | Pipeline | ~20 lines |
| 12 | **Initialize PostHog** — add provider to layout | `src/app/layout.tsx` | ~15 lines |
| 13 | **Add PageSpeed API** — use `GOOGLE_PAGESPEED_API_KEY` in landing stage | `src/lib/scanner/stage-landing.ts` | ~40 lines |
| 14 | **Add booking source tracking** — pass source through Cal.com metadata | CalcomContext + webhook handler | ~25 lines |

### Priority 5 — Build missing features

| # | Fix | Effort |
|---|-----|--------|
| 15 | **Build admin dashboard** — real metrics, leads table, recent scans | 1-2 days |
| 16 | **Build team scan view** — scan details + Stripe payment embed | 1-2 days |
| 17 | **Add message engagement columns** — migration for delivered/opened/clicked/replied | Small migration |
| 18 | **Set Twilio/WhatsApp keys** — when ready for multi-channel follow-ups | Config only |
| 19 | **Ad detection** — Meta Ad Library + Google Ads Transparency integration | Medium |
| 20 | **Hormozi training data** — process transcripts into Sales Agent system prompt | Depends on transcript availability |

---

## Summary

The codebase compiles cleanly and the architecture is sound — contracts, DB schema, API routes, and frontend components are well-structured and consistently use shared types. However, **the app cannot complete a scan end-to-end** due to BUG-1 (screenshot IDs are not valid UUIDs, causing all DB inserts to fail silently). Fixing BUG-1 plus BUG-2 (URL validation) would unblock the entire critical path from landing page to scan results. The remaining bugs (BUG-3, BUG-4) break secondary user flows (social confirmation, Cal.com booking). After the 4 critical bugs are fixed, the next priority is production reliability (fire-and-forget pipeline, middleware) and wiring the follow-up system that exists as API routes but is never triggered.
