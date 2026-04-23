---
title: Forge Funnel Scanner
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Forge Funnel Scanner

AI-powered funnel audit tool that is **forgewith.ai**'s primary lead-generation machine. A prospect enters a URL, the system captures real screenshots of their website / socials / GBP / ads, Claude Sonnet annotates them with specific issues, generates an optimized blueprint + HTML mockup, then an AI Sales Agent (Hormozi CLOSER-framework) drives them to book a strategy call with Adrián.

> **The one goal:** convert free-scan users into booked strategy calls. Every feature serves that conversion.

## Status

- **Stage:** live, accepting real scans
- **Live domain:** audit.forgedigital.com (Vercel) + chrome.forgewith.ai (Hetzner CDP, Cloudflare tunnel)
- **Current focus:** conversion polish + outreach-driven volume
- **Outstanding tracked work:** `docs/KNOWN-ISSUES.md`, `docs/fixes/FIX-LOG.md`, `../../shared/project-logs/forge-scanner.md`

## Quick start

```bash
# Prereqs: Bun ≥ 1.1, Supabase CLI, Docker (for local Chrome), Node 20+ types
bun install
cp .env.example .env.local          # fill in at minimum: Supabase + Anthropic
bunx supabase start                 # local Postgres + Auth + Storage
bunx supabase db push               # apply migrations
bun run dev                         # Next.js on :3000
```

Minimum keys to get past the homepage: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `BROWSER_WS_ENDPOINT` (or `BROWSERLESS_API_KEY`).

Full setup: **[docs/SETUP.md](docs/SETUP.md)**.

## Key commands

```bash
bun run dev           # Next.js dev server
bun run build         # production build — MUST succeed before ship
bun run lint          # ESLint
bunx tsc --noEmit     # strict TS check — MUST be zero errors
bunx supabase db push # push migrations to remote
```

## Stack — exact versions matter

| Layer | Tech | Version |
|---|---|---|
| Framework | Next.js (App Router) | **16.2.0** |
| UI | React Server Components + `'use client'` | **19.2.4** |
| Typing | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS v4 + CSS variables | 4.x |
| Motion | GSAP + `@gsap/react` | 3.14+ |
| DB / Auth / Storage | Supabase (Postgres + RLS + Buckets) | JS SDK v2 |
| AI | Anthropic SDK (Sonnet 4 + Haiku 3.5) | 0.80+ |
| Browser | `playwright-core` CDP → self-hosted Chrome (Hetzner) | 1.58 |
| Booking | Cal.com `@calcom/embed-react` | 1.5+ |
| Payments | Stripe (team-initiated only) | 20.x |
| Email | Resend | 6.x |
| Analytics | PostHog | 1.36+ |
| Validation | Zod (all API inputs) | 4.x |

Full dependency rationale: **[docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)**.

## Pages

Three public, seven admin.

| Path | Purpose |
|---|---|
| `/` | Landing — URL input hero, brand-accented banner CTA |
| `/scan/[id]` | Results — streams capture → annotations → blueprint → chat, all one page |
| `/offer` | Sales/pricing page |
| `/branding-workbook`, `/offers-workbook` | Gated brand/offer discovery workbooks (EN + ES) |
| `/admin` | Metric dashboard |
| `/admin/leads`, `/admin/scans`, `/admin/payments` | Operational tables |
| `/admin/scan/[id]` | Team scan view — includes in-call Stripe payment form |
| `/admin/setup` | 25-check env health board |
| `/admin/login` | Admin auth gate (Supabase OAuth, allowlist via `ADMIN_EMAILS`) |

## Documentation map

