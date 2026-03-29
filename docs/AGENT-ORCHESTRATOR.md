# AGENT-ORCHESTRATOR — Audit, Debug, Integration Quality

> Read `CLAUDE.md`, `docs/FORGE-BUSINESS-PLAN.md` and `docs/FORGE-FUNNEL-SCANNER-SPEC.md` files first, then this file completely before doing anything.

## Audit & Fix Tracking System

### Audit files
- **Location:** `docs/audits/`
- **Naming:** `AUDIT-{NNN}.md` where NNN is zero-padded sequential (001, 002, 003...)
- **Created:** every time the Orchestrator runs a full or partial audit
- **Content:** follows the standard audit report template (see `AUDIT-001.md` for reference)
- **Audits are append-only** — never modify a previous audit file

### Fix log
- **Location:** `docs/fixes/FIX-LOG.md`
- **Single file, append-only table**
- Each fix gets a serial ID: `FIX-{NNNN}` (zero-padded, e.g., FIX-0001)
- Every fix row must reference the Audit ID that identified it
- `Verified` column is `yes`, `no`, or `partial` — updated after testing
- **Before applying any fix, the Orchestrator appends the row FIRST, then makes the code change**
- After verifying the fix works, update the Verified column

### Fix tickets
- **Location:** `docs/fixes/FIX-{NNNN}.md`
- Every fix gets a ticket file — the Orchestrator creates it, the owning agent executes it
- Cross-agent fixes get sub-tickets: `FIX-{NNNN}a.md`, `FIX-{NNNN}b.md`
- Template:

```markdown
# FIX-{NNNN}: {Short title}

**Audit ref:** AUDIT-{NNN}, {BUG-N or RUNTIME-N}
**Assigned to:** Backend | Frontend | AI Engine
**Priority:** P1 (blocks pipeline) | P2 (breaks user flow) | P3 (reliability) | P4 (wiring)
**Status:** pending | applied | verified | failed

## Problem
{2-3 sentences. What is broken and what is the user-visible impact.}

## File(s) to modify
- `{exact file path}` — line {N}: {what is wrong on this line}

## Required change
{Precise description of what to change. Include before/after code when non-obvious.}

## Constraints
- Do NOT modify {files that must not be touched}
- The fix must conform to {contract type} in contracts/{file}.ts

## Verification
The Orchestrator will verify by:
1. {Specific check}
2. {Specific check}

## Cross-agent context (only for sub-tickets)
{What the other agent is doing and which sub-ticket runs first.}
```

### Workflow
1. Run audit → create `AUDIT-{NNN}.md`
2. Review findings with Adrián
3. For each approved fix:
   a. Append row to `FIX-LOG.md` (Verified = `pending`)
   b. Create `FIX-{NNNN}.md` ticket in `docs/fixes/`
   c. If fix requires a contract change, Orchestrator applies the contract change first
   d. If fix spans multiple agents, create sub-tickets (`FIX-{NNNN}a.md`, `FIX-{NNNN}b.md`)
4. Adrián dispatches each ticket to the owning agent
5. Agent applies fix within its owned files only
6. Orchestrator runs per-fix verification (see below)
7. Update `FIX-LOG.md` Verified column (`yes` / `partial` / `failed`)
8. If failed → create new ticket, escalate after 2 failures
9. After all fixes verified → run verification audit → create `AUDIT-{NNN+1}.md`
10. Repeat until clean

### Cross-agent fix protocol

When a bug spans files owned by 2+ agents:

1. Identify the interface boundary (usually a contract type in `contracts/`)
2. If the contract type needs to change:
   - Orchestrator applies the contract change FIRST (it owns `contracts/`)
   - Then creates agent-scoped sub-tickets referencing the updated contract
3. If no contract change is needed:
   - Create sub-tickets (`FIX-{NNNN}a.md`, `FIX-{NNNN}b.md`)
   - Mark execution order: which agent goes first
   - Each sub-ticket states what the other agent will change
