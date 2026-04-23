---
title: Architecture
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Architecture

A serverless Next.js 16 App Router app on Vercel, backed by Supabase (Postgres + Storage + Auth) and a self-hosted Chrome CDP endpoint on a Hetzner VPS. Claude Sonnet 4 drives all vision / reasoning / content; Claude Haiku 3.5 handles fast technical checks. All real-time UI is Server-Sent Events, not websockets.

## High-level diagram

```mermaid
flowchart LR
  subgraph Client [Browser]
    Landing[Landing /]
    Scan[/scan/:id/]
    Admin[/admin/*]
  end

  subgraph Vercel [Vercel — Next.js 16 serverless]
    API[API routes]
    Pages[RSC pages]
    MW[middleware.ts<br/>auth + CSP]
    Cron[Cron routes]
  end

  subgraph Supabase
    PG[(Postgres<br/>+ RLS)]
    Stor[Storage<br/>screenshots bucket]
    Auth[GoTrue Auth]
  end

  subgraph Hetzner [Hetzner CX22 VPS]
    Chrome[Headless Chrome<br/>CDP :9222]
    Tunnel[Cloudflare Tunnel<br/>chrome.forgewith.ai]
  end

  subgraph External [3rd-party APIs]
    Anthropic
    Apify
    Resend
    Stripe
    Cal[Cal.com]
    PageSpeed[Google PageSpeed]
    Places[Google Places]
    Meta[Meta Ad Library]
    PostHog
  end

  Landing --> API
  Scan <-->|SSE| API
  Admin --> API
  Pages --> PG
  API --> PG
  API --> Stor
  API --> Auth
  API -->|Playwright CDP| Tunnel --> Chrome
  API --> Anthropic
  API --> Apify
  API --> Resend
  API --> Stripe
  API --> Cal
  API --> PageSpeed
  API --> Places
  API --> Meta
  Landing --> PostHog
  Cron -->|every min / 15 min| API
  MW -. wraps all requests .-> Pages
  MW -. wraps all requests .-> API
```

## Core request / streaming flow — the critical path

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant FE as Next.js Client<br/>(/scan/:id)
  participant API as Next.js API<br/>(Vercel)
  participant DB as Supabase Postgres
  participant ST as Supabase Storage
  participant CR as Hetzner Chrome (CDP)
  participant AI as Anthropic Sonnet

  U->>API: POST /api/scan/start { url }
  API->>DB: insert leads + scans
  API-->>U: 201 { scanId, streamUrl }
  note over API: after(runScreenshotPipeline)
  par Background pipeline
    API->>CR: connectOverCDP(BROWSER_WS_ENDPOINT)
    CR-->>API: page screenshots (desktop + mobile, 5 stages)
    API->>ST: upload screenshots
    API->>DB: insert screenshots rows
    API->>AI: runScanAnalysis (5 stages parallel + GEO + AEO)
    AI-->>API: annotations[] per screenshot
    API->>DB: update screenshots.annotations + funnel_stages
  end
  U->>API: GET /api/scan/status/:id  (SSE)
  loop every 1.5s until complete / 5min timeout
    API->>DB: poll scans, funnel_stages, screenshots
    API-->>FE: SSE: screenshot_captured / annotation_ready / stage_completed
  end
  FE-->>U: CapturePrompt @15s, annotations stream in, FunnelHealthSummary at end
  U->>API: POST /api/blueprint/generate/:scanId
  API->>AI: funnel map + mockup HTML
  API->>DB: insert blueprint
  API-->>FE: BlueprintData
  note over FE: 30s no booking → ChatContainer opens
  U->>API: POST /api/chat/start/:scanId → POST /api/chat/message → GET /api/chat/stream/:convId (SSE)
  API->>AI: streamWithSonnet(Hormozi system prompt + scan context)
  AI-->>API: token stream
  API-->>FE: SSE: typing_start → token* → message_complete / data_card / calcom_embed
  U->>Cal.com: Book via modal overlay
  Cal.com->>API: POST /api/followup/webhook/calcom
  API->>DB: insert bookings; cancel pending followups
