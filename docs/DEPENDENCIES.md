---
title: Dependencies
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Dependencies

Third-party services + SDKs the scanner relies on, with cost risk, failure behavior, and alternatives considered. Package versions are authoritative in `package.json`; this doc explains the *why*.

## At-a-glance

| Category | Provider | SDK | Cost risk | Degrades gracefully? |
|---|---|---|---|---|
| DB + Auth + Storage | Supabase | `@supabase/supabase-js`, `@supabase/ssr` | low (predictable tiering) | no — hard dep |
| Hosting | Vercel | n/a | medium (bandwidth + function time) | no — hard dep |
| AI | Anthropic | `@anthropic-ai/sdk` | high (per-call) | no — hard dep |
| Browser | self-hosted Chrome (Hetzner) | `playwright-core` | low (~$4/mo VPS) | yes — Browserless fallback |
| Browser fallback | Browserless.io | `playwright-core` | medium (per-second) | yes — stand-by |
| Booking | Cal.com | `@calcom/embed-react` | low (free tier) | partial — modal would 404 |
| Payments | Stripe | `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js` | low (percentage-only) | yes — feature can be off |
| Email | Resend | `resend` | low (free up to 3k/mo) | yes — follow-up pauses |
| Email rendering | React Email | `@react-email/components` | free | n/a |
| Analytics | PostHog | `posthog-js` | low (free tier) | yes — silently no-ops |
| PageSpeed signals | Google PageSpeed API | `fetch` | free | yes — stage runs without |
| Business / GBP | Google Places API | `fetch` | medium (per-request) | yes — GBP stage falls back |
| Ad intel | Meta Ad Library API | `fetch` | free | yes — traffic stage degrades |
| Social scraping | Apify | `apify-client` | medium (per-scrape) | yes — enrichment is optional |
| UI motion | GSAP (+ @gsap/react) | `gsap`, `@gsap/react` | free for our use | n/a |
| Image processing | Sharp | `sharp` | free | n/a |
| Validation | Zod | `zod` | free | n/a |
| UI primitives | class-variance-authority, clsx, tailwind-merge, lucide-react | n/a | free | n/a |

## Required, no alternative — hard dependencies

### Supabase — Postgres + Auth + Storage

**Why:** one vendor for three things we'd otherwise need to wire separately (Postgres + GoTrue + S3-style buckets + SSR auth helpers). RLS lets us enforce tenancy at the DB layer. `@supabase/ssr` is the pattern Next.js 16 expects for middleware-driven session refresh.

**Failure mode:** prod outage = scanner is down. No fallback. Critical path.

**Alternatives considered:**

- **Neon + Clerk + S3:** more pieces to glue, higher cognitive cost for a solo-maintained project.
- **PlanetScale:** lacks RLS equivalents, would require rewriting authorization into app code.

**Cost ceiling:** ~$25/mo Pro tier covers us well past initial volume.

### Anthropic — Claude Sonnet 4 + Haiku 3.5

**Why:** Sonnet's vision is the product. Haiku handles fast classification. No other provider has this combo at the quality level we need for annotating screenshots with specific, sometimes witty findings.

**Failure mode:** 429s during a spike → annotation pipeline fails partial. `Promise.allSettled` in the orchestrator isolates stage failures so one rate-limit event doesn't break an entire scan.

**Alternatives considered:**

- **OpenAI GPT-4o vision:** tested; hallucinates less but produces generic findings that feel templated. Not on-brand for the $100K feel.
- **Gemini 2.5:** cheaper, similar vision quality, less consistent JSON formatting.

**Cost risk:** high. Sonnet is ~$3/M input + $15/M output; a full scan with 10–15 screenshots costs ~$0.40–0.80 on current pricing. Volume × cost = the #1 operating cost. Mitigations: Haiku for classification tasks, prompt length discipline, JSON-only output (no prose).

### Vercel — Hosting

**Why:** Next.js 16 App Router plus `after()` post-response pattern is first-class on Vercel. Edge middleware, SSE over Node runtime, cron all natively supported.

**Failure mode:** Vercel down = scanner down. No fallback. Critical path.

**Alternatives considered:**

- **Self-host on Fly.io:** doable but `after()` + edge middleware + cron stack would need hand-wiring. Not worth the engineering time when a solo maintainer's bottleneck is feature work, not hosting cost.
- **Cloudflare Workers / Next on Workers:** Next.js 16 support is improving but still lags. Re-evaluate in 6 months.

## Low-cost, well-isolated dependencies

### Cal.com — Booking

**Why:** the modal-over-results pattern requires the embed SDK; navigating to Cal.com breaks the funnel. `@calcom/embed-react` is the only library that does inline modal + prefilling + source metadata.

**Failure mode:** Cal.com outage → booking modal 404. Scanner still runs; just can't close bookings during that window.

**Alternatives considered:**