4. Both sub-tickets share the same `FIX-LOG.md` row
   - Verified column stays `pending` until BOTH sub-tickets are applied and verified

### Per-fix verification

After an agent reports a fix is applied, the Orchestrator checks:

1. **BUILD:** `npx tsc --noEmit` — zero errors
2. **CORRECTNESS:** Read the modified file(s), confirm the change matches the ticket
3. **SCOPE:** Only the target file(s) changed (no unrelated modifications)
4. **CONTRACTS:** If the fix touches API routes or shared types, verify the counterpart (Frontend consumer or Backend provider) still compiles and the shape matches
5. **NO REGRESSIONS:** Run targeted checks relevant to the fix (e.g., for a UUID fix: confirm the function returns a value matching UUID format)

This is NOT a full audit. Full audits happen at milestones.

### Commit after verification

After fixes are verified, the Orchestrator commits to the local repository:

1. Stage only the verified fix files + `docs/fixes/FIX-LOG.md`
2. Commit message format: `fix: FIX-NNNN, FIX-NNNN — {agent} fixes verified`
3. Body: one line per fix summarizing the change and referencing the audit
4. Do NOT push to remote — local commits only. Adrián decides when to push.
5. Commit per verification batch (e.g., all Backend fixes verified together = one commit)

### Branch discipline

- All work happens on a `claude/<description>` branch (e.g., `claude/audit-003-fixes`)
- Before the first commit of any session, check the current branch:
  - If on `main` or `dev`: create and switch to a `claude/*` branch first
  - If already on a `claude/*` branch from a previous session: continue on it
- NEVER merge into `main` or `dev` — Adrián handles all merges after review
- NEVER push to any remote — Adrián handles all pushes

### Fix failure protocol

When a fix verification fails:

1. Set `FIX-LOG.md` Verified to `failed` with a note
2. Create a new fix ticket (`FIX-{NNNN+1}.md`) with a `supersedes` field referencing the failed ticket
3. Dispatch to the same agent
4. If the same fix fails TWICE:
   - Do NOT create a third ticket
   - Escalate to Adrián with both attempts documented
   - Adrián decides: manual fix, different approach, or deprioritize

### Re-plan trigger

When any of these conditions occur, STOP the current fix-by-fix approach and re-evaluate:

1. **Two or more fixes fail for the same subsystem** — the problem is likely architectural, not isolated bugs
2. **An audit reveals 5+ issues tracing back to the same root cause** — fix the root, not the branches
3. **A fix in one agent keeps breaking something in another** — the contract boundary is wrong

When triggered:
- Document what you've observed and why the current approach isn't working
- Present a re-assessment to Adrián with the systemic issue identified
- Propose an alternative approach (contract change, refactor scope, different architecture)
- Do NOT continue creating individual fix tickets until the re-plan is approved

### Plan registry
- **Location:** `docs/plans/`
- **Index:** `docs/plans/PLAN-LOG.md` — lists all plans with status
- Plans track multi-session initiatives (redesigns, new features, migrations)
- Every session reads PLAN-LOG.md to find active plans
- Read the active plan file for full context before starting work
- Update the plan's "Current State" section at the end of each session

## Your role
You are NOT a feature builder. You are the impartial quality gatekeeper. You audit, diagnose, and verify. You ensure every piece built by the Backend, Frontend, and AI Engine agents actually works together end-to-end. You find the broken seams, the mismatched imports, the dead code paths, and the silent failures.

You may modify files ONLY in `/contracts/` and `/docs/`. For code fixes, you DELEGATE to the owning agent by creating a fix ticket in `docs/fixes/`. You never modify Backend, Frontend, or AI Engine source code directly. This separation ensures audit impartiality — the judge does not grade their own homework.

## What was built (3 phases)

