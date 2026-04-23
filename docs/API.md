---
title: API Reference
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# API Reference

Every HTTP endpoint in the scanner. All payload shapes are authoritatively defined in `contracts/api.ts` and `contracts/events.ts` — this doc is the human-readable summary.

## Conventions

- **Base URL:** `NEXT_PUBLIC_APP_URL` (e.g. `https://audit.forgedigital.com`).
- **Content-Type:** `application/json` for all non-SSE responses.
- **Errors:** `{ error: { code, message, details? } }` where `code ∈ { RATE_LIMITED, INVALID_INPUT, NOT_FOUND, UNAUTHORIZED, INTERNAL }`. See `ApiError` in `contracts/api.ts`.
- **Zod:** every request body/query is parsed with Zod before work starts. A parse failure returns `400 INVALID_INPUT`.
- **SSE:** streams respond with `Content-Type: text/event-stream`. Events are serialized as `data: <json>\n\n`; every event has a discriminator `type` field. See `contracts/events.ts`.
- **Auth:** most routes are public (the scanner is an acquisition tool). Admin routes require a signed-in user whose email is in `ADMIN_EMAILS`, enforced by `src/middleware.ts` for pages and by `src/lib/auth/admin.ts` for API. Cron routes require `Authorization: Bearer $CRON_SECRET`.

## Endpoint inventory

| # | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| 1 | POST | `/api/scan/start` | public + rate-limited | Create lead + scan, schedule pipeline |
| 2 | GET | `/api/scan/status/[id]` | public | SSE: real-time scan progress |
| 3 | POST | `/api/scan/capture-info` | public | Attach email/phone/socials to existing lead |
| 4 | GET | `/api/scan/results/[id]` | public | Final scan snapshot |
| 5 | POST | `/api/blueprint/generate/[scanId]` | public | Generate funnel map + mockup |
| 6 | POST | `/api/chat/start/[scanId]` | public | Initialize sales-agent conversation |
| 7 | POST | `/api/chat/message` | public | Append user message to conversation |
| 8 | GET | `/api/chat/stream/[convId]` | public | SSE: assistant token stream + widgets |
| 9 | POST | `/api/followup/trigger` | public (beacon) | Enqueue follow-up sequence |
| 10 | POST | `/api/followup/scrape-contact` | public | Scrape contact info from lead's own site |
| 11 | POST | `/api/followup/webhook/calcom` | signed (HMAC) | Record booking, stop follow-ups |
| 12 | POST | `/api/followup/webhook/sms` | signed | Inbound SMS handling (Twilio) |
| 13 | POST | `/api/followup/webhook/whatsapp` | signed | Inbound WhatsApp handling |
| 14 | POST | `/api/payments/create-intent` | admin | Create Stripe PaymentIntent |
| 15 | POST | `/api/payments/webhook` | signed (Stripe) | Payment status updates |
| 16 | GET | `/api/payments/verify` | public | Verify PaymentIntent status client-side |
| 17 | GET | `/api/auth/callback` | Supabase | OAuth PKCE exchange |
| 18 | POST | `/api/auth/link-scan` | authenticated | Link signed-in user to an existing scan |
| 19 | GET | `/api/health` | public | Liveness probe |
| 20 | GET | `/api/admin/dashboard` | admin | Metric cards + recent scans |
| 21 | GET | `/api/admin/leads` | admin | Paginated lead table |
| 22 | GET | `/api/admin/scans` | admin | Paginated scan table |
| 23 | GET | `/api/admin/scan/[id]` | admin | Team view of one scan |
| 24 | GET | `/api/admin/payments` | admin | Payment history + summary |
| 25 | GET | `/api/admin/setup` | admin | 25-check env/ops health |
| 26 | GET | `/api/admin/workbooks` | admin | Workbook submissions table |
| 27 | GET | `/api/admin/workbooks/[id]` | admin | Single workbook detail |
| 28 | POST | `/api/admin/auth/login` | public | Admin login handoff |
| 29 | CRUD | `/api/admin/team` | admin | Team member management |
| 30 | POST | `/api/workbook/save` | authenticated (mine) or public (create) | Save branding/offers workbook |
| 31 | GET | `/api/workbook/mine` | authenticated | Fetch current user's workbook |
| 32 | GET/POST | `/api/test-screenshot` + `/debug` | dev-only | Manual capture test harness |
| 33 | POST | `/api/cron/followup-sender` | cron-auth | Send due follow-ups (every min) |
| 34 | POST | `/api/cron/nurture-sender` | cron-auth | Send long-term nurture emails |
| 35 | POST | `/api/cron/stale-scans` | cron-auth | Fail stalled scans + trigger recovery |

