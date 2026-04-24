---
title: Forge Scanner Changelog
domain: scanner
status: active
last_reviewed: 2026-04-24
---

# Changelog

All notable changes to the Forge Funnel Scanner. Newest first. Commit hashes reference the `forge-vault` monorepo (scanner lives under `projects/forge-scanner/`).

Convention: each entry is tied to a feature branch (e.g. `feat/storytelling-experience`) and lists the semantic commits that landed. Scope-breaking changes call out migration / rollback paths. Commit format enforced by `.githooks/commit-msg`: `[kova] type: description`.

---

## [unreleased] — `feat/storytelling-experience` (2026-04-23 → 2026-04-24)

Blueprint redesign: HTML mockup → industry-ideal funnel diagram. Prompt layer rewritten for Hormozi grounding + industry-agnostic templating. Voice agent (Vega) scaffolded on ElevenLabs. All `tsc --noEmit` green on landing.

### Added

- **Blueprint diagram (React Flow)** — `BlueprintData.diagram` surface replaces HTML mockup as the primary Blueprint render. JSON-first: nodes + edges + Grand Slam checklist + outcome guarantee + objection FAQ + locked primary CTA. Legacy HTML mockup path retained as graceful fallback.
  - Contract: `contracts/types.ts` — `BlueprintDiagram`, `DiagramNode`, `DiagramEdge`, `GrandSlamChecklistItem`, `OutcomeGuarantee`, `ObjectionFaqEntry`, `BlueprintPrimaryCta`, `MoneyModelLayerKey`, `DiagramStageCategory`, `GrandSlamStep`.
  - Prompt: `src/lib/prompts/blueprint-diagram.ts` (replaces `mockup.ts` output semantics; `mockup.ts` still callable during rollout).
  - Component: `src/components/scan/FunnelDiagram.client.tsx` — `@xyflow/react` 12.10.2, LTR desktop / TTB <768px, critical-upgrade accent ring, dashed border for missing-in-prospect nodes, `role="img"` + aria-label, reduced-motion disables wheel-zoom.
  - Commits: `3cbb53c`, `ba36a85`, `ddeff44`.
- **Industry detector** — runs once per scan, feeds `{industry_slug, industry_display, customer_role_singular, customer_role_plural, typical_avg_ticket_usd}` into downstream prompts so every Blueprint is industry-agnostic via template slots, not hardcoded med-spa examples. Confidence < 0.6 → consumers fall back to "your industry".
  - Contract: `IndustryDetection` in `contracts/types.ts`.
  - Prompt: `src/lib/prompts/industry-detector.ts`.
  - Commit: `c579931`.
- **Teaser finding** — capture-gate unlock preview. One highest-impact finding + $ range shown before full results render ("Finding 1 of 17: $X – see the other 16").
  - Contract: `TeaserFinding`.
  - Prompt: `src/lib/prompts/teaser-finding.ts`.
  - Commit: `380ef4b`. (SSE wire pending — see Follow-ons.)
- **Money Model 4-layer diagnosis** — funnel map now emits `money_model: { layers[4], biggest_leak_key, biggest_leak_callout }` (attraction / front_end_cash / upsell_downsell / continuity) orthogonal to stage nodes, plus `total_leak_12mo: { min_usd, max_usd, display }`. Exactly one layer flagged `is_biggest: true`.
  - Contract: `MoneyModelDiagnosis`, `MoneyModelLayer`, `TotalLeak12mo`.
  - Commit: `2618324`.
- **Structured stage findings** — `StageFinding` now carries `situation / complication / cost / fix` blocks for v2 Story Chapter UI. Legacy `detail` string retained for SSE v1 back-compat.
  - Contract: `FindingSituation`, `FindingComplication`, `FindingCost`, `FindingFix`.
  - `ValueEquationLever` extended with `'Multiple'`.
  - Commit: `9423d44`.
- **MoneyModelCard** rendered above FunnelDiagram in `BlueprintView` (v2 surface). Commit: `ddeff44`.
- **Vega voice config** — ElevenLabs Conversational AI scaffold at `src/lib/voice/vega-voice-config.ts`. Declares `VEGA_TOOLS` (`get_scan_summary`, `get_biggest_leak`, `get_cal_url`) for webhook + dashboard name agreement. Default voice `EXAVITQu4vr4xnSDxMaL` (Sarah), env-swappable. Text fallback when env missing.
  - Env vars: `ELEVENLABS_AGENT_ID`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `VEGA_LLM_MODEL`, `VEGA_MAX_SESSION_MINUTES`.
  - Commit: `9599fbe`.
- **Pre-commit hook** (`.githooks/pre-commit`) — blocks fabricated strings (ex-Shopify, Playbook v2.1, med-spa defaults) and canon-tier leaks from entering the repo. One-time activation: `git config core.hooksPath .githooks`. Commit: `4531cbd`.
- **Global `prefers-reduced-motion` override** — `globals.css` kills CSS animations + transitions. Commit: `30c013e`.
- **Landing FAQ Q2** — "How is this different from a generic website audit?" (Value Equation + Money Model framing). Commit: `e2840a3`.

### Changed