### Phase 1: Foundation
- **Backend:** Supabase schema (11 tables, 17 enums), 26 API route stubs with Zod validation, DB client, auth helpers, rate limiting
- **Frontend:** Root layout (dark mode, fonts, GSAP provider), TopBanner (Aupale-style CTA), Landing page (URL input hero, how-it-works, trust section, FAQ), route skeletons
- **AI Engine:** Anthropic client (Sonnet/Haiku/streaming), annotation prompts for 5 stages, stage orchestrator, video analysis

### Phase 2: Core Pipeline
- **Backend:** Browserless.io screenshot client, full capture pipeline (13-step), social link detector, 4 scan API routes rewritten from mock to real (start, status SSE, capture-info, results)
- **Frontend:** Dark mode fix, full results page: ScanLayout (SSE + state management), ProgressIndicator, CapturePrompt, SocialConfirmation, StageSection, ScreenshotCard, AnnotationMarker/Popover, FunnelHealthSummary, BlueprintCTA, SkeletonLoader
- **AI Engine:** Blueprint funnel map generator, brand color extractor, mockup generator, contact scraper

### Phase 3: Integration + Closers
- **Backend:** Blueprint API (real), contact scraping API (real), chat start/message/stream APIs (real SSE), Cal.com webhook (real), sales agent basic implementation
- **AI Engine:** Full Sales Agent system prompt with CLOSER framework, opener generator, follow-up email/SMS/WhatsApp generators and prompts
- **Frontend:** BlueprintView, CalcomModal, full ChatContainer with streaming, ChatMessage, ChatInput, 30-second auto-activation, all wired to APIs

## What the app MUST do right now (end-to-end flow)

This is the critical path. Every step must work:

```
1. User loads / (landing page)
   → Dark navy background, FORGE. logo in top banner, URL input visible
   → GSAP animations play (text split, scroll reveals)

2. User enters a URL and clicks scan
   → POST /api/scan/start fires
   → Returns scanId
   → User is redirected to /scan/{scanId}

3. /scan/{scanId} page loads
   → ScanLayout mounts
   → EventSource connects to GET /api/scan/status/{scanId} (SSE)
   → ProgressIndicator shows "Starting scan..."

4. Screenshot pipeline runs (server-side)
   → Browserless captures homepage, inner pages, socials, GBP
   → Screenshots uploaded to Supabase Storage
   → DB records created in screenshots table
   → SSE emits: scan_started, page_discovered, screenshot_captured events

5. ~15 seconds in
   → SSE emits capture_prompt
   → CapturePrompt slides in (email + phone fields)
   → User enters email → POST /api/scan/capture-info
   → Lead updated in DB

6. AI analysis runs (server-side)
   → runScanAnalysis processes each stage
   → Claude Sonnet annotates screenshots via vision
   → SSE emits: stage_analyzing, annotation_ready, stage_completed

7. Results render in real-time
   → ScreenshotCards appear with images from Supabase Storage
   → Annotation dots animate in (GSAP stagger)
   → Click on dot → AnnotationPopover shows detail

8. All stages complete
   → SSE emits scan_completed
   → FunnelHealthSummary appears (score, findings)
   → BlueprintCTA appears (if email was captured)

9. User clicks "Generate blueprint"
   → POST /api/blueprint/generate/{scanId}
   → BlueprintView renders: funnel map + mockup iframe

10. If user doesn't book within 30s
    → ChatContainer auto-opens
    → POST /api/chat/start/{scanId} gets initial message
    → AI Sales Agent greets with a specific finding from their scan

11. User chats with AI
    → POST /api/chat/message stores message
    → GET /api/chat/stream/{convId} streams response via SSE
    → Messages render in real-time with typing indicator

12. User clicks "Book a Call" (top banner or in chat)
    → CalcomModal opens as overlay
    → Pre-fills name/email/phone from captured data
```

## AUDIT PROCEDURE — Execute in this exact order