```

## Component layers

```mermaid
graph TD
  subgraph Contracts
    C1[contracts/types.ts]
    C2[contracts/events.ts]
    C3[contracts/api.ts]
  end

  subgraph AppRouter [src/app — App Router]
    P[pages: / /scan /offer /admin /workbooks]
    R[api/scan, api/chat, api/blueprint, api/followup,<br/>api/payments, api/admin, api/cron, api/workbook, api/auth]
  end

  subgraph Lib [src/lib]
    DB[db/ — client, types, mappers, admin-queries]
    Sh[screenshots/ — pipeline, client (Playwright CDP), social-detector]
    Sc[scanner/ — orchestrator, stage-* x5, analyze-geo, analyze-aeo,<br/>ad-detection, detect-google-ads, apify-enrichment]
    AI[ai/ — client, annotate, sales-agent, video-analysis,<br/>contact-scraper, objection-classifier, playbook-loader]
    Pr[prompts/ — annotation, stage-summary, funnel-map, mockup,<br/>sales-agent-system, openers, email/sms/whatsapp-followup]
    BP[blueprint/ — funnel-map, brand-extractor, mockup-generator]
    FU[followup/ — email-template]
    Stripe[stripe/ — client]
    RL[rate-limit/ — DB-backed]
    Auth[auth/ — admin.ts, config.ts]
    Vault[vault/ — queue-writer, event-writer]
    DT[design-tokens.ts, gsap-presets.ts, prescriptions.ts, api-utils.ts]
  end

  subgraph Comp [src/components]
    Land[landing/*]
    ScanC[scan/* — ScanLayout, ScreenshotCard, StageFindingsView,<br/>FunnelHealthSummary, BlueprintView, CapturePrompt, SocialConfirmation,<br/>AnnotationMarker, AnnotationPopover, HealthPotential, etc.]
    Chat[chat/* — ChatContainer, ChatMessage, ChatInput, DataCard, TypingIndicator]
    Prov[providers/* — SupabaseProvider, CalcomContext, GSAPProvider, PostHogProvider]
    Sh2[shared/* — TopBanner, CalcomModal]
  end

  Contracts --> AppRouter
  Contracts --> Lib
  Contracts --> Comp
  R --> DB
  R --> Sh
  R --> Sc
  R --> AI
  Sh --> Sc
  Sc --> AI
  Sc --> Pr
  AI --> Pr
  BP --> AI
  Comp --> R
  P --> Comp
  R --> RL
  R --> Auth
  R --> Vault
  R --> Stripe
```

## Key architectural decisions

### 1. SSE over websockets for real-time scan progress

- **Why:** Vercel serverless supports SSE natively. Websockets require sticky connections that serverless can't guarantee. SSE is also friendlier to corporate proxies.
- **Shape:** one SSE endpoint per scan (`/api/scan/status/:id`), polling Postgres every 1.5s and pushing diffs. Separate SSE for chat (`/api/chat/stream/:convId`) streaming token-by-token from Anthropic.
- **Events:** fully typed in `contracts/events.ts` (`ScanSSEEvent`, `ChatSSEEvent`). Frontend narrows on `type` field.
- **Tradeoff:** Postgres polling per scan is cheap (one indexed scan), but does put a floor on latency (~1.5s). Good enough for UX; not a message bus.

### 2. Background pipeline via Next.js `after()` — not `waitUntil`, not fire-and-forget

`POST /api/scan/start` returns 201 with `{ scanId, streamUrl }` immediately, then schedules the screenshot + analysis pipeline with `after()` so the Vercel function stays alive until the pipeline resolves. `waitUntil` on Vercel is bounded more aggressively; plain fire-and-forget gets killed the moment the response is flushed.

Seen in `src/app/api/scan/start/route.ts`:

```ts
after(runScreenshotPipeline({ scanId, leadId, websiteUrl }).catch(err => …));
```

### 3. Self-hosted Chrome on Hetzner, not Browserless-only

Browserless works but gets expensive at volume and has cold-start variance. We run Playwright's Chromium image on a Hetzner CX22 (~$4/mo, 2 vCPU / 4 GB / 40 GB) behind a Cloudflare tunnel (`chrome.forgewith.ai`). Next.js connects via `chromium.connectOverCDP(BROWSER_WS_ENDPOINT)`. Browserless remains wired as a fallback (`BROWSERLESS_API_KEY`) for incident resilience. Setup in `docs/HETZNER-SETUP.md`, Dockerfile in `docker/chrome/Dockerfile`.

The Dockerfile uses `socat` to bridge Chrome's 127.0.0.1-only CDP to the container's `0.0.0.0:9222` — required because Chrome refuses to bind `--remote-debugging-address=0.0.0.0` in recent builds.

### 4. Contracts as single source of truth

All shared types live in `contracts/*.ts`. API routes, components, and the AI pipeline **import** from contracts — they do not redefine. The only place types are duplicated is `src/lib/db/types.ts`, which mirrors Postgres snake_case row shapes; conversion to camelCase contract shapes happens through `src/lib/db/mappers.ts`.

Rule: if you need a new type used across layers, add it to `contracts/` first, then consume. Frontend **never** imports from `src/lib/db/` — it calls API routes, which return contract-shaped responses.

### 5. Parallel stage analysis, `Promise.allSettled` isolation

`src/lib/scanner/orchestrator.ts` fires all 5 stages (traffic / landing / capture / offer / followup) concurrently, plus GEO + AEO analysis in a side promise. One failed stage does not stop the others — the orchestrator surfaces each as `stage_completed` or `stage_failed` individually. GEO/AEO findings are folded into the traffic stage post-hoc.

### 6. Progressive capture instead of hard auth gate

Users enter a URL, scan starts, then ~15 s in, `CapturePrompt` slides in asking for email + phone. Blueprint generation requires only the captured email, no OAuth. Google OAuth is a soft "save your results" prompt after the blueprint. This was an intentional scope choice (see `CLAUDE.md` § Known decisions) — auth as gate kills funnel conversion.

### 7. Lead-scoped RLS + anonymous-readable scan results

Postgres RLS is enabled on every table. Scans, screenshots, funnel_stages, blueprints are readable by `anon` so users can view their own `/scan/:id` page without logging in (the URL itself is the bearer token). Service role bypasses RLS for pipeline writes. Leads, conversations, messages, bookings are locked to the authenticated `auth.uid()` when present. See `supabase/migrations/20260318203853_initial_schema.sql` for the full policy set.

### 8. DB-backed rate limiting

`src/lib/rate-limit/` uses the `rate_limits` table (key, type, count, window_start) to enforce:
- 5 requests / 60 s per IP (burst)
- 20 scans / 24 h per IP
- Chat message limits per conversation

Not Redis, not edge — Postgres is the source of truth, which keeps the limit consistent across Vercel regions.

### 9. Write-back to forge-vault via queue/event writer

`src/lib/vault/queue-writer.ts` and `event-writer.ts` emit structured records that the Forge agent stack (Kova / Sales Orchestrator / Lore) consumes. The scanner is the **primary lead source** for the agency — captured leads flow out to `shared/inbox/` or the minions task queue for follow-up dispatch.

### 10. AI Sales Agent: streaming + marker-protocol for inline widgets

`src/app/api/chat/stream/[convId]/route.ts` streams Sonnet tokens. The system prompt at `src/lib/prompts/sales-agent-system.ts` teaches the model to emit custom markers (e.g. `[[DATA_CARD:screenshotId]]`, `[[CALCOM_EMBED]]`) which the stream parser converts into `data_card` / `calcom_embed` SSE events. The frontend renders these as inline React components (`DataCard`, `CalcomEmbed`) without leaving the message.

This keeps the conversational feel (text) while allowing rich widgets (booking, evidence cards) without navigating away — consistent with the "$100K feel" rule.

### 11. Middleware: auth + CSP + security headers at the edge

`src/middleware.ts` runs on every non-asset request:

1. Refreshes the Supabase auth session cookie (SSR pattern).
2. Gates `/admin/*` — redirect to `/admin/login` if not signed in; reject if email not in `ADMIN_EMAILS` allowlist.
3. Sets CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection on every response.
4. `api/health` excluded so monitoring pings don't allocate auth work.

### 12. Image loading via Next.js remote patterns restricted to Supabase

`next.config.ts` derives the Supabase hostname from `NEXT_PUBLIC_SUPABASE_URL` at build time and whitelists only `/storage/v1/object/public/**`. All screenshots flow through `next/image` for AVIF/WebP conversion.

### 13. Design system centralized in `design-tokens.ts` + `gsap-presets.ts`

Single source of truth for colors, fonts, spacing, radii, and animation presets. Components import these; they do not invent new values. Animation sequences are documented inline with beat comments so visual reviews can be done from the code alone. See `CLAUDE.md` § Design system for full rules.

## Data flow summary by subsystem

| Subsystem | Entry | Intermediate state | Terminal state |
|---|---|---|---|
| Scan init | `POST /api/scan/start` | leads + scans rows, pipeline scheduled | SSE stream opens |
| Capture | Playwright CDP via `screenshots/pipeline.ts` | PNG buffers | Supabase Storage + `screenshots` rows |
| Analysis | `runScanAnalysis(orchestrator)` | parallel stages | `screenshots.annotations` + `funnel_stages.summary` + `scans.status=completed` |
| Blueprint | `POST /api/blueprint/generate/:scanId` | funnel map JSON + mockup HTML | `blueprints` row |
| Chat | `POST /api/chat/start/:scanId` → `/message` → `/stream/:convId` | messages rows, engagement/objection scoring on `conversations` | `conversations.status` transitions |
| Booking | Cal.com modal → `POST /api/followup/webhook/calcom` | `bookings` row, `conversations.status=booked` | pending followups cancelled |
| Payment | Admin-only `POST /api/payments/create-intent` → Stripe Elements in `/admin/scan/:id` | `payment_intents`, Stripe webhook `POST /api/payments/webhook` | `payments.status=succeeded` |
| Follow-up | Cron `/api/cron/followup-sender` (1 min) / `/nurture-sender` (daily) / `/stale-scans` (15 min) | scheduled `followups` rows | `followups.status=sent` + Resend delivery |

## Cross-cutting patterns

- **Error envelope:** every API error returns `{ error: { code, message, details? } }` (see `contracts/api.ts` `ApiError`). Codes: `RATE_LIMITED`, `INVALID_INPUT`, `NOT_FOUND`, `UNAUTHORIZED`, `INTERNAL`. Helper: `src/lib/api-utils.ts#apiError`.
- **Zod at every boundary:** every API route validates its input with Zod before touching DB or AI. No exceptions, including cron and webhooks.
- **try/catch around every AI JSON parse:** prompts return JSON; the parser wraps in try/catch with a structured fallback. Never crash on a model misformat.
- **Typed SSE write helpers:** SSE formatters live alongside the routes that emit them; they serialize to `data: <json>\n\n` and always include a `type` discriminator.
- **`TZ=America/Monterrey` for all user-facing timestamps** (inherited from the broader Forge convention).
- **Commit format:** `[<agent>] type: description` enforced by `.githooks/commit-msg` at the vault root. Types: `decide / execute / propose / fix / learn / compile / audit / ops / feat` (+ `docs` for doc changes).

## Related

- [API.md](API.md) — every route with payload shapes
- [DATA-MODELS.md](DATA-MODELS.md) — schema + RLS + ERD
- [DEPLOYMENT.md](DEPLOYMENT.md) — how this ships
- [AGENTS.md](AGENTS.md) — how the codebase is split across agents
- Spec of record: `../../../canon/forge-scanner-spec.md`
