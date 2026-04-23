---
title: Setup
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Setup

Get a dev copy of the scanner running locally, from zero to "I can run a full scan."

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Bun** | ≥ 1.1 | package manager + runtime. `npm` / `pnpm` are not supported |
| **Node** | ≥ 20 (types only) | some tooling reads Node types; Bun does the execution |
| **Supabase CLI** | ≥ 2.81 | local Postgres + Auth + Storage + migration push |
| **Docker** | any recent | required if you want to run headless Chrome locally (otherwise set `BROWSERLESS_API_KEY` and skip) |
| **git** | — | standard |

macOS install shortcut:

```bash
brew install oven-sh/bun/bun
brew install supabase/tap/supabase
brew install --cask docker
```

## 1. Clone + install

This repo lives inside `forge-vault/projects/` as a nested git repo. Work from its root:

```bash
cd forge-vault/projects/forge-scanner
bun install
```

Note: `node_modules/` is ~300 MB (Playwright + friends). `.next/` caches aggressively; delete if you hit weird build errors.

## 2. Environment variables

Copy the template and fill in values:

```bash
cp .env.example .env.local
```

The file is annotated with which keys are required vs optional vs feature-gated. Minimum to get past the homepage:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — treat as a secret, never ship to client |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `BROWSER_WS_ENDPOINT` | prod: `wss://chrome.forgewith.ai`; local: see §4 |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev |
| `NEXT_PUBLIC_CALCOM_EMBED_URL` | your Cal.com event URL (e.g. `https://cal.com/<you>/strategy-call`) |
| `RESEND_API_KEY` | resend.com → API Keys (only if testing email sends) |
| `ADMIN_EMAILS` | comma-separated; grants `/admin/*` access |

Feature-gated keys (the app degrades gracefully without them):

- `GOOGLE_PAGESPEED_API_KEY` — PageSpeed signals on landing stage
- `GOOGLE_PLACES_API_KEY` — GBP detection + capture
- `FACEBOOK_APP_ACCESS_TOKEN` — Meta Ad Library
- `APIFY_API_TOKEN` — Instagram/TikTok/FB/Maps enrichment
- `STRIPE_*` — team-initiated payments
- `CALCOM_API_KEY`, `CALCOM_WEBHOOK_SECRET` — webhook verification
- `TWILIO_*`, `WHATSAPP_*` — multi-channel follow-up (not yet wired)
- `CRON_SECRET` — protects `/api/cron/*`; set before deploying

## 3. Supabase — local or remote

### Option A: local (recommended for dev)

```bash
bunx supabase start     # spins up Postgres + GoTrue + Storage on Docker
bunx supabase db push   # applies every migration in supabase/migrations/
```

Local dashboard is at `http://127.0.0.1:54323`. The `supabase start` output prints API URL and anon/service keys — drop them into `.env.local`.

### Option B: remote Supabase project

```bash
bunx supabase link --project-ref <ref>
bunx supabase db push
```

For a remote project you also need `supabase/config.toml` to match your auth providers. Google OAuth must be enabled for the "save results" soft prompt to work end-to-end.

### Seed data

There is no seed script — the pipeline creates its own rows. If you want test data, run a real scan against `https://example.com`.

## 4. Browser endpoint

The scanner needs a Chrome CDP websocket. Two options:

### Option A — local Chrome via Docker (fully local dev)

```bash
cd docker/chrome
docker compose up -d     # builds Playwright chromium image + socat bridge
curl http://localhost:9222/json/version   # should return Browser info
```

Then in `.env.local`:

```
BROWSER_WS_ENDPOINT=ws://localhost:9222
```

### Option B — prod Hetzner CDP (quick dev, matches prod)

Set `BROWSER_WS_ENDPOINT=wss://chrome.forgewith.ai` in `.env.local`. You're sharing the production Chrome; be considerate — tight loops will compete with live scans.

### Option C — Browserless fallback