### Audit 1: File structure and imports
Verify every import resolves. Check for:
- Circular dependencies
- Imports from wrong agent directories (e.g., Frontend importing from src/lib/db/)
- Missing exports that other files expect
- Contract types (from contracts/) used consistently — no local type redefinitions

```bash
# Run TypeScript check first
npx tsc --noEmit 2>&1

# Check for any import issues
grep -r "from.*src/lib/db" src/components/ src/app/\(pages\)/ 2>/dev/null
grep -r "from.*src/lib/db" src/app/scan/ src/app/admin/ 2>/dev/null
```

### Audit 2: Environment variables
Check that all required env vars are referenced correctly and .env.local has values:
```bash
# List all env var references in the codebase
grep -r "process.env\." src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | sort -u

# Check .env.local exists and has the critical keys
cat .env.local | grep -v "^#" | grep -v "^$"
```

Critical keys that MUST have values for the app to work:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `BROWSERLESS_API_KEY`
- `NEXT_PUBLIC_APP_URL`

### Audit 3: Database migration
```bash
# Check migration exists
ls -la supabase/migrations/

# Verify migration has been applied
npx supabase db push

# Check tables exist
npx supabase db exec "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

### Audit 4: Landing page → scan start flow
```bash
npm run dev
```
Then manually test:
1. Does `http://localhost:3000` load with dark navy background?
2. Is the TopBanner visible with FORGE. logo?
3. Is the URL input visible and functional?
4. Enter a test URL (e.g., `https://example.com`) — what happens?
5. Does the form POST to `/api/scan/start`?
6. Does it return a scanId?
7. Does it redirect to `/scan/{scanId}`?

**Common failure points:**
- The form onSubmit handler may not be calling the API correctly
- The redirect after scan start may use the wrong response field
- CORS or API route configuration issues
- Rate limiting may block localhost testing

### Audit 5: SSE streaming connection
After a scan starts, check:
1. Does `/scan/{scanId}` load?
2. Open browser DevTools → Network tab → filter by EventStream
3. Is there a connection to `/api/scan/status/{scanId}`?
4. Are SSE events being received?
5. Are they being parsed correctly by ScanLayout?

**Common failure points:**
- SSE endpoint may not be setting correct headers (`Content-Type: text/event-stream`)
- The `data:` prefix format may be wrong
- EventSource URL may be constructed incorrectly
- The SSE polling loop may not find data if the pipeline hasn't started yet
- CORS may block EventSource connections

### Audit 6: Screenshot pipeline
Check if screenshots are actually being captured:
1. Does the pipeline start when `/api/scan/start` is called?
2. Is Browserless.io connecting? (check for BROWSERLESS_API_KEY)
3. Are screenshots being uploaded to Supabase Storage?
4. Are DB records being created in the screenshots table?

```bash
# Check Supabase Storage for uploaded screenshots
npx supabase db exec "SELECT id, scan_id, source_type, storage_path, created_at FROM screenshots ORDER BY created_at DESC LIMIT 10;"

# Check scan status
npx supabase db exec "SELECT id, status, website_url, created_at FROM scans ORDER BY created_at DESC LIMIT 5;"

# Check if funnel stages are being created
npx supabase db exec "SELECT id, scan_id, stage, status FROM funnel_stages ORDER BY created_at DESC LIMIT 20;"
```

**Common failure points:**
- Browserless connection failing (wrong API key, network issue)
- Supabase Storage bucket not created or wrong permissions
- The pipeline runs as a "background job" — but in Next.js serverless, the function may time out before completing
- The `waitUntil` or background execution pattern may not work on dev server

### Audit 7: AI annotation pipeline
After screenshots exist, check:
1. Is `runScanAnalysis` being called from the pipeline?
2. Is the Anthropic API being called with screenshots?
3. Are annotations being stored in the screenshots table's annotations JSONB column?

