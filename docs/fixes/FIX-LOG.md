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
