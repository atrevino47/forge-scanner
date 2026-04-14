# Cody — Operational Procedures

Imported by CLAUDE.md. Contains full protocols for loop behavior, audits, fix traceability, task management, and dispatch.

---

## Loop Behavior (every 30 minutes)

On each `/loop 30m` iteration:

### Step 1 — Evaluate build state
- Read `docs/SPEC.md` for milestones and sprint goals
- Read `docs/tasks/*-tasks.md` for queued/in-progress/completed work
- Check running background Tasks (never double-dispatch)
- Read `git log --oneline -20` for recent commits
- If a build agent completed since last loop: run an audit
- Check `docs/tickets/BUILD-TICKETS.md` for new issues

### Step 2 — Write task entries
New tasks from audit findings, sprint backlog, test gaps, refactoring needs.

### Step 3 — Dispatch build agents
For each agent with pending tasks: check no in-progress Task exists, spawn as background Task with `isolation: worktree`.

### Step 4 — Report to vault
Update `../../shared/project-logs/[project].md`. Keep entries concise — Kova reads during morning brief.

**Target:** Under 90 seconds of housekeeping. Heavy work goes to build agents.

---

## Build Agent Dispatch

Three build agents, each spawned as background Task with `isolation: worktree`:

| Agent | Domain | maxTurns | model |
|---|---|---|---|
| Backend | DB, API routes, auth, screenshots, webhooks | 50 | sonnet |
| Frontend | Pages, components, design system, animations, responsive | 50 | sonnet |
| AI Engine | Prompts, annotations, blueprint generator, AI features | 40 | sonnet |

### Spawn prompt template

```
You are the [Backend/Frontend/AI Engine] Agent for [project].

Read the project CLAUDE.md for tech stack and conventions.
Read docs/learnings.md for known patterns to avoid.

Your task:
[paste full pending task from docs/tasks/[agent]-tasks.md]

Work in your git worktree. Branch: build/[agent]/[task-description].
Write failing tests first, then implement.
Run all tests before marking complete.
Commit with conventional messages (feat:, fix:, test:, refactor:).
Always use Bun — never npm/npx.
```

### Dispatch rules
- **Parallel:** Independent tasks across agents can run simultaneously
- **Sequential:** When one needs another's output, dispatch in order
- **Never double-dispatch**
- **Timeout:** >30 min → flag as potentially stuck

---

## Audit Protocol

### When to audit
1. After each build agent completes a task batch
2. After a batch of fixes
3. When tests fail unexpectedly
4. Before any merge to main
5. Approximately every 90 minutes (check last `docs/audits/AUDIT-NNN.md` timestamp)

### Report format — `docs/audits/AUDIT-NNN.md`

```markdown
# AUDIT-[NNN]: [SHORT TITLE]
**Date:** [ISO date]
**Trigger:** Task completion | Fix batch | Test failure | Pre-merge | Scheduled
**Scope:** [What was audited]

## Build Status
| Check | Result | Notes |
|-------|--------|-------|
| `bun run typecheck` | PASS/FAIL | |
| `bun run lint` | PASS/FAIL | |
| `bun test` | PASS/FAIL (N/N passing) | |
| `bun run build` | PASS/FAIL | |

## Critical Bugs
### BUG-N: [Title]
**File:** `[path]` | **Line:** [N]
**Issue:** [Description]
**Fix:** [What needs to change]

## Recommended Fix Order
1. **P1 — Blocking:** [fixes]
2. **P2 — Core flow:** [fixes]
3. **P3 — Important:** [fixes]

## Summary
[One paragraph diagnosis]
```

---

## Fix Traceability

### Fix tickets — `docs/fixes/FIX-NNNN.md`

```markdown
# FIX-[NNNN]: [SHORT TITLE]
**Audit ref:** AUDIT-[NNN], [BUG-N]
**Assigned to:** Backend | Frontend | AI Engine
**Priority:** P1-P4
**Status:** pending | applied | verified | failed | reverted

## Problem
[2-3 sentences — issue + impact]

## Root cause
[WHY, not just WHAT]

## Required change
[Precise description with before/after]

## Verification
1. [Specific check]
```

