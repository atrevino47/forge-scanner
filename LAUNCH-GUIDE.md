# FORGE FUNNEL SCANNER — LAUNCH GUIDE

## What's in this folder

```
forge-scanner/
├── CLAUDE.md                      # Master instructions (every agent reads this first)
├── init.sh                        # Run this FIRST to bootstrap the Next.js project
├── contracts/
│   ├── index.ts                   # Barrel export
│   ├── types.ts                   # All shared TypeScript types
│   ├── events.ts                  # SSE event types
│   └── api.ts                     # API request/response contracts
├── docs/
│   ├── AGENT-BACKEND.md           # Backend agent instructions
│   ├── AGENT-FRONTEND.md          # Frontend agent instructions
│   ├── AGENT-AI-ENGINE.md         # AI Engine agent instructions
│   ├── FORGE-FUNNEL-SCANNER-SPEC.md  # Full product spec
│   └── FORGE-BUSINESS-PLAN.md     # Business strategy
└── LAUNCH-GUIDE.md                # This file
```

## Step 1: Initialize the project

```bash
chmod +x init.sh
./init.sh
```

This creates the Next.js project, installs all dependencies, and sets up the directory structure.

**IMPORTANT:** `create-next-app` will create a new `forge-scanner/` directory inside your current directory. After it runs, copy CLAUDE.md, contracts/, and docs/ INTO the new project:

```bash
cp CLAUDE.md forge-scanner/
cp -r contracts/ forge-scanner/
cp -r docs/ forge-scanner/
```

## Step 2: Configure environment

```bash
cd forge-scanner
# Edit .env.local with your API keys
```

Minimum keys needed to start development:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- Everything else can be added as you reach those features

## Step 3: Start Supabase locally

```bash
npx supabase start
```

This gives you a local Postgres + Auth + Storage instance.

## Step 4: Launch agents

Open 3 terminal windows. Run one agent per terminal.

**Terminal 1 — Backend Agent:**
```bash
claude --dangerously-skip-permissions -p "Read CLAUDE.md then docs/AGENT-BACKEND.md. Execute Phase 1: Create the Supabase migration with the full schema from docs/FORGE-FUNNEL-SCANNER-SPEC.md Section 15.2. Set up Supabase Auth with Google OAuth. Create all API route stubs with Zod validation returning mock data."
```

**Terminal 2 — Frontend Agent:**
```bash
claude --dangerously-skip-permissions -p "Read CLAUDE.md then docs/AGENT-FRONTEND.md. Execute Phase 1: Set up root layout with dark mode, Forge brand tokens, and font loading. Build the always-visible top banner CTA (Aupale Vodka style). Build the landing page with URL input hero, GSAP text split animation, and scroll-triggered sections below the fold. Set up routing skeleton for /scan/[id] and /admin pages."
```

**Terminal 3 — AI Engine Agent:**
```bash
claude --dangerously-skip-permissions -p "Read CLAUDE.md then docs/AGENT-AI-ENGINE.md. Execute Phase 1: Create the Anthropic API client with Sonnet/Haiku routing and vision support. Create annotation prompts for all 5 funnel stages. Create the stage orchestrator that runs all stages in parallel. Create the video analysis module."
```

## Phase execution order

**Phase 1 (Week 1) — Foundation: All 3 agents run in PARALLEL**
- Backend: DB schema + auth + API stubs
- Frontend: Layout + landing page + routing
- AI Engine: API client + annotation prompts + orchestrator

**Phase 2 (Week 2) — Scan Pipeline: All 3 run in PARALLEL**
- Backend: Browserless integration + screenshot pipeline + SSE streaming
- Frontend: Results page + progressive capture + screenshot cards + annotation rendering
- AI Engine: Stage analysis logic + video analysis + annotation testing

**Phase 3 (Week 3) — Integration: SEQUENTIAL (one agent at a time)**
- Wire Frontend → Backend SSE → AI Engine annotations end-to-end
- Then: Blueprint generator + AI Sales Agent + Cal.com modal + Stripe

**Phase 4 (Week 4) — Follow-up + Admin: PARALLEL**
- Backend: Email/SMS/WhatsApp + contact scraping + cron jobs + admin API
- Frontend: Chat UI + admin panel + GSAP polish + mobile
- AI Engine: Sales Agent testing + follow-up content + prompt tuning

**Phase 5 (Week 5) — Copy + Launch Prep**
- Dedicated copy phase (replace all [COPY: ...] placeholders)
- Sales Agent training with Hormozi transcripts
- QA + cross-browser + mobile testing

**Phase 6 (Week 6) — Deploy**
- Vercel production + custom domain + analytics
- First 50 scans for outreach portfolio
- Begin outreach

## Gotchas from v1 (don't repeat these)

1. **`create-next-app` wipes the `.claude/` folder** — reinstall Claude Code skills after init
2. **Run agents with `--dangerously-skip-permissions`** flag for unattended execution
3. **SSE streaming is the trickiest integration seam** — test early and often
4. **Phases 1-2 are parallel, Phase 3 is sequential** — don't try to wire integration while agents are still building their pieces
5. **GSAP context cleanup is critical in Next.js** — always use `useGSAP` hook with scope ref, never raw `useEffect`

## Key files to check progress

After Phase 1, verify:
- `supabase/migrations/` has the schema
- `src/app/api/scan/start/route.ts` exists with Zod validation
- `src/app/page.tsx` renders the landing page
- `src/lib/ai/client.ts` has Sonnet/Haiku routing working
- `contracts/` types are being imported correctly across agents
