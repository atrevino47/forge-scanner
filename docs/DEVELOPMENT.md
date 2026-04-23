---
title: Development
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Development

Conventions, commit style, PR flow, and file-ownership rules for anyone (human or agent) touching this repo.

## Principles — not negotiable

1. **Root cause or no fix.** If you don't understand why a bug happens, do not write code. Investigate until you can name the root cause in one sentence.
2. **Zero TS errors at all times.** `bunx tsc --noEmit` must pass after every change. No `any`, no `@ts-ignore`, no `@ts-expect-error`.
3. **Zod at every API boundary.** No exceptions, including webhooks and cron.
4. **Contracts are the only shared vocabulary.** If a type is used across agent boundaries (FE, BE, AI), it lives in `contracts/`. Agents do not redefine contract types locally.
5. **Frontend never imports from `src/lib/db/`.** It fetches from API routes.
6. **Commits reflect intent.** Format: `[<agent>] <type>: <description>`. Types: `decide / execute / propose / fix / learn / compile / audit / ops / feat / docs`. Hook at `.githooks/commit-msg` will reject malformed commits.
7. **No silent edits.** If it was worth changing, it was worth committing. Prefer small semantic commits over one large bundle.

## Directory ownership

Enforced informally by history, intent-ally by audit tooling (and occasional reviews). Keep edits inside your lane.

| Agent | Owns | Off-limits |
|---|---|---|
| **Backend** | `src/app/api/**`, `src/lib/db/**`, `src/lib/screenshots/**`, `src/lib/followup/**`, `src/lib/stripe/**`, `src/lib/rate-limit/**`, `src/lib/auth/**`, `src/lib/vault/**`, `src/middleware.ts`, `next.config.ts`, `supabase/**` | `src/components/**`, `src/lib/ai/**`, `src/lib/prompts/**`, `src/lib/scanner/**`, `src/lib/blueprint/**`, `contracts/**` |
| **Frontend** | `src/app/*/page.tsx`, `src/app/layout.tsx`, `src/components/**`, `src/styles/**`, `src/lib/design-tokens.ts`, `src/lib/gsap-presets.ts`, `public/**` | `src/app/api/**`, `src/lib/db/**`, `src/lib/screenshots/**`, `src/lib/ai/**`, `src/lib/prompts/**`, `contracts/**` |
| **AI Engine** | `src/lib/ai/**`, `src/lib/prompts/**`, `src/lib/scanner/**`, `src/lib/blueprint/**`, `src/lib/prescriptions.ts` | `src/app/api/**`, `src/components/**`, `src/lib/db/**`, `src/lib/screenshots/**`, `contracts/**` |
| **Orchestrator (Cody)** | `contracts/**`, `docs/**`, top-level `.env.example`, audit/fix tickets | everything else (delegate via fix tickets) |

Contract changes ripple — do them first, then the producer side (Backend), then the consumer side (Frontend / AI).

## Coding conventions

### TypeScript

- `strict: true`, target `ES2017`, module `esnext`, bundler resolution. See `tsconfig.json`.
- Path alias: `@/*` → `src/*`. Contracts live at repo root; import as `@/../contracts/types`, `@/../contracts/api`, `@/../contracts/events`.
- Prefer narrow types to broad. Prefer discriminated unions (e.g. `ScanSSEEvent`) to type-asserted bags.
- All AI JSON parsing wrapped in `try/catch` with a sane fallback value.

### React / Next.js

- App Router only. Server Components by default, `'use client'` only when you need interactivity (useState / effects / refs).
- Use `after()` from `next/server` for any post-response background work. Never `waitUntil`, never fire-and-forget.
- `next/image` for every image. `remotePatterns` in `next.config.ts` already whitelists Supabase.
- Dynamic imports for heavy third-party components (Cal.com, Stripe Elements, chat UI).

### Styling

- Tailwind CSS v4 via `@theme inline` in `globals.css`. There is no `tailwind.config.ts` — tokens live in the CSS file.
- JS-side tokens via `src/lib/design-tokens.ts`. Components reference `t.color.*`, `t.font.*`, etc. — not raw hex.
- Typography: `font-display` (Outfit), `font-body` (Space Grotesk), `font-mono` (JetBrains Mono). Never system fonts for display.

### Animation

- GSAP only. Import from `src/lib/gsap-presets.ts` (`fadeSlideUp`, `scaleIn`, `clipReveal`, `fadeSlideRight`, `scaleOut`, `popIn`).
- `useGSAP` hook with a scoped ref. Register plugins once in `GSAPProvider`.
- Stagger 100–200 ms between sequential elements.
- Document every animation sequence with an inline beat comment:

```tsx
/* ANIMATION SEQUENCE:
 * Beat 1 (0.00s): Badge — fadeSlideUp
 * Beat 2 (0.15s): Headline — clipReveal
 * Beat 3 (0.30s): Cards — scaleIn, 120ms stagger
 */
```

Respect `prefers-reduced-motion`.

### Errors

- API returns `{ error: { code, message, details? } }` via `apiError()` in `src/lib/api-utils.ts`.
- Codes: `RATE_LIMITED, INVALID_INPUT, NOT_FOUND, UNAUTHORIZED, INTERNAL`.
- User-facing `message` is friendly; dev-only context goes in `details` behind `NODE_ENV === 'development'`.

### Secrets

- Never inline a secret in a command or log statement.
- Set via Vercel UI (prod) or `.env.local` (dev). Pre-commit gitleaks will catch most.
- Rotate immediately if one leaks (see CLAUDE.md § Secret hygiene for the steps).

