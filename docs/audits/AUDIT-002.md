# FORGE FUNNEL SCANNER — ORCHESTRATOR AUDIT REPORT

**Audit ID:** AUDIT-002
**Date:** 2026-03-18
**Triggered by:** Post-fix verification (FIX-0001 through FIX-0005)
**Scope:** Verification audit — confirm AUDIT-001 critical bugs resolved, check for regressions

---

## Build Status

- **TypeScript:** `tsc --noEmit` — zero errors
- **Production build:** `npm run build` — succeeds, all 26 API routes + 4 pages compile
- **No regressions introduced by fixes**

---

## AUDIT-001 Critical Bugs — Resolution Status

| Bug | Fix | Status | Confirmed |
|-----|-----|--------|-----------|
| BUG-1: Screenshot IDs not valid UUIDs | FIX-0001 | **RESOLVED** | `generateScreenshotId()` at line 583 returns `crypto.randomUUID()` |
| BUG-2: URL validation rejects bare domains | FIX-0002 | **RESOLVED** | Zod schema uses `.transform()` → `.pipe()` to normalize before validating |
| BUG-3: SocialConfirmation sends empty email | FIX-0004a + FIX-0004b | **RESOLVED** | Contract: `email?: string`. Backend: optional with `.refine()`. Frontend: email removed from request body |
| BUG-4: Cal.com hardcoded wrong calLink | FIX-0003 | **RESOLVED** | Reads from `NEXT_PUBLIC_CALCOM_EMBED_URL`, strips `https://cal.com/` prefix |

## AUDIT-001 Runtime Issues — Resolution Status

| Issue | Fix | Status |
|-------|-----|--------|
| RUNTIME-4: CapturePrompt before leadId available | FIX-0005 | **RESOLVED** — line 469 now guards on `state.leadId` |
| RUNTIME-1: Pipeline fire-and-forget in serverless | Not yet addressed | **OPEN** — still uses `.catch()` only, no `after()` or `waitUntil()` |
| RUNTIME-2: Supabase migration may not be applied | Not yet addressed | **OPEN** — requires `npx supabase db push` against remote |
| RUNTIME-3: No `page_discovered` SSE events | Not yet addressed | **OPEN** — known gap, no DB mechanism for transient events |

---

## Cross-Agent Contract Alignment

Verified after the FIX-0004 cross-agent fix:

- `contracts/api.ts` line 37: `email?: string` (optional)
- `src/app/api/scan/capture-info/route.ts` line 33: Zod `email` is `.optional()` with `.refine()` requiring either `email` or `socialConfirmation`
- `src/components/scan/SocialConfirmation.tsx`: No `email` field in request body

**All three layers align. No contract mismatches.**

---

## Regression Check

| Check | Result |
|-------|--------|
| TypeScript strict compilation | Pass — zero errors |
| Production build | Pass — all routes compile |
| No unexpected file modifications | Pass — only fix-targeted files + docs changed |
| CapturePrompt with email still works | Pass — email path unchanged, only added leadId guard |
| Cal.com prefill logic intact | Pass — lines 109-113 unchanged, only calLink derivation changed |

---

## Remaining Open Items from AUDIT-001

### Priority 3 — Production reliability (not yet addressed)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | Pipeline fire-and-forget | `src/app/api/scan/start/route.ts:149` | Will be killed on Vercel production |
| 2 | Supabase migration not verified on remote | `supabase/migrations/` | All DB operations fail if not applied |
| 3 | No `page_discovered` SSE events | `src/app/api/scan/status/[id]/route.ts` | Missing progress messages |
| 4 | `middleware.ts` does not exist | — | No auth refresh, no admin route protection |
| 5 | DB mapper functions duplicated across 4 routes | 4 API routes | Maintenance risk |

### Priority 4 — Missing integrations (not yet addressed)

| # | Issue |
|---|-------|
| 6 | Exit detection not built (visibilitychange + beforeunload) |
| 7 | Follow-up trigger never called automatically |
| 8 | Contact scraping not wired to pipeline |
| 9 | PostHog not initialized (key set, no code) |
| 10 | PageSpeed API not integrated (key set, never used) |
| 11 | Booking source not tracked through Cal.com metadata |

### Priority 5 — Missing features (not yet addressed)

| # | Issue |
|---|-------|
| 12 | Admin dashboard is a stub |
| 13 | Admin team scan view is a stub |
| 14 | Message engagement columns missing (delivered/opened/clicked/replied) |
| 15 | Twilio/WhatsApp keys empty |
| 16 | Ad detection (Meta Ad Library, Google Ads Transparency) not built |
| 17 | Hormozi training data not loaded into Sales Agent |

---

## Summary

All 4 critical bugs and 1 runtime issue from AUDIT-001 are resolved and verified. The scan pipeline's critical path is now unblocked: users can enter a URL (with or without protocol), the pipeline generates valid UUIDs for screenshot storage, social confirmation works without requiring email, Cal.com loads the correct booking page, and the CapturePrompt waits for leadId before rendering.

**The app can now attempt a full end-to-end scan.** The next blockers are: (1) verifying the Supabase migration is applied to the remote instance, and (2) the fire-and-forget pipeline pattern which works in dev but will fail on Vercel. These should be the next fix tickets.
