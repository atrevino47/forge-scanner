# FORGE FUNNEL SCANNER — MASTER INSTRUCTIONS

> **Every Claude Code agent reads this file first.** Then reads their specific agent file in `/docs/`.

## What we're building
audit.forgedigital.com — a premium AI-powered funnel scanner. A user enters a URL, the system captures real screenshots of their website/socials/GBP/ads, AI annotates those screenshots with specific issues, generates an optimized blueprint, and an AI Sales Agent drives them to book a strategy call.

Full spec: `/docs/FORGE-FUNNEL-SCANNER-SPEC.md`
Business plan: `/docs/FORGE-BUSINESS-PLAN.md`

## The one goal
Convert free scan users into Forge strategy calls. Every feature serves this conversion.

## Brand direction
- **Colors:** Deep navy (#0B1120) base + warm gold (#D4A537) accent
- **Style:** Glassmorphism — frosted glass, translucent depth, gold glow accents
- **Mode:** Dark mode default. No toggle on public pages.
- **Quality:** $100K feel. Linear/Vercel/Stripe level. Not a side project.
- **Typography:** Distinctive display + clean body. NOT Inter/Roboto/Arial.
- **Animations:** GSAP (ScrollTrigger, Flip, SplitText). NOT Framer Motion. NOT CSS transitions.

## Tech stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui, GSAP
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Auth:** Supabase Auth (Google OAuth — optional, not a gate)
- **Payments:** Stripe Elements (team-initiated during calls)
- **Email:** Resend + React Email
- **SMS:** Twilio
- **WhatsApp:** WhatsApp Business API
- **Scheduling:** Cal.com (embedded modal overlay, never a separate page)
- **AI (analysis + blueprint):** Claude Sonnet 4
- **AI (quick checks):** Claude Haiku 3.5
- **AI (Sales Agent):** Claude Sonnet 4
- **Screenshots:** Browserless.io (primary) / Playwright (fallback)
- **Analytics:** PostHog + Vercel Analytics
- **Hosting:** Vercel
- **i18n:** English only for now (remove next-intl dependency)

## Agent architecture

| Agent | Instruction file | Owns |
|-------|-----------------|------|
| Backend | `docs/AGENT-BACKEND.md` | `/src/app/api/`, `/src/lib/db/`, `/src/lib/auth/`, `/src/lib/screenshots/`, `/src/lib/followup/`, `/supabase/`, `/src/middleware.ts` |
| Frontend | `docs/AGENT-FRONTEND.md` | `/src/app/(pages)/`, `/src/components/`, `/src/styles/`, `/tailwind.config.ts`, `/public/` |
| AI Engine | `docs/AGENT-AI-ENGINE.md` | `/src/lib/ai/`, `/src/lib/prompts/`, `/src/lib/scanner/`, `/src/lib/blueprint/` |

## Rules — ALL agents follow these

### Rule 1: Read your agent file first
Before writing ANY code, read `CLAUDE.md` (this file) then your specific `docs/AGENT-*.md`.

### Rule 2: Contracts are the single source of truth
All shared types live in `/contracts/`. Import from contracts — never define shared types locally. If you need a type change, add a `CONTRACT_REQUEST.md` in your directory.

### Rule 3: Strict file ownership
NEVER modify files outside your owned directories. No exceptions.

### Rule 4: API-first integration
Frontend calls API routes. Frontend never imports from `/src/lib/` directly. Backend exposes data through API contracts. Scanner exposes results through the database + SSE events.

### Rule 5: TypeScript strict mode
All code must pass `tsc --strict`. No `any`. No `@ts-ignore`.

### Rule 6: Copy is placeholder for now
All user-facing text uses `[COPY: description]` format. A dedicated copy phase happens after the product is functional. Exception: loading state messages can be real ("Capturing your homepage...") because they're functional UX.

### Rule 7: Error handling everywhere
Every API route validates with Zod. Every async has try/catch. Every error state has a user-friendly message.

### Rule 8: GSAP, not Framer Motion
All animations use GSAP with `@gsap/react`. Use proper context cleanup in React effects. ScrollTrigger for scroll-based, Timeline for sequenced, SplitText for text reveals.

### Rule 9: Screenshots go in Supabase Storage
All captured screenshots stored at `screenshots/{scanId}/{screenshotId}.png` in Supabase Storage. Public URLs used for display. Never store base64 in the database.

### Rule 10: Cal.com is always a modal
Every Cal.com trigger opens an overlay on the current page. User never navigates away from results.

### Rule 11: Root cause fixes only
Every fix must address the underlying cause, not the symptom. No temporary workarounds, no band-aids. If the root cause is unclear, investigate deeper before writing code. A fix that silences an error without understanding why it happens is not a fix.

## Pages
```
/                      → Landing page
/scan/[id]             → Results page (scan + results + blueprint + chat — all in one)
/admin                 → Admin dashboard
/admin/scan/[id]       → Team scan view (for calls + Stripe payments)
```

## Key commands
```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint
npm run type-check    # TypeScript strict
npx supabase start    # Local Supabase
npx supabase db push  # Push migrations
```