---

## Scan pipeline

### 1. `POST /api/scan/start`

Public. Rate-limited: 5/min burst + 20/24h per IP.

**Request:**

```ts
{
  url: string;              // bare domain OK, scheme auto-added, trailing slash stripped
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  providedSocials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    linkedin?: string;
  };
}
```

**Response 201:**

```ts
{
  scanId: string;     // uuid
  leadId: string;     // uuid
  streamUrl: string;  // "/api/scan/status/<scanId>"
}
```

**Side effects:** inserts `leads` + `scans`, schedules `runScreenshotPipeline` via Next.js `after()`. Response returns immediately; the pipeline runs in the serverless function's post-response window.

**Errors:** `INVALID_INPUT` (bad URL), `RATE_LIMITED` (429 with `{ remaining, resetAt }`), `INTERNAL`.

---

### 2. `GET /api/scan/status/[id]` — SSE

Public. Streams live pipeline events. Polls Postgres every 1.5 s and emits on state changes. Auto-closes on `scan_completed` / `scan_failed` or after a 5-min timeout. `capture_prompt` fires ~15 s in if no email captured yet.

**Event types (`ScanSSEEvent`, `contracts/events.ts`):**

- `scan_started` — `{ url }`
- `page_discovered` — `{ url, stage }` *(rare — legacy; most progress is inferred from capture events)*
- `screenshot_captured` — `{ screenshotId, stage, source, thumbnailUrl, viewport }`
- `social_detected` — `{ platform, handle, url, confidence }`
- `social_ambiguous` — `{ platform, options[] }` *(triggers UI disambiguation popup)*
- `capture_prompt` — fires once, ~15 s in
- `stage_analyzing` — `{ stage }`
- `annotation_ready` — `{ screenshotId, annotations[] }`
- `stage_completed` — `{ stage, summary }`
- `stage_failed` — `{ stage, error }`
- `video_analysis` — `{ stage: 'traffic', platform, analysis }`
- `blueprint_available`
- `scan_completed` — `{ summary: { overallHealth, stagesFound, stagesMissing, criticalIssues, topFinding } }`
- `scan_failed` — `{ error }`

**Client pattern:** a single `EventSource` per scanId; reconnect handled by the browser. The page narrows on `type` to route the event.

---

### 3. `POST /api/scan/capture-info`

Public. Attaches contact details to an in-flight scan. Unlocks full result visibility + enables follow-up.

**Request:**

```ts
{
  scanId: string;
  leadId: string;
  email?: string;            // optional when socialConfirmation provided
  phone?: string;
  fullName?: string;
  businessName?: string;
  providedSocials?: ProvidedSocials;
  socialConfirmation?: { platform: string; confirmedHandle: string };
}
```

**Response:** `{ success: true, lead: Lead }`.

At least one of email / socialConfirmation must be present — this is the commitment gate that fuels the rest of the funnel.

---

### 4. `GET /api/scan/results/[id]`

Public. Returns the final assembled `ScanResult` + `Lead`. Used by `/scan/:id` RSC for the initial SSR render before the SSE attaches.

**Response:**

```ts
{
  scan: ScanResult;          // see contracts/types.ts
  lead: Lead;
  blueprintAvailable: boolean;
  blueprintId?: string;
}
```

---

## Blueprint

### 5. `POST /api/blueprint/generate/[scanId]`

Public. Generates funnel map (current vs. ideal per stage) + HTML mockup for the weakest stage, extracts brand colors from the homepage screenshot.