- **Calendly:** embed is chunkier, source metadata API is weaker.
- **Custom ICS flow:** kills the conversion flow (prospect has to switch apps).

### Resend — Email

**Why:** straightforward domain-verification flow, React Email templates, fast deliverability. Bounce / open tracking out of the box.

**Failure mode:** Resend down → cron run for `followup-sender` fails silently until they recover; follow-ups queue up in `followups` with `status = 'pending'`.

**Alternatives considered:**

- **Postmark:** comparable; more expensive at volume.
- **AWS SES:** cheaper at scale, worse deliverability out of the box, more wiring.

### Stripe — Payments

**Why:** team-initiated payments via `PaymentIntent` + Stripe Elements. No recurring subscription plumbing yet (see `KNOWN-ISSUES.md`), but Stripe is unambiguously correct when we add it.

**Failure mode:** Stripe outage = can't close payment on a call. Falls back to manual invoice.

### PostHog — Analytics

**Why:** product analytics + funnel reports. Client-side init only; no server-side SDK needed.

**Failure mode:** dev console has warnings; no user-visible impact.

### GSAP — Animation

**Why:** timeline control, ScrollTrigger, scope refs via `useGSAP`. Framer Motion can't express the sequences we need (stagger + timeline + plugins). CSS transitions alone are too limited.

**Failure mode:** if the bundle grows huge, consider GSAP club (paid) plugins — but we haven't needed them.

## Feature-gated dependencies (graceful fallback built in)

These fire only when keys are configured. Missing keys = the subsystem no-ops with a log line; the scan still completes.

- **Google PageSpeed API** (`GOOGLE_PAGESPEED_API_KEY`) — landing-stage Core Web Vitals.
- **Google Places API** (`GOOGLE_PLACES_API_KEY`) — GBP detection + listing capture.
- **Meta Ad Library API** (`FACEBOOK_APP_ACCESS_TOKEN`) — traffic-stage ad detection.
- **Apify** (`APIFY_API_TOKEN`) — Instagram / TikTok / Facebook / Google Maps enrichment.
- **Twilio** (`TWILIO_*`) — SMS follow-up (not yet wired end-to-end).
- **WhatsApp Business** (`WHATSAPP_*`) — WhatsApp follow-up (not yet wired).
- **Stripe** (`STRIPE_*`) — payments.
- **Cal.com webhook secret** (`CALCOM_WEBHOOK_SECRET`) — signature verification.

The graceful-fallback pattern: each feature-gated path starts with `if (!env.X) { log('skipped'); return null; }` in the scanner modules; the orchestrator tolerates null fluidly.

## Dev-only / build-time

- **Supabase CLI** — migrations, local dev, type generation.
- **TypeScript** — strict mode.
- **ESLint** (`eslint-config-next`) — lint.
- **Tailwind CSS v4** — styles via `@theme inline`.
- **Bun** — package manager + runtime for local scripts.

## Bundle + perf notes

- `apify-client` is marked `serverExternalPackages` in `next.config.ts` so Next doesn't try to bundle it into the serverless function edge image.
- `playwright-core` is used — not `playwright` — which avoids bundling browser binaries. The actual Chromium lives on Hetzner.
- Dynamic imports isolate `@calcom/embed-react`, Stripe, ChatContainer from the landing-page first-load.

## Cost model (rough)

At 100 scans/day, steady state:

| Line item | ~Monthly |
|---|---|
| Anthropic (Sonnet + Haiku mix) | $1,200–2,400 |
| Vercel (Pro) | $20 + bandwidth |
| Supabase (Pro) | $25 |
| Hetzner VPS | $4 |
| Browserless (fallback, rarely active) | $0–50 |
| Cal.com | $0 (free tier) |
| Resend | $0 (under 3k/mo) |
| Google APIs | $10–30 |
| Apify | $50–150 |
| Stripe | 2.9% + 30¢ / successful charge |

AI cost dominates — at 5× volume, prompt optimization + Haiku routing for more sub-tasks becomes material.

## Dependency hygiene

- Pin exact versions of anything on the hot path (Next.js, Supabase, Anthropic SDK).
- Re-review this doc + `package.json` on any major-version bump of Next.js, React, or Supabase client.
- Do not add a new runtime dependency without answering: (a) what specific capability is missing from the current stack? (b) what's the failure-mode cost? (c) has it existed for ≥ 12 months with active maintenance?

## Related

- [SETUP.md](SETUP.md) — which env vars gate which integrations
- [DEPLOYMENT.md](DEPLOYMENT.md) — webhook wiring for Stripe / Cal.com / Resend
- [ARCHITECTURE.md](ARCHITECTURE.md) — how each service slots into the data flow
- [KNOWN-ISSUES.md](KNOWN-ISSUES.md) — what's still on free tier vs needs a paid upgrade
- `package.json` — authoritative version pins
