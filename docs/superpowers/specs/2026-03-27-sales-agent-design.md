# Sales Agent + Sales Orchestrator — Design Spec

**Date:** 2026-03-27
**Status:** Draft — awaiting Adrián's final review
**Branch:** dev
**Scope:** Approach B — Full Sales Orchestrator + Knowledge Base (no email/SMS sending yet)

---

## 1. Overview

Build the Hormozi-trained AI Sales Agent knowledge base and a new Sales Orchestrator agent. The Sales Agent closes leads via web chat using distilled Hormozi methodology. The Sales Orchestrator manages the full pipeline — conversation monitoring, follow-up scheduling, lead lifecycle tracking, and reporting to Kova.

### Three Deliverables

1. **Knowledge Base** (AI Engine domain) — Core principles + objection playbook + Haiku classifier
2. **Sales Orchestrator** (new persistent agent) — Identity, loop, queues, pipeline reporting
3. **Scanner Integration** (Backend domain) — Vault event writes, conversation lifecycle, classifier integration

### What's NOT in Scope

- Actually sending emails/SMS/WhatsApp (no Resend/Twilio wiring)
- Contact scraping automation
- Admin panel sales views
- Frontend changes (no visual work)
- Voice agent

See Section 10 for the full deferred work log.

---

## 2. Architecture

### Data Flow

```
Prospect visits scanner
    → Web chat opens (30s timer)
    → Chat API writes vault event: conversation_started
    → Haiku classifies each prospect message → loads relevant playbook section
    → Sonnet generates response with core principles + specific scripts
    → If prospect mentions objection → classifier detects → injects handling scripts
    → If ready to book → Cal.com embed emitted
    → Chat API writes vault event: booking_confirmed OR conversation_ended
    → On exit without booking → follow-up queue entry written to vault
    → Sales Orchestrator reads queue on /loop → manages timing
    → Sales Orchestrator writes pipeline status → Kova reads
```

### Agent Boundaries

| Agent | What It Builds |
|-------|---------------|
| AI Engine | Knowledge base files, objection classifier, system prompt upgrade |
| Backend | Vault event writes, conversation lifecycle in DB, follow-up queue writes, classifier integration in routes |
| Cody (Orchestrator) | Sales Orchestrator identity + scaffold + vault infrastructure |
| Frontend | NOT TOUCHED |

---

## 3. Knowledge Base

### File 1: Core Principles

**Location:** `agents/sales-orchestrator/knowledge/core-principles.md`
**Size:** ~1.5K tokens
**Loading:** Always included in every system prompt

Contains 12 rules the agent follows in every message:

1. **Questions control the conversation** — end every message with a question
2. **Never answer objections directly** — ask about their question first (3A framework)
3. **Acknowledge-Associate-Ask** — validate, link to success, redirect
4. **Be like smoke** — sidestep, never get pinned on a direct answer
5. **Conviction over persuasion** — believe in the product, transfer that belief
6. **Diagnose before prescribing** — use scan data as proof ("we already looked under the hood")
7. **Labels create commitment** — "you're clearly someone who takes their business seriously"
8. **Seduction not combat** — never win an argument, make them right
9. **Childlike curiosity** — "huh, that's interesting — tell me more"
10. **Sell the vacation, not the plane flight** — paint the outcome, not the process
11. **The prospect believes what THEY say** — breadcrumb them to the conclusion
12. **Adaptive intensity** — warm start, escalate with conviction as engagement grows

### File 2: Objection Playbook

**Location:** `agents/sales-orchestrator/knowledge/objection-playbook.md`
**Size:** ~8-10K tokens
**Loading:** On demand, via Haiku classifier

Organized by objection category:

| Category | Triggers | Key Techniques |
|----------|----------|----------------|
| TIME | "think about it", "not the right time", "maybe later" | When-Then Fallacy, Rocking Chair, macro/micro scripts |
| PRICE | "too expensive", "can't afford it", "what's the cost" | Ferrari Close, relative value, resourcefulness frame |
| FIT | "not sure it's for me", "my business is different" | Identity-based scripts, hypothetical close, scan data proof |
| AUTHORITY | "talk to spouse/partner", "need to ask my team" | Sidestep scripts, support frame, invite to call |
| AVOIDANCE | "I'll get back to you", ghosting, vague responses | Future-casting, three decision questions, scan expiry urgency |
| STALL | silence, topic changes, circular responses | "What are you afraid of?", "What would it take?", mechanic close |

Each section includes:
- 3-5 ready-to-use script patterns
- Forge-specific adaptations using scan data
- Psychological principle behind the technique
- When to deploy (message count, engagement level)