All docs live under `docs/` with YAML frontmatter + `last_reviewed` dates. If a doc contradicts the code, the code wins — open a PR to reconcile.

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — system design, component diagram, data flow, rationale
- **[docs/SETUP.md](docs/SETUP.md)** — dev environment from scratch, env vars, troubleshooting
- **[docs/API.md](docs/API.md)** — every HTTP endpoint with request/response/auth
- **[docs/DATA-MODELS.md](docs/DATA-MODELS.md)** — Supabase schema, enums, RLS, ERD
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel + Hetzner + Supabase prod flow, rollback
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — conventions, commits, PR flow, file ownership
- **[docs/AGENTS.md](docs/AGENTS.md)** — agent roles (Backend, Frontend, AI Engine, Orchestrator/Cody), audit+fix protocol
- **[docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md)** — tech debt, gotchas, intentional tradeoffs
- **[docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)** — third-party services, cost risks, fallbacks
- **[docs/HETZNER-SETUP.md](docs/HETZNER-SETUP.md)** — self-hosted Chrome VPS bring-up
- **[CLAUDE.md](CLAUDE.md)** — agent-facing project instructions (read by Cody/Claude Code)
- **[AGENTS.md](AGENTS.md)** — note about Next.js 16 training-data divergence

Canon (business truth) lives outside the repo at `../../canon/forge-scanner-spec.md` — this repo is the implementation.

## Repo layout

```
forge-scanner/
├── README.md               ← you are here
├── CLAUDE.md               ← Claude Code / Cody project instructions
├── AGENTS.md               ← Next.js 16 divergence note
├── LAUNCH-GUIDE.md         ← historical bootstrap (v1)
├── .env.example            ← annotated env var contract
├── contracts/              ← typescript types shared with all code (do not redefine)
│   ├── types.ts
│   ├── events.ts           ← SSE event shapes
│   └── api.ts              ← request/response shapes
├── src/
│   ├── app/                ← App Router pages + API routes
│   ├── components/         ← React components (landing, scan, chat, admin, shared)
│   ├── lib/
│   │   ├── db/             ← Supabase client, types, mappers, queries
│   │   ├── ai/             ← Anthropic client, annotation, sales agent
│   │   ├── prompts/        ← prompt templates (one per task)
│   │   ├── scanner/        ← orchestrator + 5 stage analyzers + GEO/AEO + ad detection
│   │   ├── screenshots/    ← Playwright CDP client + capture pipeline
│   │   ├── blueprint/      ← funnel map + HTML mockup generator
│   │   ├── followup/       ← email template, send orchestration
│   │   ├── stripe/         ← Stripe client
│   │   ├── rate-limit/     ← DB-backed rate limits
│   │   ├── auth/           ← admin allowlist, session helpers
│   │   ├── vault/          ← write-back to forge-vault (event + queue)
│   │   ├── design-tokens.ts, gsap-presets.ts, api-utils.ts, prescriptions.ts, utils.ts
│   ├── middleware.ts       ← admin auth + CSP/security headers
│   └── styles/             ← global CSS, tokens via @theme inline
├── supabase/
│   ├── migrations/         ← append-only SQL
│   └── config.toml
├── docker/chrome/          ← Playwright image + socat for Hetzner CDP
├── docs/                   ← this directory
└── public/                 ← fonts, og-image, robots, sitemap
```

## Design system

Brand v2 Light Mode. Tokens live in `src/lib/design-tokens.ts` (JS) and as CSS variables in `globals.css`. Animations use `src/lib/gsap-presets.ts` — never raw GSAP, never Framer Motion, never Tailwind `animate-*` on visible elements.

Full visual rules and banned patterns: **[CLAUDE.md](CLAUDE.md)** § Design system. Do not deviate without approval — the scanner IS the portfolio piece.

## Support / escalation

- Bugs / open work → `docs/KNOWN-ISSUES.md` or `docs/fixes/FIX-LOG.md`
- Live status → `../../shared/project-logs/forge-scanner.md`
- Spec questions → `../../canon/forge-scanner-spec.md`

---

*Build the scanner. Execute the outreach. Close founding clients. Deliver results. Build case studies. Raise prices. Move to Dubai.*
