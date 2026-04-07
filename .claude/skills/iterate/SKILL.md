---
name: iterate
description: Iterative refinement loop. Evaluates a file against quality parameters, identifies weaknesses, builds improved versions, and tracks progress. Use when you want to systematically improve any file — prototypes, components, CSS, API routes, prompts, anything.
argument-hint: [count|--until-N] [file-path] [--focus "params"] [--foreground]
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent
context: fork
agent: general-purpose
disable-model-invocation: true
---

# /iterate — Iterative Refinement Loop

You are executing a disciplined iteration cycle on a target file. Each iteration must produce a GENUINELY improved version — not micro-tweaks. If someone opens two consecutive versions side by side and can't immediately see what changed, the iteration failed.

## Parse Arguments

- `$ARGUMENTS` contains: `[count|--until-N] [file-path] [--focus "params"] [--foreground]`
- **Count mode**: First arg is a number (e.g., `15`) — do exactly that many iterations
- **Threshold mode**: First arg is `--until-N` (e.g., `--until-8`) — keep iterating until ALL parameter scores are ≥ N, max 50 iterations
- **File path**: The file to iterate on (required)
- **--focus "param1,param2,param3"**: Custom evaluation parameters (optional, overrides auto-detected defaults)
- **--foreground**: If present, this is running in the main conversation (already handled by the skill system)

## Step 1: Read & Understand the Target

Read the target file. Determine what type of file it is:
- `.html` / `.css` → frontend/visual (load `eval-params/frontend.md`)
- `.tsx` / `.ts` in `src/components/` → React component (load `eval-params/frontend.md`)
- `.ts` in `src/app/api/` or `src/lib/` → backend logic (load `eval-params/backend.md`)
- `.ts` in `src/lib/prompts/` → AI prompt (load `eval-params/prompts.md`)
- Anything else → generic (load `eval-params/generic.md`)

If `--focus` was provided, use those parameters INSTEAD of the defaults.

Load the appropriate eval-params file from: `${CLAUDE_SKILL_DIR}/eval-params/`

## Step 2: Create Output Structure

Create the output directory:
```
{directory-of-target-file}/iterations/{filename-without-extension}/
```

Example: iterating on `src/components/scan/ScreenshotCard.tsx` creates:
```
src/components/scan/iterations/ScreenshotCard/
  v001.tsx
  v002.tsx
  ...
  ITERATION-LOG.md
```

Copy the target file as `v001.{ext}`.

## Step 3: Evaluate v001 (Baseline)

Score the baseline against every evaluation parameter (1-10 each). Calculate total. Log in ITERATION-LOG.md using the template from `${CLAUDE_SKILL_DIR}/templates/iteration-log.md`.

## Step 4: The Iteration Loop

For each iteration (v002, v003, ...):

### 4a. Identify Weaknesses
Find the 2-3 parameters with the LOWEST scores. These are your targets.

### 4b. Write a Specific Brief
Write 2-3 sentences describing EXACTLY what will change and why. This brief must:
- Name the specific parameters being improved
- Describe the concrete change (not "make it better" — "add device chrome frames to screenshots to improve Premium Feel")
- Be different from any previous brief that was tried

### 4c. Build the New Version
Copy the BEST-SO-FAR version (not necessarily the previous version) as the base. Apply the changes described in the brief. Save as the next version number.

### 4d. Re-evaluate
Score the new version against all parameters. Calculate total.

### 4e. Compare & Decide
- If total score IMPROVED: this becomes the new best-so-far. Continue.
- If total score DECREASED: note the regression. Next iteration MUST base on the previous best-so-far and try a COMPLETELY DIFFERENT approach. Never repeat a failed approach.
- If total score is within ±1 of previous: force a STRUCTURAL change in the next iteration — the current approach has plateaued.

### 4f. Log
Append to ITERATION-LOG.md with scores, brief, and result.

### 4g. Check Stop Conditions
- **Count mode**: Stop after N iterations
- **Threshold mode**: Stop when ALL parameter scores ≥ threshold, or after 50 iterations (whichever first)

## Step 5: Report

When complete, output:
```
## Iteration Complete

**Target:** {file path}
**Versions:** v001 → v{NNN}
**Best version:** v{NNN} ({score}/{max})
**Score progression:** v001({N}) → v002({N}) → ... → v{NNN}({N})
**Output:** {output directory path}

### Top 3 improvements made:
1. {description}
2. {description}
3. {description}
```

## Hard Rules

1. **Each iteration must be visibly different.** CSS value tweaks (changing 80px to 82px) don't count. If you can't see the difference in the browser or by reading the code, it's not an iteration.

2. **Never repeat a failed approach.** If adding X made things worse, don't try adding X again with slightly different values. Try something completely different.

3. **The brief comes BEFORE the code.** Write what you're going to do, then do it. Don't code first and justify later.

4. **Best-so-far is sacred.** Always base new iterations on the best version, not just the most recent. Track this carefully.

5. **Log everything.** Every iteration gets scored, briefed, and logged. No exceptions.

6. **Quality over quantity.** 5 genuine iterations beat 50 micro-tweaks. If you're running out of meaningful improvements, stop early and say so.