### Haiku Classifier

**New file:** `src/lib/ai/objection-classifier.ts`

```typescript
export async function classifyMessage(
  message: string,
  conversationContext: string[]
): Promise<ObjectionType>

type ObjectionType = 'time' | 'price' | 'fit' | 'authority' | 'avoidance' | 'stall' | 'none' | 'ready_to_book'
```

- Called on each user message in the chat message endpoint
- Runs in parallel with message storage (doesn't block)
- ~50-100ms latency (Haiku with tight prompt)
- Result passed to stream endpoint for playbook injection

### Playbook Loader

**New file:** `src/lib/ai/playbook-loader.ts`

```typescript
export function loadPlaybookSection(objectionType: ObjectionType): string | null
```

- Reads from the playbook markdown file
- Returns the matching section as a string
- Returns null for `none` or `ready_to_book`
- Injected into system prompt as `[ACTIVE_OBJECTION_CONTEXT]`

### Vault Access from Scanner App

The knowledge files live at `agents/sales-orchestrator/knowledge/` (vault-level), but the scanner app runs in `projects/forge-scanner/`. Two options:

**Option chosen: Symlink + env var.** The scanner app reads knowledge files via a path configured in `.env.local`:
```
SALES_KNOWLEDGE_PATH=../../agents/sales-orchestrator/knowledge
```
The playbook loader resolves this relative to the project root. This keeps the knowledge files in the vault (shared across products) while making them accessible to the app at runtime.

For production deployment: knowledge files are copied to the build output during deploy, or read from a shared volume.

---

## 4. System Prompt Upgrade

### Structure (top to bottom)

1. **IDENTITY** — "Forge's AI Sales Advisor" (not assistant). Adaptive personality.
2. **CORE PRINCIPLES** — 12 rules from core-principles.md (replaces CLOSER skeleton)
3. **CONVICTION FUEL** (new)
   - What Forge is: AI-powered sales infrastructure partner, not marketing services
   - Differentiators: full execution (not consulting), AI-native, one person + AI = 5-person agency
   - Adrián's proof: grew a food business to ~$10K rev / ~$5K profit per month
   - The offer: free strategy call with Adrián — that's ALL we sell in chat
   - Rules: never quote prices, never promise specific results, never disparage competitors
4. **SCAN CONTEXT** — existing stage summaries, findings, screenshots, health score
5. **CONVERSATION RULES** — adaptive intensity scale:
   - Messages 1-3: Warm, curious, consultative
   - Messages 4-6: More direct, name specific problems, use labels
   - Messages 7+: Confident closer, deploy objection handling, push for booking
6. **ACTIVE OBJECTION CONTEXT** — injected by classifier when objection detected
7. **CHANNEL RULES** — existing web/email/SMS/WhatsApp formatting (unchanged)

### Widget Protocols (existing, unchanged)
- `[DATA_CARD:{screenshotId}]` — max 2 per conversation
- `[CALCOM_EMBED]` — max 1, only after rapport or ready_to_book signal

### Token Budget
- Base system prompt: ~4-5K tokens
- With active objection: ~5-6K tokens
- Well within Sonnet's context window

---

## 5. Sales Orchestrator Identity

### Agent Profile

| Property | Value |
|----------|-------|
| Name | TBD (Adrián picks) |
| Tier | Persistent orchestrator (same level as Kova + Cody) |
| Session | `forge-sales` (tmux) |
| Model | Opus |
| Communication | Vault filesystem (+ Discord TBD) |
| Reports to | Kova (via vault) |

### File Structure

```
agents/sales-orchestrator/
├── CLAUDE.md              — Full contract
├── eval.md                — Performance criteria
├── program.md             — Onboarding program
├── knowledge/
│   ├── core-principles.md — 12 rules (always loaded)
│   └── objection-playbook.md — Scripts by category
├── queues/                — Follow-up queue files
├── events/                — Consumed by orchestrator, written by products
│   └── forge-scanner/     — Events from scanner product
└── outputs/               — Generated reports
```

### Personality

Direct, numbers-driven, competitive. Tracks conversion rates obsessively. Celebrates closed deals. Flags stalled leads. VP of Sales energy.

### Boot Sequence

1. Read CLAUDE.md (identity)
2. Read knowledge/ (core principles + playbook)
3. Read `shared/project-logs/sales-pipeline.md` (pipeline state)
4. Read queues/ (pending follow-ups)
5. Read `shared/decisions/` (pricing/offer changes)
6. Start `/loop`

### Loop Behavior

**Cadence:** 5 minutes during business hours (8 AM - 10 PM), 30 minutes overnight (10 PM - 8 AM). Hot leads decay fast — speed-to-lead is critical (Hormozi Video 3).

Steps per loop:
1. Read new conversation events from all project queues
2. Check follow-up queue — any sequences due to fire?
3. For due follow-ups: generate content (Sonnet + playbook), write to outbound queue
4. Monitor conversation quality — flag stalled or low-engagement conversations
5. Update pipeline report at `shared/project-logs/sales-pipeline.md`
6. Escalation routing (per Kova):
   - **Booking confirmed / payment:** → `shared/needs-review/` with `Urgency: Critical`
   - **Hot lead engaged, not booked:** → `shared/project-logs/sales-pipeline.md` (regular pipeline)
   - **Lead went cold / ghost:** → pipeline log (nightly recap)
   - **Never write to Kova's task queue** — `needs-review/` is the alert channel
7. Check `shared/decisions/` for offer/pricing changes

### Pipeline Report Format (per Kova)

`shared/project-logs/sales-pipeline.md`:

```markdown
# Sales Pipeline
**Last updated:** [timestamp]
**Updated by:** Sales Orchestrator

## Active Leads
| Lead | Source | Stage | Last Touch | Next Action | Days in Stage |

## Bookings This Week
- [date]: [name] — [source] — [status]

## Conversions (Last 30 Days)
- Scans: X
- Conversations started: X
- Bookings: X
- Payments: X
- Conversion rate (scan → payment): X%

## Follow-up Queue
- Pending: X
- Overdue: X (flag these)

## Notes
- [Patterns, hot leads, anomalies]
```

Numbers first, details second. Kova reads this at 6 AM for morning brief.

### Relationship to Existing Agents

- **Lead Systems** (Layer 2) = outbound prospecting strategy, get people to the door
- **Sales Orchestrator** = inbound automation, close them once inside
- Clear handoff boundary. No overlap.

---

## 6. Conversation Lifecycle

### State Machine

```
scan_started
    → conversation_started (chat opens, 30s after scan)
        → engaged (prospect sends 2+ messages)
            → objection_handling (classifier detects objection)
                → ready_to_book (classifier detects buying intent)
                    → booking_confirmed (Cal.com webhook)
                → stalled (no message in 5+ min after objection)
            → abandoned (tab closed / exit detected)
        → bounced (0-1 messages, left quickly)
    → no_chat (scan completed, chat never opened)
```

Each transition writes a vault event file to `agents/sales-orchestrator/events/[project]/`.

### Vault Event Format

```markdown
# EVENT: [event_type]
**Timestamp:** [ISO]
**Project:** [project-name]
**Scan ID:** [id]
**Lead:** [email] | [phone]
**Business:** [name] ([url])
**Weakest Stage:** [stage] (score: [N])
**Overall Health:** [N]/100
**Chat Channel:** [web|email|sms|whatsapp]
**Details:** [event-specific data]
```

### Event Sources (Backend writes these)

| Route | Event Written |
|-------|--------------|
| `POST /api/chat/start/[scanId]` | `conversation_started` |
| `POST /api/chat/message` | `message_exchanged` (includes objection_type) |
| `GET /api/chat/stream/[convId]` | `message_complete` |
| `POST /api/scan/capture-info` | `lead_captured` |
| `POST /api/followup/trigger` (exit beacon) | `lead_exited` |
| Cal.com webhook | `booking_confirmed` |

### DB Changes

Add to `conversations` table:
- `engagement_score` (computed: message count, avg length, questions asked)
- `objection_count` (incremented when classifier detects objection)
- `last_objection_type` (latest classified objection)

---

## 7. Follow-up Queue

### Queue Location

**Project-level:** `projects/forge-scanner/sales/queues/` (per Kova — queues are project-specific, Sales Orchestrator reads across all projects)

```
projects/forge-scanner/sales/
├── queues/
│   ├── pending/          # Follow-ups scheduled but not sent
│   ├── active/           # Currently in conversation
│   └── completed/        # Archived conversations
├── conversations/        # Full conversation logs
└── pipeline.json         # Lead status tracking (mirrors to shared/project-logs/)
```

The shared vault report at `shared/project-logs/sales-pipeline.md` is the **aggregated view** Kova reads. Project-level data is source of truth.

### Queue Entry Format

```markdown
# FOLLOW-UP: [scan-id]-pos[N]
**Lead:** [email]
**Phone:** [phone]
**Business:** [name]
**Trigger:** [conversation_abandoned | bounced | no_chat]
**Sequence Position:** [N] of 3
**Channel:** [email | sms | email]
**Scheduled For:** [ISO timestamp]
**Status:** pending | generating | ready | sent | failed | cancelled

## Scan Context
- Weakest stage: [stage] ([score]/100)
- Critical findings: [list]
- Top insight: "[one-liner]"

## Generated Content
[Filled by Sales Orchestrator when generating]

## Send Result
[Filled when sent — delivery status, open tracking, etc.]
```

### Sequence Timing

| Position | Channel | Timing | Trigger |
|----------|---------|--------|---------|
| 1 | Email | 30-60s after exit | Lead exited without booking |
| 2 | SMS | 24h after exit | Position 1 sent, no response |
| 3 | Email | 72h after exit | Position 2 sent, no response |

- If lead books at ANY point → all pending follow-ups cancelled
- If lead responds to any channel → conversation reactivated, follow-ups paused
- Position 1 queue entry written by Backend on exit detection
- Positions 2-3 written by Sales Orchestrator after Position 1 sent

---

## 8. Scanner Backend Changes

### New Files

| File | Purpose |
|------|---------|
| `src/lib/ai/objection-classifier.ts` | Haiku classifier for objection detection |
| `src/lib/ai/playbook-loader.ts` | Loads playbook sections by objection type |
| `src/lib/vault/event-writer.ts` | Writes structured event files to vault |
| `src/lib/vault/queue-writer.ts` | Writes follow-up queue entries |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/api/chat/start/[scanId]/route.ts` | Add vault event write after conversation creation |
| `src/app/api/chat/message/route.ts` | Add Haiku classification (parallel), pass objection_type to stream |
| `src/app/api/chat/stream/[convId]/route.ts` | Load playbook section if objection detected, inject into system prompt |
| `src/lib/prompts/sales-agent-system.ts` | Full rewrite — new structure with core principles, conviction fuel, adaptive personality |
| `src/app/api/scan/capture-info/route.ts` | Add vault event write after lead capture |
| `src/app/api/followup/trigger/route.ts` | Add vault event write + queue entry on exit |
| Cal.com webhook route | Add vault event write + cancel pending follow-ups on booking |

### Chat UI Copy Fixes (Frontend — minimal)

Replace placeholder copy in chat components:
- `[COPY: chat initialization error message]` → real copy
- `[COPY: chat agent name]` → "Forge Advisor"
- `[COPY: message send error]` → real copy
- `[COPY: book a strategy call]` → real copy
- `[COPY: book call description in chat]` → real copy

---

## 9. Testing Strategy

### Knowledge Base Quality

- Test with 20+ simulated conversations covering all objection types
- Verify classifier accuracy against labeled test messages
- Verify playbook sections load correctly for each objection type
- Measure response quality: does the agent use the right technique for the right objection?

### Conversation Lifecycle

- Verify all state transitions write correct vault events
- Test booking cancellation of pending follow-ups
- Test stall detection timing
- Verify engagement scoring

### Sales Orchestrator

- Verify boot sequence reads all required files
- Test /loop reads events and processes queue
- Test pipeline report generation
- Test hot lead alert writing

### Integration

- Full flow: enter URL → scan → chat opens → throw objections → booking
- Verify vault events appear at each step
- Verify follow-up queue populates on exit
- Verify pipeline report updates

---

## 10. Deferred Work

### Phase C1: Email Sending
- Wire Resend SDK to send follow-up emails
- Unsubscribe link + handling
- CAN-SPAM compliance
- Email delivery tracking
- Resend webhook for delivery status

### Phase C2: SMS/WhatsApp Sending
- Install + configure Twilio SDK
- SMS sending for position 2
- WhatsApp Business API
- TCPA compliance
- Two-way conversation reactivation

### Phase C3: Contact Scraping Pipeline
- Auto-trigger scrapeContactsFromHtml() on no-email exits
- GBP data parsing
- WHOIS lookup
- Auto-outbound with scan results
- Admin flag for manual outreach

### Phase C4: Sales Orchestrator Enhancements
- Discord channel for direct alerts
- Conversation quality scoring
- A/B testing system prompt variations
- Weekly conversion reports
- Ghost pipeline re-engagement
- Long-term nurture sequences

### Phase C5: Admin Panel
- Sales pipeline view in /admin
- Conversation replay
- Manual follow-up trigger
- Lead scoring dashboard
- Stripe integration

### Phase C6: Deep Sales Training
- Process Adrián's own sales recordings
- Channel-specific tone tuning (20+ simulated convos)
- Voice agent for phone follow-ups
- Offer Architect + Money Models knowledge integration