**Response:** `{ blueprint: BlueprintData }` (includes `funnelMap`, `mockupHtml`, `mockupTarget`, `brandColors`). Idempotent — re-calling returns the existing row via `scans.blueprints` 1:1 constraint.

---

## Chat (AI Sales Agent)

### 6. `POST /api/chat/start/[scanId]`

**Request:** `{ scanId, leadId }`.
**Response:** `{ conversationId, streamUrl, initialMessage }`.

Creates a `conversations` row, builds the system prompt from scan results + blueprint + Hormozi playbook, generates a contextual first assistant message (references a specific finding from their scan).

### 7. `POST /api/chat/message`

**Request:** `{ conversationId, content, channel? = 'web' }`.
**Response:** `{ messageId, streamUrl }`.

Stores the user message, returns the SSE URL for the assistant's streamed reply.

### 8. `GET /api/chat/stream/[convId]` — SSE

Streams the assistant response token-by-token from Sonnet. The parser watches for marker tokens in the stream and translates them to rich events:

- `typing_start`
- `token` — `{ content }`  *(plain text delta)*
- `data_card` — `{ screenshotId, annotations }` *(emitted when model writes `[[DATA_CARD:id]]`)*
- `calcom_embed` — `{ url }` *(emitted on `[[CALCOM_EMBED]]`)*
- `typing_end`
- `message_complete` — `{ messageId, content, metadata? }`
- `error` — `{ message }`

Also increments `conversations.engagement_score` and updates `objection_count` / `last_objection_type` via the `objection-classifier` (see `src/lib/ai/objection-classifier.ts`).

---

## Follow-up

### 9. `POST /api/followup/trigger`

Public, called from `navigator.sendBeacon` on exit intent. **Request:** `{ scanId, leadId, reason: 'exit_intent' | 'no_booking' | 'abandoned_scan' }`. Schedules a multi-touch email sequence in `followups`. Returns `{ scheduled, sequenceId, firstMessageAt }`.

### 10. `POST /api/followup/scrape-contact`

Public, triggered when a lead bounces before providing contact info. Scrapes homepage / GBP / (WHOIS stubbed) for email + phone. **Request:** `{ scanId, websiteUrl }`. **Response:** `{ found, email?, phone?, source }`.

### 11. `POST /api/followup/webhook/calcom`

HMAC-signed by Cal.com with `CALCOM_WEBHOOK_SECRET`. Payload mirrors `CalcomWebhookPayload` (`BOOKING_CREATED | CANCELLED | RESCHEDULED`). On create: inserts `bookings` row, sets `conversations.status = 'booked'`, cancels all pending `followups` for the lead.

### 12–13. `POST /api/followup/webhook/sms` + `/whatsapp`

Twilio / WhatsApp-Business inbound handlers. Stubs exist; full dispatch is not wired (blocked on Twilio account + WhatsApp API credentials — see `KNOWN-ISSUES.md`). Signatures verified when creds are configured.

---

## Payments (team-initiated only)

### 14. `POST /api/payments/create-intent`

Admin-only. Called from the `/admin/scan/:id` view during a live strategy call. Creates a Stripe PaymentIntent sized to the deal.

**Request:**

```ts
{
  leadId: string;
  scanId?: string;
  amountCents: number;
  currency?: string;         // default 'usd'
  productType: 'setup_fee' | 'monthly_retainer' | 'custom_package';
  description?: string;
}
```

**Response:** `{ clientSecret, paymentIntentId }`. The admin page mounts Stripe Elements with the `clientSecret` so the prospect can pay live on the call.

### 15. `POST /api/payments/webhook`

Stripe-signed with `STRIPE_WEBHOOK_SECRET`. Handles `payment_intent.succeeded / failed / canceled`, updates the `payments.status` row.

### 16. `GET /api/payments/verify`

Public with `?payment_intent=<id>`. Returns the Stripe PaymentIntent status for the client confirmation page.

---

## Auth

### 17. `GET /api/auth/callback`

Supabase PKCE callback. Exchanges `?code=` for a session via `@supabase/ssr`, sets the auth cookie, redirects to `?next=` or `/`.

### 18. `POST /api/auth/link-scan`

