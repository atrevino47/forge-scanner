# FORGE FUNNEL SCANNER — FIX LOG

Tracks every fix applied to the codebase. The Orchestrator creates fix tickets and logs rows here.
The owning agent (Backend, Frontend, AI Engine) applies the fix. The Orchestrator verifies.

## Format

| Fix ID | Date | Audit Ref | Assigned To | Ticket | File(s) | Issue | Verified |
|--------|------|-----------|-------------|--------|---------|-------|----------|

## Fixes

| Fix ID | Date | Audit Ref | Assigned To | Ticket | File(s) | Issue | Verified |
|--------|------|-----------|-------------|--------|---------|-------|----------|
| FIX-0001 | 2026-03-18 | AUDIT-001 BUG-1 | Backend | [FIX-0001](FIX-0001.md) | `src/lib/screenshots/pipeline.ts` | Screenshot IDs not valid UUIDs — all DB inserts fail | yes |
| FIX-0002 | 2026-03-18 | AUDIT-001 BUG-2 | Backend | [FIX-0002](FIX-0002.md) | `src/app/api/scan/start/route.ts` | URL validation rejects URLs without protocol | yes |
| FIX-0003 | 2026-03-18 | AUDIT-001 BUG-4 | Frontend | [FIX-0003](FIX-0003.md) | `src/components/shared/CalcomModal.tsx` | Cal.com calLink hardcoded to wrong path | yes |
| FIX-0004 | 2026-03-18 | AUDIT-001 BUG-3 | Backend+Frontend | [FIX-0004a](FIX-0004a.md), [FIX-0004b](FIX-0004b.md) | `capture-info/route.ts` + `SocialConfirmation.tsx` | SocialConfirmation sends empty email — always fails | yes |
| FIX-0005 | 2026-03-18 | AUDIT-001 RUNTIME-4 | Frontend | [FIX-0005](FIX-0005.md) | `src/components/scan/ScanLayout.tsx` | CapturePrompt renders before leadId is available | yes |
| FIX-0006 | 2026-03-18 | AUDIT-002 E2E test | Frontend | [FIX-0006](FIX-0006.md) | `src/components/scan/ScanLayout.tsx` | Duplicate screenshot keys from SSE + initial data race | yes |
| FIX-0007 | 2026-03-18 | AUDIT-002 E2E test | Frontend | [FIX-0007](FIX-0007.md) | `src/components/landing/HeroSection.tsx` | URL input type="url" blocks bare domains via browser validation | yes |
| FIX-0008 | 2026-03-19 | AUDIT-002 E2E test | Backend | [FIX-0008](FIX-0008.md) | `src/lib/screenshots/client.ts` | Screenshots miss animated content + mobile captures distorted | yes |
| FIX-0009 | 2026-03-19 | AUDIT-002 E2E test | Frontend | [FIX-0009](FIX-0009.md) | `ScreenshotCard.tsx` + `AnnotationMarker.tsx` | Screenshots need scroll container + annotation dots need labels | yes |
| FIX-0010 | 2026-03-19 | AUDIT-002 E2E test | Backend | [FIX-0010](FIX-0010.md) | `src/lib/screenshots/client.ts` | Force all elements visible via CSS injection before capture | partial |
| FIX-0011 | 2026-03-19 | AUDIT-002 E2E test | Backend | [FIX-0011](FIX-0011.md) | `src/lib/screenshots/client.ts` | Remove transform:none from CSS injection (breaks carousels) | partial |
| FIX-0012 | 2026-03-19 | AUDIT-002 E2E test | Backend | [FIX-0012](FIX-0012.md) | `src/lib/screenshots/client.ts` | Simplify CSS injection to only opacity+visibility, add 2s init wait | pending |