## Adding things — quick recipes

### Adding an API route

1. Define request / response in `contracts/api.ts`.
2. Create `src/app/api/<group>/<name>/route.ts`.
3. Validate with Zod against `*Request` type.
4. Use `createServiceClient()` from `src/lib/db/client` for service-role DB access.
5. Map DB rows via `src/lib/db/mappers.ts` before returning.
6. Use `apiError()` for non-2xx.
7. Document in `docs/API.md` (this PR).

### Adding an enum or column

1. `bunx supabase migration new <slug>`.
2. Edit the migration.
3. `bunx supabase db reset` locally to test the replay.
4. Update `src/lib/db/types.ts` (snake_case row type).
5. Update `contracts/types.ts` (camelCase, if cross-boundary).
6. Update `src/lib/db/mappers.ts` if the mapping changes.
7. `bunx supabase db push` to remote — in the same PR as the code change, not separately.

### Adding an SSE event

1. Extend `ScanSSEEvent` / `ChatSSEEvent` in `contracts/events.ts` with a new `type` discriminator + payload.
2. Emit from the route (`/api/scan/status/[id]` or `/api/chat/stream/[convId]`).
3. Handle in the frontend consumer (narrow on `type`).
4. Document in `docs/API.md` under the right SSE section.

### Adding a component

1. Decide: shared (`src/components/shared/`), domain-scoped (`landing/`, `scan/`, `chat/`, `admin/`), or provider (`providers/`).
2. Default Server Component unless you need interactivity. If client, `'use client'` at the top.
3. Use design tokens + GSAP presets. No new hex colors, no new animation APIs.
4. Keep it presentational — data comes from API routes, not direct DB access.

### Adding a prompt

1. New file in `src/lib/prompts/`.
2. Export a builder function that takes structured inputs and returns a string.
3. Include a JSON schema block in the prompt when the model must emit structured data.
4. Consumer wraps the output parse in `try/catch` with a typed fallback.

## Commits

Enforced by `.githooks/commit-msg`. Format:

```
[<agent>] <type>: <description>
```

- `<agent>`: `kova`, `cody`, or any other registered agent (lowercase).
- `<type>`: `decide | execute | propose | fix | learn | compile | audit | ops | feat | docs`.
- `<description>`: imperative, lowercase, concrete.

Example:

```
[cody] fix: FIX-0042 — use after() in blueprint route so pipeline survives
```

Every tangible artifact gets a commit. Every fix ticket references its `FIX-NNNN` in the body.

## Branches + PRs

- Work on `claude/<slug>` or `feat/<slug>` branches.
- Never merge into `main` directly — always a PR.
- Pre-PR checklist:
  - [ ] `bunx tsc --noEmit` — zero errors
  - [ ] `bun run build` — green
  - [ ] `bun run lint` — green
  - [ ] Migration (if any) tested with `supabase db reset`
  - [ ] API changes reflected in `docs/API.md`
  - [ ] Schema changes reflected in `docs/DATA-MODELS.md`
  - [ ] Intentional tradeoffs noted in `docs/KNOWN-ISSUES.md` if they're tradeoffs

PRs are small and specific. If it can be split, split it.

## Audit + fix ticket flow

See [AGENTS.md](AGENTS.md) § Audit + fix system for the full protocol. TL;DR:

- Orchestrator (Cody / Kova) writes audits to `docs/audits/AUDIT-{NNN}.md`.
- Every fix gets a row in `docs/fixes/FIX-LOG.md` + a ticket at `docs/fixes/FIX-{NNNN}.md`.
- Owning agent applies the fix in its lane, per the ticket.
- Orchestrator verifies (`tsc`, read-modified-file, scope check, contract check).
- `FIX-LOG.md` `Verified` column updated (`yes / partial / failed / superseded`).
- Two failures on the same subsystem → stop fix-by-fix, propose an architectural change.

## Testing

This repo currently has no automated test suite. Verification is:

- `bunx tsc --noEmit` — types.
- `bun run build` — static checks + production build.
- Manual smoke test against `example.com` for any change touching the pipeline.
- `/admin/setup` health board for ops checks.
- Dogfood: `bun run dev` + scan your own URL + walk the flow.

If / when we add tests: they go at `tests/` at the repo root, split by layer. Pipeline tests need a mock browser endpoint (not the real Hetzner). Prefer contract tests over unit tests for anything crossing a subsystem boundary.

## Performance targets

- Landing page Lighthouse **90+** (performance, best practices, SEO).
- Scan start latency: `POST /api/scan/start` returns in **< 500 ms** p95 (serverless cold-start is the main risk).
- First SSE event on `/scan/:id`: **< 3 s** after page load.
- First screenshot visible: **< 15 s**.
- Full scan complete: **30–90 s** depending on inner pages + social profiles captured.

## Quality gates

- No `console.log` in production code without a `[module]` prefix — we grep for `[scan/` etc. in logs.
- No TODO comments without a FIX ticket reference.
- No dead code. If a component was superseded (e.g. the PLAN-0002 redesign orphaned the old annotation components), delete it in the same PR that replaced it.

## Related

- [AGENTS.md](AGENTS.md) — agent roles + audit/fix protocol
- [ARCHITECTURE.md](ARCHITECTURE.md) — what each module is responsible for
- [API.md](API.md) — endpoint contracts
- [DATA-MODELS.md](DATA-MODELS.md) — schema + migration rules
- [KNOWN-ISSUES.md](KNOWN-ISSUES.md) — debt + intentional tradeoffs
- Project-level rules: `../CLAUDE.md`
