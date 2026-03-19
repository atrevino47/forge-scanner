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
| FIX-0012 | 2026-03-19 | AUDIT-002 E2E test | Backend | [FIX-0012](FIX-0012.md) | `src/lib/screenshots/client.ts` | Simplify CSS injection to only opacity+visibility, add 2s init wait | partial — carousels still incomplete |
| FIX-0013 | 2026-03-19 | AUDIT-001 RUNTIME-1 | Backend | [FIX-0013](FIX-0013.md) | `src/app/api/scan/start/route.ts` | Use after() for pipeline so it survives on Vercel | yes |
| FIX-0014 | 2026-03-19 | AUDIT-001 MISSING-5 | Backend | [FIX-0014](FIX-0014.md) | `src/middleware.ts` (new) | Build middleware for Supabase auth session refresh | yes |
| FIX-0015 | 2026-03-19 | AUDIT-001 MISMATCH-2 | Backend | [FIX-0015](FIX-0015.md) | `src/lib/db/mappers.ts` (new) + 4 routes | Extract shared DB-to-contract mappers | yes |
| FIX-0016 | 2026-03-19 | AUDIT-001 MISSING 7-8 | Frontend | [FIX-0016](FIX-0016.md) | `src/components/scan/ScanLayout.tsx` | Exit detection + follow-up trigger via sendBeacon | yes |
| FIX-0017 | 2026-03-19 | AUDIT-001 MISSING 17 | Frontend | [FIX-0017](FIX-0017.md) | `PostHogProvider.tsx` (new) + `layout.tsx` | Initialize PostHog analytics | yes |
| FIX-0018 | 2026-03-19 | AUDIT-001 MISSING 3 | AI Engine | [FIX-0018](FIX-0018.md) | `src/lib/scanner/stage-landing.ts` | Add PageSpeed API integration to landing stage | yes |
| FIX-0019 | 2026-03-19 | AUDIT-001 MISSING 12 | Frontend | [FIX-0019](FIX-0019.md) | `CalcomContext.tsx` + `CalcomModal.tsx` + `TopBanner.tsx` + `ScanLayout.tsx` | Pass booking source through Cal.com metadata | yes |
| FIX-0020 | 2026-03-19 | AUDIT-003 Phase A.1 | Frontend | [FIX-0020](FIX-0020.md) | `src/components/scan/ScanLayout.tsx` | Email gate — smooth GSAP blur/unblur animation + overlay entrance | yes |
| FIX-0021 | 2026-03-19 | AUDIT-003 Phase A.2 | Backend | [FIX-0021](FIX-0021.md) | `social-detector.ts` + `pipeline.ts` + `status/[id]/route.ts` | Social disambiguation — emit `social_ambiguous` SSE event when multiple handles found | yes |
| FIX-0022 | 2026-03-19 | AUDIT-003 Phase A.3 | Frontend | [FIX-0022](FIX-0022.md) | `src/components/scan/BlueprintView.tsx` | Blueprint funnel map — node hover effects + click-to-expand accordion | yes |
| FIX-0023 | 2026-03-19 | AUDIT-003 Phase A.4 | AI Engine + Backend | [FIX-0023a](FIX-0023a.md), [FIX-0023b](FIX-0023b.md) | `sales-agent-system.ts` + `chat/stream/[convId]/route.ts` | Data cards in chat — system prompt marker protocol + stream parser | yes |
| FIX-0024 | 2026-03-19 | AUDIT-003 Phase A.5 | AI Engine + Backend | [FIX-0024a](FIX-0024a.md), [FIX-0024b](FIX-0024b.md) | `sales-agent-system.ts` + `chat/stream/[convId]/route.ts` | Cal.com embed in chat — marker protocol + stream parser for inline booking | yes |
| FIX-0025 | 2026-03-19 | AUDIT-003 Phase A.6 | Frontend | [FIX-0025](FIX-0025.md) | `SaveResultsPrompt.tsx` (new) + `SupabaseProvider.tsx` (new) + `layout.tsx` + `ScanLayout.tsx` | Google OAuth soft prompt — "Save your results" UI after blueprint | yes |
| FIX-0026 | 2026-03-19 | AUDIT-003 Phase D prereq | Frontend | [FIX-0026](FIX-0026.md) | `globals.css` + `AnnotationMarker.tsx` + `gsap-presets.ts` | CSS foundations — fix shimmer/blink keyframes, replace Tailwind pulse with GSAP, add presets | pending |
| FIX-0027 | 2026-03-19 | AUDIT-003 Phase D.3 | Frontend | [FIX-0027](FIX-0027.md) | `ScreenshotCard.tsx` + `StageSection.tsx` | Screenshot presentation — device chrome badges, size differentiation, image loading states | pending |
| FIX-0028 | 2026-03-19 | AUDIT-003 Phase D | Frontend | [FIX-0028](FIX-0028.md) | `ScreenshotCard.tsx` + `AnnotationMarker.tsx` + `AnnotationPopover.tsx` | Annotation dot ↔ summary list bidirectional hover + popover exit animation | pending |
| FIX-0029 | 2026-03-19 | AUDIT-003 Phase D | Frontend | [FIX-0029](FIX-0029.md) | `FunnelHealthSummary.tsx` | Health score radial gauge + stat card hover + mobile responsive grid | pending |
| FIX-0030 | 2026-03-19 | AUDIT-003 Phase D.5 | Frontend | [FIX-0030](FIX-0030.md) | `ChatContainer.tsx` + `ChatMessage.tsx` + `ChatInput.tsx` + `ChatToggle.tsx` + `TypingIndicator.tsx` | Chat polish — message animations, auto-focus, typing indicator, badge pulse | pending |
| FIX-0031 | 2026-03-19 | AUDIT-003 Phase D.7+8 | Frontend | [FIX-0031](FIX-0031.md) | `BlueprintCTA.tsx` + `SkeletonLoader.tsx` + `StageSection.tsx` | Error states + structured skeleton loading variants | pending |
| FIX-0032 | 2026-03-19 | AUDIT-003 Phase D.2 | Frontend | [FIX-0032](FIX-0032.md) | `StageSection.tsx` + `ScanLayout.tsx` + `FunnelHealthSummary.tsx` | Results page progressive scroll reveal + visual separators + stage numbering | pending |