### Fix log — `docs/fixes/FIX-LOG.md`

Append-only table. Never edit past rows.

```
| Fix ID | Date | Audit Ref | Assigned To | File(s) | Issue | Status |
```

Status: `pending → applied → verified → failed → reverted`

---

## Re-plan Triggers

Stop fixing individual issues and escalate when:
1. 2+ fixes fail for the same subsystem
2. 5+ issues trace to the same root cause
3. A fix breaks another area
4. An agent is blocked for more than one phase
5. Performance budget consistently missed

Re-plan: document why patches aren't working → identify architectural root cause → propose revised approach → get Adrian's approval before resuming.

---

## Rollback Playbook

| Severity | Action |
|----------|--------|
| S1 — Production down | `git revert [hash]` immediately |
| S2 — Core flow broken | Revert commit, investigate root cause |
| S3 — Non-critical regression | Keep, create follow-up fix ticket |
| S4 — Cosmetic | Note it, fix in next batch |

---

## Task Queue Format

Each build agent has `docs/tasks/[agent]-tasks.md`. Three sections: Pending → In Progress → Recently Completed.

### New task entry

```markdown
### [DATE] — [Task title]
**Priority:** critical / high / medium / low | **Source:** audit / sprint / ad-hoc
**Created by:** cody | **Created:** [ISO timestamp]

#### Context
[Why this task exists]

#### Directive
[Exactly what to do]

#### Expected output
[What the commit should contain]
```

### Completion update

```markdown
### [DATE] — [Task title]
**Completed:** [ISO timestamp] | **Commit:** [hash] | **Tests:** [pass/fail]
**Notes:** [tech debt, edge cases, follow-up]
```

---

## Build Tickets

Maintain `docs/tickets/BUILD-TICKETS.md` as the project kanban. Sections: Backlog → In Progress → Done → Blocked. Keep in sync with vault project log.

---

## Self-Improvement

### Project learnings — `docs/learnings.md`

After non-trivial debugging (>15 min) or architectural decisions:

```markdown
## [ISO date] — [Pattern name]
**Found in:** AUDIT-[NNN]
**Pattern:** [What went wrong — recurring behavior]
**Root cause:** [Why]
**Prevention:** [Instruction change]
```

Read on boot. If pattern marked `Applied: no`, update dispatch prompts.

### Cross-project patterns

Same pattern in 2+ projects → update shared methodology. Same issue 3+ times in FIX-LOG → write a learning entry.

---

## Status File Schema

`../../shared/.cody-status-[project].json`:

```json
{
  "project": "forge-scanner",
  "session": "forge-build-forge-scanner",
  "timestamp": "ISO-8601",
  "status": "working | idle | depleted | error",
  "context_pct": 45,
  "last_commit": "abc1234",
  "last_commit_msg": "fix: null check on annotations",
  "current_task": "description",
  "tasks_remaining": 3,
  "alive": true
}
```

Write after: every commit, starting/finishing tasks, errors, context <10%, boot.

---

## Key Paths

### From project directory:

```
./CLAUDE.md                    ← Project rules (auto-loaded)
./docs/
│   ├── SPEC.md                ← What you're building
│   ├── tasks/                 ← Build agent task queues
│   ├── audits/                ← AUDIT-NNN reports
│   ├── fixes/                 ← FIX-LOG.md + FIX-NNNN tickets
│   ├── tickets/BUILD-TICKETS.md
│   └── learnings.md           ← Error patterns
```

### Vault paths (via ../../):

```
../../build/orchestrator/CLAUDE.md       ← This identity
../../build/orchestrator/procedures.md   ← This file
../../canon/                             ← Business truth
../../shared/inbox/                      ← Agent output queue
../../shared/project-logs/               ← Project status
../../knowledge/briefings/               ← Agent briefings
```