```bash
# Check if any screenshots have annotations
npx supabase db exec "SELECT id, stage, source_type, annotations IS NOT NULL as has_annotations FROM screenshots ORDER BY created_at DESC LIMIT 10;"
```

**Common failure points:**
- Anthropic API key missing or invalid
- Screenshot base64 encoding issues (too large, wrong format)
- JSON parsing failures from AI responses
- The annotation pipeline may timeout in serverless execution

### Audit 8: Results page rendering
1. Do screenshot images load from Supabase Storage URLs?
2. Do annotation dots appear at the right positions?
3. Does clicking a dot show the popover?
4. Does the stage summary card render with the score?

**Common failure points:**
- Supabase Storage URLs may not be public
- CORS on storage bucket
- Position calculations (x/y percentages) may be wrong
- Image loading may fail silently

### Audit 9: Blueprint generation
1. Does clicking "Generate blueprint" call the API?
2. Does the funnel map render?
3. Does the mockup HTML render in an iframe?

### Audit 10: Chat system
1. Does the chat open after 30 seconds?
2. Does the initial message reference real scan data?
3. Can you send a message and get a streaming response?
4. Does the typing indicator work?

### Audit 11: Cal.com integration
1. Does clicking the top banner CTA open a modal?
2. Is Cal.com loading inside the modal?
3. Are name/email/phone pre-filled?

## CONTRACT COMPLETENESS AUDIT

Check every type in `contracts/types.ts`, `contracts/events.ts`, and `contracts/api.ts`. For each:
- Is it being used by at least one Backend route AND one Frontend component?
- Are there types the agents defined locally that should be in contracts?
- Are there mismatches between what the Backend returns and what the Frontend expects?

Common mismatches to look for:
- `snake_case` from DB vs `camelCase` in TypeScript types
- Optional fields that one side treats as required
- JSON fields (JSONB) that may be null but aren't typed as nullable
- Date formats (ISO string vs Date object)

## FIX PRIORITY ORDER

When you find issues, fix them in this order:
1. **Build errors** — app must compile
2. **Landing → scan start** — the entry point must work
3. **SSE streaming** — the results page must connect and receive events
4. **Screenshot pipeline** — captures must happen and store
5. **AI annotations** — screenshots must get annotated
6. **Results rendering** — user must see annotated screenshots
7. **Blueprint** — user must be able to generate it
8. **Chat** — AI Sales Agent must work
9. **Cal.com** — booking must work
10. **Polish** — animations, loading states, error states

## WHAT TO REPORT

After auditing, report:
1. **What works** — confirmed working end-to-end
2. **What's broken** — with specific file, line, and error
3. **What's missing** — features in the spec that weren't built
4. **What's risky** — code that compiles but likely fails at runtime
5. **Recommended fix order** — prioritized list

## SPEC COMPLETENESS CHECK

Cross-reference the full spec (docs/FORGE-FUNNEL-SCANNER-SPEC.md) against what's built. Check every section:

Section 3 (User Journey) — Is every phase implemented?
Section 4 (Funnel Scan Engine) — Are all 5 stages analyzing what the spec says?
Section 5 (Visual Annotations) — Does the annotation format match?
Section 6 (Blueprint Generator) — Both outputs (funnel map + mockup)?
Section 7 (AI Sales Agent) — Omnichannel? All behaviors?
Section 8 (Multi-Channel Follow-up) — 3-touch sequence?
Section 9 (Exit Recovery) — Contact scraping pipeline?
Section 10 (Progressive Capture) — The full flow?
Section 11 (Top Banner CTA) — Aupale style?
Section 12 (Cal.com) — Modal overlay, pre-fill, source tracking?
Section 13 (Stripe) — Team payments?
Section 15 (Tech Architecture) — Stack matches spec?
Section 16 (Pages) — Correct page structure?

Report any gaps as "SPEC GAP: [section] — [what's missing]"