- **`BlueprintView` rebuilt as diagram-first** — `DiagramHeader` → `MoneyModelCard` → `GrandSlamChecklist` → `FunnelDiagram` → `OutcomeGuaranteeCard` → `ObjectionFaqList` → `PrimaryCta`. No iframe, no `srcDoc`, no XSS surface. Legacy accordion preserved as fallback when `blueprint.diagram` is null. Commit: `f1dc1ad`.
- **Blueprint API** (`/api/blueprint/generate/[scanId]`) — runs legacy HTML mockup AND new diagram generator in parallel. Diagram persisted under `blueprints.funnel_map.__blueprint_diagram__` (JSONB piggyback; dedicated column migration deferred). Graceful fallback on parse failure. Commit: `ddeff44`.
- **Sales agent system prompt** (`src/lib/prompts/sales-agent-system.ts`) — Vega named explicitly; stripped fabricated food-business proof point; embedded Adrian-locked Blueprint CTA subtext as canonical booking ask. Commit: `260744b`.
- **`funnel-map.ts` prompt** — emits 4-layer money model + total leak 12mo; orthogonality rules added so layer diagnosis doesn't double-count stage findings. Commit: `2618324`.
- **FAQ accordion + CapturePrompt a11y** — `aria-expanded` / `aria-controls` binding, focus-visible ring, min-h-11 tap target, dialog role + `aria-modal` + labelledby/describedby, 44×44 dismiss. Commit: `e2840a3`.

### Fixed

- **`pipeline.ts` tsc** — `platformToSourceType` narrows to mapped keys; clears pre-existing `DetectedSocials` drift. Commit: `e51f7b4`.
- **XSS primitive deleted** — `designs/claude-design-2026-04-23/project/design-canvas.jsx` and host HTML accepted any-origin postMessage payloads and wrote DOM from them. 757 lines removed, no functional loss (design reference material only). Commit: `3b2cd94`.

### Locked copy (contract-enforced)

- Blueprint primary CTA button label: `'Book a call'` (literal TS type).
- Blueprint primary CTA button subtext: `'If you want this personalized sales funnel implemented in your business, book a call.'` (literal TS type). Adrian 2026-04-23 21:45. Any drift breaks `tsc`.

### Deferred / follow-ons (not blocking demo)

1. **Industry-detector pipeline wire** — run once per scan ahead of annotations, cache on `scans` row, feed into `generateBlueprintDiagram`. Currently passes `null` → prompt uses generic "your industry" phrasing.
2. **Teaser-finding SSE wire** — emit `teaser_ready` SSE event after annotations complete; render in `CapturePrompt`. Requires `ScanSSEEvent` union extension.
3. **Vega voice UI mount** — ElevenLabs React widget on Blueprint page + `/api/voice/vega-tool-webhook` handler for tool invocations.
4. **Dedicated `diagram JSONB` column migration** — promote from `funnel_map.__blueprint_diagram__` piggyback. `ALTER TABLE blueprints ADD COLUMN diagram JSONB;` + migrate existing rows + update mapper.
5. **Fixture test harness** — Zod fixture tests for new contracts (no test runner configured; bootstrap `bun:test`).
6. **Results-page MoneyModelCard** — spec placed it on Results Overview tab, not just Blueprint. Threading `funnelMap` into `AuditOverview` deferred to keep scope small.
7. **`mockup.ts` deletion** — swap `getMockupPrompt` caller in `src/lib/blueprint/mockup-generator.ts` to `blueprint-diagram.ts` exclusively, delete `mockup.ts`.
8. **SSE event rename** — `mockup_ready` → `blueprint_ready`; `teaser_ready` new event.
9. **`ScanResult.mockupTarget` → `blueprintTarget`** field rename.

### Open questions (unblocking downstream, not demo)

- Results-page Give-Two-Pick-One: cut or replace? (Rec: cut; Blueprint CTA is secondary path.)
- Vega chat G2P1 fallback at msg ≥5: cut or replace? (Rec: single-CTA Book.)
- ElevenLabs `voice_id`: default Sarah `EXAVITQu4vr4xnSDxMaL` unless Adrian picks.
- Landing sample-finding format: stylized placeholder?
- Landing "~90 seconds" claim: hedge to "about 90 seconds" or drop until measured?

### Rollback path

Revert in reverse order. `ddeff44` rollback restores pre-diagram Blueprint render; no schema change, no migration executed, JSONB piggyback absence is handled (`diagram === undefined` falls back to legacy funnel-map render automatically).

---

## [v0.9.x] — Pre-redesign (`main`, up to 2026-04-23)

See `git log main` for full pre-redesign history. Representative milestones:

- `f8573f3` — README refresh.
- `dd16af2` — architecture doc split into `docs/ARCHITECTURE.md`.
- `ae45446 / f622859 / 901ae07 / a1790dc` — setup / deployment / data-models / API reference docs bootstrapped.
- `b936a07` — known-issues registry.
- `b08cc64` — dependencies doc with cost/risk rationale.
- `fe28b3d / 768ccfe` — development + agents playbooks.
- `9dce71a / b368f3b` — Apify YouTube + Twitter scraper integration.
- `06d11dc` — apify integration docs.
- `819390d` — Hormozi-grounded rewrite of scanner AI analysis prompts (v1 pass; v2 in unreleased branch).
- `bbe5e7b` — dep baseline audit (1 HIGH, 2 moderate, 4 unused runtime deps).
- Security / hygiene pass: SSRF denylist for private IPs + metadata hosts (`7837899`); `/api/test-screenshot` gated to non-prod (`3063931`); URL+leadId scrubbed from logs (`1d71f4a`); `/api/admin/team` POST/PUT/DELETE return 501 stubs (`b6a5778`); `/api/cron/rate-limit-purge` + vercel.json cron (`14a5d00`); dead `/api/cron/nurture-sender` deleted (`9dce785`); `NEXT_PUBLIC_CALCOM_EMBED_URL` hoisted to module const (`8a6b3f3`).
- `04db493` — **revert** of an earlier storytelling experience (PLAN-0004). Current `feat/storytelling-experience` branch is the clean re-attempt building on the prompt + diagram rework.

---

## Versioning

Semantic commits drive the changelog; a formal VERSION bump happens when the redesign branch squash-merges to main. Target cut: after Adrian's visual QA on the Blueprint diagram surface + one follow-on Minion closes the industry-detector wire and teaser SSE event.