Set `BROWSERLESS_API_KEY` and leave `BROWSER_WS_ENDPOINT` empty. Pipeline auto-falls-back.

## 5. First run

```bash
bun run dev
open http://localhost:3000
```

- Enter a URL (`example.com` works, bare domains are accepted — validator adds `https://`)
- You should redirect to `/scan/<uuid>`
- Watch `ProgressIndicator` stream updates
- ~15 s in, `CapturePrompt` slides up for email + phone
- After all 5 stages, `FunnelHealthSummary` + `BlueprintCTA` render

Hit `/admin/setup` once signed in (Supabase OAuth → email in `ADMIN_EMAILS`) to run the 25-check env health board.

## 6. Common dev tasks

```bash
bun run dev               # hot-reload dev server
bun run build             # production build; MUST succeed before PR
bun run lint              # ESLint (eslint-config-next 16)
bunx tsc --noEmit         # strict TS check; MUST be zero errors
bunx supabase db diff -f <name>   # generate a new migration from local schema changes
bunx supabase db push     # push migrations to remote
bunx supabase db reset    # nuke + replay migrations (local only)
```

### Running a single API route manually

```bash
curl -sX POST http://localhost:3000/api/scan/start \
  -H 'content-type: application/json' \
  -d '{"url":"example.com"}' | jq
```

### Watching the SSE stream

```bash
curl -N http://localhost:3000/api/scan/status/<scanId>
```

### Triggering follow-up cron locally

```bash
curl -H "authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/followup-sender
```

### Admin sign-in for local dev

1. Start Supabase locally (Option A above).
2. Go to `http://localhost:3000/admin/login`.
3. Sign in with a Google account whose email is listed in `ADMIN_EMAILS`.
4. Local Supabase needs Google OAuth configured in `supabase/config.toml` — or use the inbucket email-link flow on the dashboard for quick access.

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Failed to create lead` at scan start | Supabase not reachable / wrong service key | re-copy service role key; check `supabase status` |
| SSE hangs / no events | pipeline crashed silently OR browser endpoint wrong | check Vercel/`bun run dev` terminal for `[scan/start] Pipeline failed` + verify `BROWSER_WS_ENDPOINT` |
| `Invalid URL` rejecting bare domains | you're on a stale build | `rm -rf .next && bun run dev` |
| Screenshots missing carousel content | known parked issue (FIX-0012) | see `KNOWN-ISSUES.md` |
| Annotation dots at (0,0) | AI returned malformed JSON — parser fallback | check logs, check `ANTHROPIC_API_KEY` validity |
| `/admin/*` redirects in a loop | your email isn't in `ADMIN_EMAILS` | add it and restart dev server |
| Cal.com modal opens to wrong event | `NEXT_PUBLIC_CALCOM_EMBED_URL` is stale | update; restart |
| Webhooks not verifying | `STRIPE_WEBHOOK_SECRET` / `CALCOM_WEBHOOK_SECRET` unset | set in `.env.local`; for Stripe use `stripe listen --forward-to localhost:3000/api/payments/webhook` |
| Type errors after a pull | stale `.next/types` | `rm -rf .next && bunx tsc --noEmit` |
| Playwright CDP connect timeout | Docker Chrome not healthy | `docker compose ps` in `docker/chrome/` — restart if not "healthy" |
| "Module not found @/contracts/…" | path alias missing | contracts live at repo root; import as `@/../contracts/types` (unusual but intentional — see `tsconfig.json` paths) |

## 8. Resetting to a clean state

```bash
rm -rf .next node_modules
bun install
bunx supabase db reset       # LOCAL ONLY — nukes all rows
bun run dev
```

## Related

- `../.env.example` — the canonical env contract
- [DEPLOYMENT.md](DEPLOYMENT.md) — production bring-up
- [HETZNER-SETUP.md](HETZNER-SETUP.md) — the Chrome VPS if you're standing up your own
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the pieces fit