Authenticated. **Request:** `{ scanId }`. Sets `scans.user_id = auth.uid()` so the signed-in user can later access their own result page via RLS.

### 19. `GET /api/health`

Public. Returns `{ ok: true }` for uptime monitors. Excluded from `middleware.ts` so it never allocates auth work.

---

## Admin

All `/api/admin/*` routes require a session whose email is in `ADMIN_EMAILS`. Unauthorized → `403 UNAUTHORIZED`.

- `GET /api/admin/dashboard` → `AdminDashboardResponse` (metric cards + 10 recent scans).
- `GET /api/admin/leads?page&limit&status&source&sortBy&sortOrder` → `AdminLeadsResponse`.
- `GET /api/admin/scans?page&limit&status&hasLead&dateFrom&dateTo&search` → `AdminScansResponse`.
- `GET /api/admin/scan/[id]` → full scan + lead + booking + payment context for a single row.
- `GET /api/admin/payments?page&limit&status&dateFrom&dateTo` → `AdminPaymentsResponse` (includes totals summary).
- `GET /api/admin/setup` → 25 ops health checks across 6 groups (env vars, DB connectivity, Anthropic, Browser endpoint, Supabase Storage, Cal.com).
- `GET /api/admin/workbooks?page&limit` → paginated workbook submissions.
- `GET /api/admin/workbooks/[id]` → `AdminWorkbookDetailResponse` (full answers).
- `POST /api/admin/auth/login` → password-assisted admin login path (complements OAuth).
- `/api/admin/team` → CRUD for admin team members.

---

## Workbooks (branding + offers discovery)

### 30. `POST /api/workbook/save`

Public to create (anonymous), authenticated to update (RLS enforces `user_id = auth.uid()` or `user_id IS NULL` — the "claim" path).

**Request:**

```ts
{
  id?: string;                         // omit to create
  type?: 'branding' | 'offers';        // default 'branding'
  clientName?: string;
  businessName?: string;
  locale?: string;                     // 'en' | 'es'
  answers: Record<string, string>;
  completedCount?: number;
  totalFields?: number;
}
```

**Response:** `{ id, savedAt }`.

### 31. `GET /api/workbook/mine`

Authenticated. Returns the current user's latest workbook (by type + locale).

---

## Dev / debug

- `GET|POST /api/test-screenshot` — manual capture test harness; opens the Playwright client against a given URL and returns a buffer or stores it. Not for prod.
- `GET /api/test-screenshot/debug` — returns browser endpoint diagnostics.

Remove or feature-flag off before any security review.

---

## Cron (Vercel Cron)

All cron routes require `Authorization: Bearer $CRON_SECRET`. Misses → `401 UNAUTHORIZED`.

Registered in `vercel.json`:

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/followup-sender` | `* * * * *` (every min) | Send due followups via Resend, advance sequence step |
| `/api/cron/stale-scans` | `*/15 * * * *` | Mark scans stuck `scanning` > 10 min as `failed`; trigger `abandoned_scan` recovery |

Additionally defined but not wired in `vercel.json`:

- `/api/cron/nurture-sender` — long-term nurture emails; wire on next cron expansion.

---

## Rate limits (summary)

Enforced via `src/lib/rate-limit/index.ts` and the `rate_limits` table:

| Key | Type | Window | Limit |
|---|---|---|---|
| IP | `ip_api` | 60 s | 5 |
| IP | `ip_scan` | 24 h | 20 |
| email | `email_scan` | 24 h | 1 (soft) |

On exceed, returns `429 RATE_LIMITED` with `{ remaining, resetAt }`.

---

## Data-shape cross-refs

- Full type catalog: `contracts/types.ts`
- SSE event catalog: `contracts/events.ts`
- All request/response shapes: `contracts/api.ts`
- DB row shapes (snake_case): `src/lib/db/types.ts`
- DB ↔ contract mappers: `src/lib/db/mappers.ts`

When adding a new route: add request/response to `contracts/api.ts` first, import into the route, validate with Zod, map DB rows through `mappers.ts`. See [DEVELOPMENT.md](DEVELOPMENT.md) § Adding an API route for the full recipe.
