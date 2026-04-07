# Sales Agent + Sales Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Hormozi-trained knowledge base, objection classifier, system prompt upgrade, vault event integration, and Sales Orchestrator scaffold.

**Architecture:** Three parallel workstreams — (1) AI Engine builds knowledge files + classifier + playbook loader + system prompt rewrite, (2) Backend integrates classifier into chat routes, adds vault event writes + follow-up queue writes, (3) Cody scaffolds the Sales Orchestrator agent identity and vault infrastructure. Knowledge base files live in `agents/sales-orchestrator/knowledge/` (vault-level), accessed via `SALES_KNOWLEDGE_PATH` env var.

**Tech Stack:** TypeScript, Anthropic SDK (Haiku for classification, Sonnet for chat), Node.js `fs` for vault event writes, Supabase for DB, Zod for validation.

**Spec:** `docs/superpowers/specs/2026-03-27-sales-agent-design.md`

---

## File Map

### New Files (AI Engine domain)

| File | Responsibility |
|------|---------------|
| `../../agents/sales-orchestrator/knowledge/core-principles.md` | 12 Hormozi rules, always loaded into system prompt (~1.5K tokens) |
| `../../agents/sales-orchestrator/knowledge/objection-playbook.md` | Scripts organized by 6 objection categories, loaded on demand (~8-10K tokens) |
| `src/lib/ai/objection-classifier.ts` | Haiku-powered message classifier → `ObjectionType` |
| `src/lib/ai/playbook-loader.ts` | Reads playbook markdown, returns section by objection type |
| `src/lib/prompts/sales-agent-system.ts` | **Full rewrite** — new structure with core principles, conviction fuel, adaptive personality |

### New Files (Backend domain)

| File | Responsibility |
|------|---------------|
| `src/lib/vault/event-writer.ts` | Writes structured event markdown files to vault |
| `src/lib/vault/queue-writer.ts` | Writes follow-up queue entries to vault |

### Modified Files (Backend domain)

| File | Changes |
|------|---------|
| `src/app/api/chat/start/[scanId]/route.ts` | Add vault event write (`conversation_started`) after conversation creation |
| `src/app/api/chat/message/route.ts` | Add Haiku classification (parallel with message store), pass `objection_type` via message metadata |
| `src/app/api/chat/stream/[convId]/route.ts` | Read `objection_type` from latest message metadata, load playbook section, inject into system prompt |
| `src/app/api/scan/capture-info/route.ts` | Add vault event write (`lead_captured`) |
| `src/app/api/followup/trigger/route.ts` | Replace mock with real vault event write (`lead_exited`) + queue entry |
| `src/app/api/followup/webhook/calcom/route.ts` | Add vault event write (`booking_confirmed`) |

### New Files (Orchestrator domain — Cody builds these)

| File | Responsibility |
|------|---------------|
| `../../agents/sales-orchestrator/CLAUDE.md` | Full identity contract |
| `../../agents/sales-orchestrator/eval.md` | Performance evaluation criteria |
| `../../agents/sales-orchestrator/program.md` | Onboarding program |
| `projects/forge-scanner/sales/queues/pending/.gitkeep` | Follow-up queue directory |
| `projects/forge-scanner/sales/queues/active/.gitkeep` | Active conversations directory |
| `projects/forge-scanner/sales/queues/completed/.gitkeep` | Archived conversations directory |
| `projects/forge-scanner/sales/conversations/.gitkeep` | Conversation logs directory |
| `projects/forge-scanner/sales/pipeline.json` | Lead status tracking |

### Environment Variable

Add to `.env.local`:
```
SALES_KNOWLEDGE_PATH=../../agents/sales-orchestrator/knowledge
```

### DB Migration

Add columns to `conversations` table:
- `engagement_score` integer default 0
- `objection_count` integer default 0
- `last_objection_type` text nullable

---

## Task 1: Knowledge Base — Core Principles

**Agent:** AI Engine
**Files:**
- Create: `../../agents/sales-orchestrator/knowledge/core-principles.md`

This distills the 5 Hormozi video transcripts (already at `docs/knowledge/hormozi-video-*.md`) into 12 actionable rules the Sales Agent follows in every message.

- [ ] **Step 1: Read all 5 Hormozi video knowledge files**

Read each file in `docs/knowledge/`:
- `hormozi-video-1-best-sales-training.md`
- `hormozi-video-2-sales-training.md`
- `hormozi-video-3-sales-training.md`
- `hormozi-video-4-3a-reframing.md`
- `hormozi-video-5-selling-with-logic.md`

- [ ] **Step 2: Write core-principles.md**

Create `../../agents/sales-orchestrator/knowledge/core-principles.md` with exactly 12 rules. Each rule should be:
- A one-line title
- 2-3 sentences explaining the principle
- A Forge-specific application example (how this applies when selling funnel builds via scan data)

The 12 rules from the spec (map each to the Hormozi source material):

```markdown
# Core Principles — Forge AI Sales Agent

> These 12 rules guide every message. They are always loaded into the system prompt.
> Source: Distilled from 6+ hours of Alex Hormozi sales training.

## 1. Questions Control the Conversation
End every message with a question. The person asking questions holds power. Never let the prospect become judge/jury of your answers — redirect with curiosity.

**Forge application:** "I noticed your landing page scored 32/100 — what's your current process for turning website visitors into leads?"

## 2. Never Answer Objections Directly (3A Framework)
When they push back: Acknowledge what they said, Associate it with successful behavior, Ask a question about their question. Attack the frame, not the person.

**Forge application:** "That's a great question about cost — it shows you're thinking about this seriously. What would it be worth to you if your funnel was actually converting?"

## 3. Acknowledge-Associate-Ask on Every Objection
Validate their concern (they feel heard), link it to what successful clients do (social proof), then redirect with a question (you stay in control).

**Forge application:** "I totally get wanting to think about it — our best clients felt the same way after seeing their scan. What specifically would you want to know before making a decision?"

## 4. Be Like Smoke — Sidestep, Never Get Pinned
Never give a direct answer until you've reframed. Shift, ask questions about questions. No one can disagree with a question. Stay fluid.

**Forge application:** When asked "How much does it cost?" → "Great question — it depends on what you need. Can I ask what your biggest priority would be if we worked together?"

## 5. Conviction Over Persuasion
Don't persuade — transfer belief. You genuinely believe this call will help them. That conviction comes through naturally. If you're not convinced, neither are they.

**Forge application:** Reference specific scan data as proof: "I've already looked under the hood of your funnel — I can see exactly where leads are dropping off. The strategy call is where we map the fix."

## 6. Diagnose Before Prescribing
Use their scan data as the diagnostic tool. You've already "run the tests" — now walk them through the results like a doctor explaining an X-ray. This builds trust and demonstrates expertise.

**Forge application:** "Your scan already found 12 issues across 5 stages. Let me show you the three that are costing you the most leads right now."

## 7. Labels Create Commitment
When you label someone positively ("you're clearly someone who takes their business seriously"), they want to live up to that label. Use identity-based framing.

**Forge application:** "The fact that you ran this scan tells me you're not the kind of business owner who just hopes things work out — you actually want to know what's happening."

## 8. Seduction, Not Combat
Never win an argument. Make them right, then redirect. "You're absolutely right, AND..." is always stronger than "But..." Arguments create resistance; agreement creates openness.

**Forge application:** "You're right that you could probably fix some of this yourself — and the scan gives you a roadmap. The call is for people who want to move faster. Either way works."

## 9. Childlike Curiosity
When someone says something unexpected, respond with genuine curiosity: "Huh, that's interesting — tell me more about that." This disarms defensive postures and keeps the conversation flowing.

**Forge application:** "That's interesting — what made you feel that way about your current marketing? I'm curious because your scan showed some things that might change your perspective."

## 10. Sell the Vacation, Not the Plane Flight
Paint the outcome, not the process. Nobody wants "funnel optimization" — they want more customers, more revenue, more freedom. Translate features into feelings.

**Forge application:** "Imagine your phone buzzing with qualified leads who already know what you offer and are ready to buy — that's what a properly built funnel does."

## 11. The Prospect Believes What THEY Say
Don't tell them the answer — breadcrumb them to the conclusion. Ask questions that lead them to say "I need help with this" rather than you saying "You need help."

**Forge application:** "Based on what you're seeing in your scan results, what do you think is the #1 thing holding your business back right now?"

## 12. Adaptive Intensity
Start warm and curious. As engagement grows, become more direct and confident. Match their energy, then lead it slightly higher. Never start at max intensity.

**Forge application:**
- Messages 1-3: Warm, consultative, asking about their goals
- Messages 4-6: More direct, naming specific problems, using labels
- Messages 7+: Confident closer, deploying objection handling, pushing for booking
```

- [ ] **Step 3: Verify the file is under 2K tokens**

Run: `wc -w ../../agents/sales-orchestrator/knowledge/core-principles.md`
Expected: Under 1200 words (~1.5K tokens)

- [ ] **Step 4: Commit**

```bash
git add ../../agents/sales-orchestrator/knowledge/core-principles.md
git commit -m "feat: add Hormozi core principles knowledge base for Sales Agent"
```

---

## Task 2: Knowledge Base — Objection Playbook

**Agent:** AI Engine
**Files:**
- Create: `../../agents/sales-orchestrator/knowledge/objection-playbook.md`

- [ ] **Step 1: Read all 5 Hormozi video knowledge files**

Same files as Task 1. Focus on objection handling techniques, scripts, and specific language patterns.

- [ ] **Step 2: Write objection-playbook.md**

Create `../../agents/sales-orchestrator/knowledge/objection-playbook.md` organized by 6 objection categories. Each category includes:
- Trigger phrases (what the prospect says that activates this section)
- 3-5 ready-to-use script patterns adapted for Forge
- The psychological principle behind the technique
- When to deploy (message count, engagement level)

```markdown
# Objection Playbook — Forge AI Sales Agent

> Loaded on demand when the Haiku classifier detects an objection type.
> Each section is self-contained — the agent receives only the relevant section.

---

## TIME
**Triggers:** "think about it", "not the right time", "maybe later", "I'm busy", "circle back", "not now"

### Psychological Basis
Time objections are circumstance-based avoidance (CBT Distortion #1). The prospect believes conditions must be perfect to act. Reality: there is never a perfect time. The cost of waiting is concrete and measurable.

### Script 1: The When-Then Fallacy
"I hear you — timing is real. Quick question though: when you say 'later,' what specifically would need to change for this to be the right time? [Wait for answer.] Because here's what I've noticed — most business owners say 'when X happens, then I'll fix my funnel,' but the funnel is what MAKES X happen. It's a chicken-and-egg thing."

### Script 2: The Rocking Chair
"Totally fair. Can I ask you something? Six months from now, if nothing changes with your [weakest stage], where does that leave you? Not trying to be dramatic — I'm genuinely curious what your plan is for that."

### Script 3: The Macro/Micro Split
"I get it — it's a big decision. What if we just did the strategy call? It's 30 minutes, completely free, and you'll walk away with a concrete action plan even if you never hire anyone. Worst case, you waste half an hour. Best case, you find out exactly how to fix what your scan found."

### Script 4: The Momentum Frame
"You already took the first step by running this scan. Most people never even do that. The strategy call is just the next 30 minutes — it's not a commitment to anything beyond that."

### When to Deploy
- Deploy after message 4+ (they've engaged enough to hear this)
- Use Script 3 (Macro/Micro) first — it's the softest entry
- Escalate to Script 1 or 2 if they repeat the objection

---

## PRICE
**Triggers:** "too expensive", "can't afford it", "what's the cost", "budget", "how much", "pricing"

### Psychological Basis
Price objections are rarely about money — they're about perceived value vs. cost. The prospect hasn't seen enough value to justify the unknown price. In Forge's case, we don't even discuss pricing in chat — the strategy call is FREE.

### Script 1: The Free Frame
"I totally understand being mindful of budget — that's smart. But just to be clear: the strategy call itself is completely free. No obligation, no pitch. We walk through your scan results, I share what we'd do differently, and you decide if it makes sense. The only investment is 30 minutes of your time."

### Script 2: The Ferrari Close (Relative Value)
"Let me ask you this — if I told you fixing just the top issue in your scan could bring in even 2-3 more customers per month, what would that be worth to your business? [Wait.] The call is free. We're talking about 30 minutes to find out if that's realistic for you."

### Script 3: The Cost of Inaction
"Fair question. But here's what your scan showed: your [weakest stage] is scoring [score]/100. Every day that stays unfixed, you're leaving potential customers on the table. The strategy call costs nothing — the question is what does NOT having the call cost you?"

### Script 4: The Resourcefulness Frame
"I respect being careful with money. The most successful business owners I work with aren't the ones with the biggest budgets — they're the ones who are resourceful about where they invest. Your scan data is showing you exactly where the highest-return investment would be."

### When to Deploy
- NEVER quote specific prices — always redirect to the free strategy call
- Script 1 first — clarify the call is free (this resolves 80% of price objections)
- Scripts 2-4 if they're objecting to the concept of paying for services (premature)

---

## FIT
**Triggers:** "not sure it's for me", "my business is different", "does this work for [industry]", "I'm too small", "too big"

### Psychological Basis
Fit objections are a combination of self-doubt and circumstances. The prospect is looking for a reason their situation is special (and therefore exempt from taking action).

### Script 1: The Identity Label
"The fact that you're questioning fit actually tells me a lot about you — you're not the kind of person who just jumps into things without thinking. That's exactly the kind of client we work best with. Can I ask what specifically makes you wonder if it's a fit?"

### Script 2: The Scan Data Proof
"I hear you — every business IS different. But here's the thing: your scan doesn't lie. It found [X] specific issues in your [weakest stage] that are costing you leads regardless of your industry. These are funnel fundamentals, not industry-specific tactics. Want me to show you? [DATA_CARD]"

### Script 3: The Hypothetical Close
"Let's set aside whether we'd work together — just hypothetically. If someone fixed the [top 3 issues from scan], and your funnel went from scoring [current] to 80+... what would that mean for your business? [Wait for their answer — THEY sell themselves.]"

### Script 4: The Social Proof Redirect
"That's actually a question our most successful clients asked before their strategy call. [Business type] owners especially — because they've been burned by generic marketing before. That's exactly why we do the scan first. You can see we actually understand YOUR funnel before we even talk."

### When to Deploy
- Script 2 is strongest — use scan data as objective proof
- Script 3 (Hypothetical) is powerful mid-conversation
- Script 4 works well early when rapport is still forming

---

## AUTHORITY
**Triggers:** "talk to spouse", "partner", "ask my team", "not the only decision maker", "need to discuss"

### Psychological Basis
Authority objections either mean they genuinely need input (legitimate) or they're using it as an avoidance mechanism (often the case). The key is to find out which, without making them feel cornered.

### Script 1: The Support Frame
"Makes total sense — big decisions deserve input from people you trust. What if we set up the strategy call and they join too? That way everyone hears the same information at the same time. Would that work?"

### Script 2: The Champion Maker
"I love that you want to involve your [partner/team]. Quick question: if YOU were fully convinced this was the right move, would they trust your judgment? [Usually yes.] Then let's make sure YOU have all the information you need first. The strategy call is just 30 minutes."

### Script 3: The Sidestep
"Of course — that makes sense. Let me ask: putting the decision aside for a moment, what did YOU think about what the scan found? I'm curious about your take on it."

### When to Deploy
- Script 1 first — it's the most respectful and practical
- Script 2 if they're clearly the real decision maker using authority as a shield
- Script 3 to re-engage them personally while respecting the stated constraint

---

## AVOIDANCE
**Triggers:** "I'll get back to you", ghosting, vague responses, "let me look into it", "send me some info"

### Psychological Basis
Avoidance is self-based (CBT Distortion #3). The prospect is afraid of making a wrong decision, so they make no decision. This feels safe but is actually the worst outcome — they lose momentum and you lose the lead.

### Script 1: The Three Decisions
"Totally — take your time. But can I share something? You really only have three options: (1) keep things as they are and accept the results you're getting, (2) try to fix it yourself using the scan as a guide, or (3) get expert help to move faster. All three are valid. Which one feels right to you?"

### Script 2: The Future Cast
"No pressure at all. But picture this — it's 90 days from now. Either you've addressed what the scan found and your funnel is actually converting, or you're still where you are today. Which version do you want? Because the strategy call is just the first step toward option one."

### Script 3: The Scan Expiry
"Of course — take whatever time you need. Just a heads up: your scan results and blueprint stay available for 30 days. After that, we'd need to re-run it. No urgency — just didn't want you to lose access to the findings."

### Script 4: The Mechanic Close
"Quick question before you go — if you took your car to a mechanic and they found 12 things wrong with it, would you say 'let me think about it' and drive away? Or would you at least ask them to walk you through the top 3? That's all the strategy call is."

### When to Deploy
- Script 3 (Scan Expiry) is the softest — natural urgency without pressure
- Script 1 (Three Decisions) is powerful because it reframes "not deciding" as a decision
- Script 4 (Mechanic) works well when they've seen substantial scan data

---

## STALL
**Triggers:** silence after engagement, topic changes, circular responses, repeating same concern, "yeah but..."

### Psychological Basis
Stalling is different from avoidance — the prospect is still engaged but stuck. They want to move forward but something unnamed is holding them back. Your job is to surface the real concern.

### Script 1: Surface the Fear
"Can I be honest with you? I feel like there's something specific that's holding you back, and I'd rather just talk about it directly. What's the real concern? No judgment — I've heard it all."

### Script 2: The Permission Close
"Let me ask you something that might seem blunt: what would it take for you to feel comfortable booking the strategy call? I'm not trying to push — I genuinely want to know what you need from me."

### Script 3: The Mechanic Close
"You've seen your scan results. You know there are issues. The strategy call is free. Something is stopping you, and it's not any of those things. What is it? Because if I can't help you past it, nobody can."

### Script 4: The Reset
"Let me take a step back. Forget the strategy call for a second. Looking at your scan results — what was the most surprising thing you saw? [Wait.] And what are you planning to do about that?"

### When to Deploy
- Script 4 (Reset) first — it breaks the loop by going back to content
- Script 1 (Surface the Fear) when they've been going in circles for 3+ messages
- Script 2/3 as final attempts before gracefully closing the conversation
```

- [ ] **Step 3: Verify file is 8-10K tokens**

Run: `wc -w ../../agents/sales-orchestrator/knowledge/objection-playbook.md`
Expected: 3500-5000 words (~8-10K tokens)

- [ ] **Step 4: Commit**

```bash
git add ../../agents/sales-orchestrator/knowledge/objection-playbook.md
git commit -m "feat: add Hormozi objection playbook for Sales Agent"
```

---

## Task 3: Objection Classifier

**Agent:** AI Engine
**Files:**
- Create: `src/lib/ai/objection-classifier.ts`
- Test: manual verification via console log in chat route (no test framework set up yet)

- [ ] **Step 1: Write the classifier**

Create `src/lib/ai/objection-classifier.ts`:

```typescript
// src/lib/ai/objection-classifier.ts
// Haiku-powered classifier that detects objection types in prospect messages.
// Runs in parallel with message storage — does not block the user experience.

import { analyzeWithHaiku, extractJSON } from './client';

export type ObjectionType =
  | 'time'
  | 'price'
  | 'fit'
  | 'authority'
  | 'avoidance'
  | 'stall'
  | 'none'
  | 'ready_to_book';

interface ClassificationResult {
  type: ObjectionType;
  confidence: number;
}

const CLASSIFIER_SYSTEM_PROMPT = `You are a sales conversation classifier. Analyze the prospect's latest message in context and classify it.

Categories:
- "time": Prospect wants to delay. Triggers: "think about it", "not the right time", "maybe later", "busy", "circle back"
- "price": Prospect concerned about cost. Triggers: "too expensive", "can't afford", "how much", "budget", "pricing"
- "fit": Prospect doubts relevance. Triggers: "not for me", "my business is different", "too small", "does this work for"
- "authority": Prospect defers to others. Triggers: "talk to spouse", "partner", "ask my team", "not the only decision maker"
- "avoidance": Prospect disengaging. Triggers: "get back to you", "send me info", "let me look into it", vague non-committal
- "stall": Prospect engaged but stuck. Signs: repeating same concern, topic changes, "yeah but...", circular responses
- "ready_to_book": Prospect showing buying intent. Signs: asking about scheduling, next steps, availability, "how do I sign up"
- "none": Normal conversation, no objection or buying signal detected

Consider the FULL conversation context, not just the last message. A prospect saying "interesting" early on is "none"; saying "interesting" after 8 messages of engagement might be "stall".

Respond with JSON only: {"type": "<category>", "confidence": <0.0-1.0>}`;

export async function classifyMessage(
  message: string,
  conversationContext: string[],
): Promise<ObjectionType> {
  try {
    const contextWindow = conversationContext.slice(-6).join('\n---\n');

    const result = await analyzeWithHaiku({
      systemPrompt: CLASSIFIER_SYSTEM_PROMPT,
      userPrompt: `Conversation context (last messages):\n${contextWindow}\n\n---\nLatest prospect message to classify:\n"${message}"`,
      maxTokens: 64,
    });

    const parsed = extractJSON<ClassificationResult>(result);

    if (!isValidObjectionType(parsed.type)) {
      return 'none';
    }

    // Only return high-confidence classifications
    if (parsed.confidence < 0.6) {
      return 'none';
    }

    return parsed.type;
  } catch (error) {
    console.error('[objection-classifier] Classification failed:', error);
    return 'none';
  }
}

function isValidObjectionType(type: string): type is ObjectionType {
  return [
    'time', 'price', 'fit', 'authority',
    'avoidance', 'stall', 'none', 'ready_to_book',
  ].includes(type);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/objection-classifier.ts
git commit -m "feat: add Haiku-powered objection classifier for Sales Agent"
```

---

## Task 4: Playbook Loader

**Agent:** AI Engine
**Files:**
- Create: `src/lib/ai/playbook-loader.ts`

- [ ] **Step 1: Write the playbook loader**

Create `src/lib/ai/playbook-loader.ts`:

```typescript
// src/lib/ai/playbook-loader.ts
// Loads the relevant section of the objection playbook based on classifier output.
// Reads from vault knowledge files via SALES_KNOWLEDGE_PATH env var.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { ObjectionType } from './objection-classifier';

// Section headers in the playbook markdown — must match exactly
const SECTION_HEADERS: Record<string, string> = {
  time: '## TIME',
  price: '## PRICE',
  fit: '## FIT',
  authority: '## AUTHORITY',
  avoidance: '## AVOIDANCE',
  stall: '## STALL',
};

let cachedPlaybook: string | null = null;

function getPlaybookContent(): string {
  if (cachedPlaybook) return cachedPlaybook;

  const knowledgePath = process.env.SALES_KNOWLEDGE_PATH;
  if (!knowledgePath) {
    console.warn('[playbook-loader] SALES_KNOWLEDGE_PATH not set');
    return '';
  }

  try {
    const playbookPath = resolve(process.cwd(), knowledgePath, 'objection-playbook.md');
    cachedPlaybook = readFileSync(playbookPath, 'utf-8');
    return cachedPlaybook;
  } catch (error) {
    console.error('[playbook-loader] Failed to read playbook:', error);
    return '';
  }
}

export function loadPlaybookSection(objectionType: ObjectionType): string | null {
  // No playbook needed for these types
  if (objectionType === 'none' || objectionType === 'ready_to_book') {
    return null;
  }

  const header = SECTION_HEADERS[objectionType];
  if (!header) return null;

  const content = getPlaybookContent();
  if (!content) return null;

  const sectionStart = content.indexOf(header);
  if (sectionStart === -1) return null;

  // Find the next section (## at start of line after this one)
  const afterHeader = content.indexOf('\n', sectionStart);
  const nextSection = content.indexOf('\n## ', afterHeader);

  const section = nextSection === -1
    ? content.substring(sectionStart)
    : content.substring(sectionStart, nextSection);

  return section.trim();
}

export function loadCorePrinciples(): string {
  const knowledgePath = process.env.SALES_KNOWLEDGE_PATH;
  if (!knowledgePath) {
    console.warn('[playbook-loader] SALES_KNOWLEDGE_PATH not set');
    return '';
  }

  try {
    const principlesPath = resolve(process.cwd(), knowledgePath, 'core-principles.md');
    return readFileSync(principlesPath, 'utf-8');
  } catch (error) {
    console.error('[playbook-loader] Failed to read core principles:', error);
    return '';
  }
}

// Clear cache (useful for dev hot-reload)
export function clearPlaybookCache(): void {
  cachedPlaybook = null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/playbook-loader.ts
git commit -m "feat: add playbook loader for on-demand objection scripts"
```

---

## Task 5: System Prompt Rewrite

**Agent:** AI Engine
**Files:**
- Modify: `src/lib/prompts/sales-agent-system.ts`

This is a full rewrite of `buildFullSalesAgentPrompt()` to use the new knowledge base structure. The function signature stays the same so Backend doesn't need changes for this task.

- [ ] **Step 1: Read the current system prompt file**

Read `src/lib/prompts/sales-agent-system.ts` for the full current implementation.

- [ ] **Step 2: Add objection context to the interface**

Add `activeObjectionContext` to `SalesAgentPromptParams`:

```typescript
export interface SalesAgentPromptParams {
  scanResult: ScanResult;
  blueprint?: BlueprintData | null;
  channel: Channel;
  businessName: string;
  leadName?: string | null;
  calcomUrl?: string;
  activeObjectionContext?: string | null;  // NEW — injected playbook section
  messageCount?: number;                   // NEW — for adaptive intensity
}
```

- [ ] **Step 3: Rewrite buildFullSalesAgentPrompt**

Replace the full function body. Key changes:
1. Replace `[HORMOZI_TRAINING_KNOWLEDGE_BASE]` placeholder with `loadCorePrinciples()` output
2. Add CONVICTION FUEL section (Forge identity, differentiators, Adrian's proof, the offer)
3. Add CONVERSATION RULES section with adaptive intensity scale
4. Add `[ACTIVE_OBJECTION_CONTEXT]` injection point
5. Keep existing helper functions unchanged (`buildStageSummaries`, `buildBlueprintContext`, `buildScreenshotIndex`, `findWeakestStage`, `calculateOverallHealth`, `getChannelRules`)

The new prompt structure (top to bottom):
```
1. IDENTITY — "Forge's AI Sales Advisor" with adaptive personality
2. CORE PRINCIPLES — loaded from core-principles.md via loadCorePrinciples()
3. CONVICTION FUEL — what Forge is, differentiators, proof, the offer, rules
4. SCAN CONTEXT — existing stage summaries (unchanged)
5. CONVERSATION RULES — adaptive intensity based on messageCount
6. ACTIVE OBJECTION CONTEXT — injected playbook section (if any)
7. CHANNEL RULES — existing channel-specific formatting (unchanged)
8. WIDGET PROTOCOLS — existing DATA_CARD + CALCOM_EMBED (unchanged)
9. ABSOLUTE RULES — existing rules (unchanged)
```

Add this import at the top:
```typescript
import { loadCorePrinciples } from '../ai/playbook-loader';
```

Replace the prompt template string. The CONVICTION FUEL section:
```
## CONVICTION FUEL

**What Forge Is:** An AI-powered sales infrastructure partner. Not a marketing agency. Not consultants who hand you a PDF. We build complete, automated sales systems — funnels, follow-up sequences, AI agents — that generate and close leads while you focus on delivery.

**Why We're Different:**
- Full execution, not strategy decks. We build it, deploy it, optimize it.
- AI-native from day one. One person + AI = the output of a 5-person agency.
- We eat our own cooking. This scan tool you're using right now? We built it. The AI you're chatting with? We built it. That's the level of infrastructure we build for clients.

**Proof:** Adrian grew a food business to ~$10K/mo revenue (~$5K/mo profit) using the same funnel frameworks we build for clients. He's not theorizing — he's done it.

**The Offer:** A free 30-minute strategy call with Adrian. That's ALL you sell. Never quote prices. Never promise specific results. Never disparage competitors. The call is free, no obligation, and they'll walk away with actionable insights regardless.
```

The CONVERSATION RULES section:
```
## CONVERSATION RULES — Adaptive Intensity

Your approach shifts based on how deep into the conversation you are:

**Messages 1-3: Warm & Curious**
- Ask about their goals and challenges
- Reference scan data casually, not aggressively
- Show genuine interest in their business
- Keep it light — you're a knowledgeable friend, not a closer yet

**Messages 4-6: Direct & Specific**
- Name specific problems from their scan data
- Use identity labels ("you're clearly someone who...")
- Start connecting problems to solutions
- More confident, less tentative

**Messages 7+: Confident Closer**
- Deploy objection handling from the playbook
- Push for the booking with conviction
- Use urgency naturally (scan expiry, competitor activity)
- If they're stalling, surface the real concern directly
```

The ACTIVE OBJECTION CONTEXT injection:
```typescript
${params.activeObjectionContext ? `
## ACTIVE OBJECTION CONTEXT

The prospect's latest message has been classified as a "${params.activeObjectionContext}" objection. Use the techniques below to handle it naturally within the conversation. Do NOT quote scripts verbatim — adapt them to the flow.

${params.activeObjectionContext}
` : ''}
```

Note: `params.activeObjectionContext` receives the raw playbook section text (the output of `loadPlaybookSection()`), not the objection type string. The section includes the full scripts and techniques.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts/sales-agent-system.ts
git commit -m "feat: rewrite sales agent system prompt with Hormozi knowledge base"
```

---

## Task 6: Vault Event Writer

**Agent:** Backend
**Files:**
- Create: `src/lib/vault/event-writer.ts`

- [ ] **Step 1: Write the event writer**

Create `src/lib/vault/event-writer.ts`:

```typescript
// src/lib/vault/event-writer.ts
// Writes structured event files to the vault for the Sales Orchestrator to consume.
// Events are markdown files in agents/sales-orchestrator/events/forge-scanner/

import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export type VaultEventType =
  | 'conversation_started'
  | 'message_exchanged'
  | 'message_complete'
  | 'lead_captured'
  | 'lead_exited'
  | 'booking_confirmed';

export interface VaultEventData {
  type: VaultEventType;
  scanId: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  businessName?: string | null;
  websiteUrl?: string | null;
  weakestStage?: string | null;
  weakestScore?: number | null;
  overallHealth?: number | null;
  chatChannel?: string;
  details?: Record<string, unknown>;
}

const VAULT_EVENTS_DIR = resolve(
  process.cwd(),
  '../../agents/sales-orchestrator/events/forge-scanner'
);

export function writeVaultEvent(data: VaultEventData): void {
  try {
    mkdirSync(VAULT_EVENTS_DIR, { recursive: true });

    const timestamp = new Date().toISOString();
    const safeTimestamp = timestamp.replace(/[:.]/g, '-');
    const filename = `${safeTimestamp}-${data.type}.md`;
    const filepath = resolve(VAULT_EVENTS_DIR, filename);

    const content = `# EVENT: ${data.type}
**Timestamp:** ${timestamp}
**Project:** forge-scanner
**Scan ID:** ${data.scanId}
**Lead:** ${data.leadEmail ?? 'unknown'} | ${data.leadPhone ?? 'unknown'}
**Business:** ${data.businessName ?? 'unknown'} (${data.websiteUrl ?? 'unknown'})
**Weakest Stage:** ${data.weakestStage ?? 'unknown'} (score: ${data.weakestScore ?? 'N/A'})
**Overall Health:** ${data.overallHealth ?? 'N/A'}/100
**Chat Channel:** ${data.chatChannel ?? 'web'}
**Details:** ${data.details ? JSON.stringify(data.details, null, 2) : 'none'}
`;

    writeFileSync(filepath, content, 'utf-8');
    console.log(`[vault-event] Wrote ${data.type} → ${filename}`);
  } catch (error) {
    // Vault writes should never break the user experience
    console.error(`[vault-event] Failed to write ${data.type}:`, error);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/vault/event-writer.ts
git commit -m "feat: add vault event writer for Sales Orchestrator integration"
```

---

## Task 7: Vault Queue Writer

**Agent:** Backend
**Files:**
- Create: `src/lib/vault/queue-writer.ts`

- [ ] **Step 1: Write the queue writer**

Create `src/lib/vault/queue-writer.ts`:

```typescript
// src/lib/vault/queue-writer.ts
// Writes follow-up queue entries for the Sales Orchestrator to process.
// Queue entries are markdown files in projects/forge-scanner/sales/queues/pending/

import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export interface QueueEntryData {
  scanId: string;
  leadEmail: string;
  leadPhone?: string | null;
  businessName: string;
  trigger: 'conversation_abandoned' | 'bounced' | 'no_chat';
  sequencePosition: 1 | 2 | 3;
  channel: 'email' | 'sms';
  scheduledFor: string; // ISO timestamp
  weakestStage: string;
  weakestScore: number;
  criticalFindings: string[];
  topInsight: string;
}

const QUEUE_DIR = resolve(process.cwd(), 'sales/queues/pending');

export function writeQueueEntry(data: QueueEntryData): void {
  try {
    mkdirSync(QUEUE_DIR, { recursive: true });

    const filename = `${data.scanId}-pos${data.sequencePosition}.md`;
    const filepath = resolve(QUEUE_DIR, filename);

    const content = `# FOLLOW-UP: ${data.scanId}-pos${data.sequencePosition}
**Lead:** ${data.leadEmail}
**Phone:** ${data.leadPhone ?? 'unknown'}
**Business:** ${data.businessName}
**Trigger:** ${data.trigger}
**Sequence Position:** ${data.sequencePosition} of 3
**Channel:** ${data.channel}
**Scheduled For:** ${data.scheduledFor}
**Status:** pending

## Scan Context
- Weakest stage: ${data.weakestStage} (${data.weakestScore}/100)
- Critical findings: ${data.criticalFindings.join('; ')}
- Top insight: "${data.topInsight}"

## Generated Content
[To be filled by Sales Orchestrator]

## Send Result
[To be filled when sent]
`;

    writeFileSync(filepath, content, 'utf-8');
    console.log(`[vault-queue] Wrote follow-up entry → ${filename}`);
  } catch (error) {
    console.error(`[vault-queue] Failed to write queue entry:`, error);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/vault/queue-writer.ts
git commit -m "feat: add vault queue writer for follow-up scheduling"
```

---

## Task 8: DB Migration — Conversation Tracking Columns

**Agent:** Backend
**Files:**
- Create: `supabase/migrations/[timestamp]_conversation_tracking.sql`

- [ ] **Step 1: Create the migration**

```sql
-- Add engagement tracking columns to conversations table
-- Used by objection classifier and Sales Orchestrator pipeline reporting

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS engagement_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS objection_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_objection_type text;

-- Index for pipeline queries
CREATE INDEX IF NOT EXISTS idx_conversations_objection_type
  ON conversations (last_objection_type)
  WHERE last_objection_type IS NOT NULL;

COMMENT ON COLUMN conversations.engagement_score IS 'Computed: message count + avg length + questions asked';
COMMENT ON COLUMN conversations.objection_count IS 'Incremented when classifier detects an objection';
COMMENT ON COLUMN conversations.last_objection_type IS 'Latest classified objection type (time/price/fit/authority/avoidance/stall)';
```

- [ ] **Step 2: Update DbConversation type**

In `src/lib/db/types.ts`, add the new columns to `DbConversation`:

```typescript
export interface DbConversation {
  id: string;
  scan_id: string;
  lead_id: string;
  status: ConversationStatus;
  engagement_score: number;      // NEW
  objection_count: number;       // NEW
  last_objection_type: string | null;  // NEW
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/ src/lib/db/types.ts
git commit -m "feat: add conversation tracking columns for objection classifier"
```

---

## Task 9: Integrate Classifier into Chat Message Route

**Agent:** Backend
**Files:**
- Modify: `src/app/api/chat/message/route.ts`

- [ ] **Step 1: Read the current file**

Read `src/app/api/chat/message/route.ts`.

- [ ] **Step 2: Add classifier import and parallel execution**

Add imports:
```typescript
import { classifyMessage } from '@/lib/ai/objection-classifier';
import { writeVaultEvent } from '@/lib/vault/event-writer';
```

After storing the user message (line ~92, after `const { data: userMessage }`), add parallel classification. The classifier runs alongside the response — it doesn't block the user. Store the result in message metadata and update conversation tracking:

```typescript
    // Run classification in parallel — don't block the response
    // Store result in message metadata for the stream endpoint to read
    const classifyAndUpdate = async () => {
      try {
        // Fetch recent messages for context
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('content, role')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(6)
          .returns<Array<{ content: string; role: string }>>();

        const context = (recentMessages ?? [])
          .reverse()
          .map((m) => `${m.role}: ${m.content}`);

        const objectionType = await classifyMessage(content, context);

        // Update message metadata with classification result
        await supabase
          .from('messages')
          .update({ metadata: { objection_type: objectionType } })
          .eq('id', userMessage.id);

        // Update conversation tracking if objection detected
        if (objectionType !== 'none' && objectionType !== 'ready_to_book') {
          await supabase
            .from('conversations')
            .update({
              objection_count: conversation.objection_count + 1,
              last_objection_type: objectionType,
            })
            .eq('id', conversationId);
        }

        // Write vault event
        writeVaultEvent({
          type: 'message_exchanged',
          scanId: conversation.scan_id,
          chatChannel: channel ?? 'web',
          details: { objection_type: objectionType, message_count: context.length },
        });
      } catch (err) {
        console.error('[chat/message] Classification failed (non-blocking):', err);
      }
    };

    // Fire and forget — don't await
    void classifyAndUpdate();
```

Place this code BEFORE the `return NextResponse.json(response, { status: 201 })` line but AFTER the message is stored.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/message/route.ts
git commit -m "feat: integrate objection classifier into chat message route"
```

---

## Task 10: Integrate Playbook into Chat Stream Route

**Agent:** Backend
**Files:**
- Modify: `src/app/api/chat/stream/[convId]/route.ts`

- [ ] **Step 1: Read the current file**

Read `src/app/api/chat/stream/[convId]/route.ts`.

- [ ] **Step 2: Add playbook loading**

Add import:
```typescript
import { loadPlaybookSection } from '@/lib/ai/playbook-loader';
import type { ObjectionType } from '@/lib/ai/objection-classifier';
```

After fetching messages (around line 130, after `const messagesData = messagesResult.data ?? [];`), add playbook loading logic:

```typescript
    // Check if the latest user message has an objection classification
    const latestUserMessage = [...messagesData]
      .reverse()
      .find((m) => m.role === 'user');

    let activeObjectionContext: string | null = null;
    if (latestUserMessage?.metadata) {
      const meta = latestUserMessage.metadata as Record<string, unknown>;
      const objectionType = meta.objection_type as ObjectionType | undefined;
      if (objectionType && objectionType !== 'none' && objectionType !== 'ready_to_book') {
        activeObjectionContext = loadPlaybookSection(objectionType);
      }
    }

    // Count messages for adaptive intensity
    const messageCount = messagesData.filter((m) => m.role === 'user').length;
```

Then modify the `buildSalesAgentSystemPrompt` call to pass the new params:

```typescript
    const systemPrompt = buildSalesAgentSystemPrompt({
      scanResult,
      businessName: lead.business_name,
      leadName: lead.full_name,
      activeObjectionContext,  // NEW
      messageCount,            // NEW
    });
```

This requires updating the `buildSalesAgentSystemPrompt` function signature in `src/lib/ai/sales-agent.ts` to accept and forward these new params:

```typescript
export function buildSalesAgentSystemPrompt(params: {
  scanResult: ScanResult;
  businessName?: string | null;
  leadName?: string | null;
  blueprint?: BlueprintData | null;
  channel?: Channel;
  activeObjectionContext?: string | null;  // NEW
  messageCount?: number;                   // NEW
}): string {
```

And forward them to `buildFullSalesAgentPrompt`:

```typescript
  return buildFullSalesAgentPrompt({
    scanResult: params.scanResult,
    blueprint: params.blueprint,
    channel: params.channel ?? 'web',
    businessName: biz,
    leadName: params.leadName,
    calcomUrl: process.env.NEXT_PUBLIC_CALCOM_EMBED_URL,
    activeObjectionContext: params.activeObjectionContext,  // NEW
    messageCount: params.messageCount,                     // NEW
  });
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/stream/[convId]/route.ts src/lib/ai/sales-agent.ts
git commit -m "feat: integrate playbook loading into chat stream for objection handling"
```

---

## Task 11: Add Vault Events to Chat Start, Capture Info, Followup Trigger, CalCom Webhook

**Agent:** Backend
**Files:**
- Modify: `src/app/api/chat/start/[scanId]/route.ts`
- Modify: `src/app/api/scan/capture-info/route.ts`
- Modify: `src/app/api/followup/trigger/route.ts`
- Modify: `src/app/api/followup/webhook/calcom/route.ts`

- [ ] **Step 1: Add vault event to chat/start**

Read `src/app/api/chat/start/[scanId]/route.ts`.

Add import at top:
```typescript
import { writeVaultEvent } from '@/lib/vault/event-writer';
```

After the conversation is created (after `const { data: conversation, error: convError }` block, around line 186), add:

```typescript
    // Write vault event for Sales Orchestrator
    writeVaultEvent({
      type: 'conversation_started',
      scanId,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      businessName: lead.business_name,
      websiteUrl: scan.website_url,
      chatChannel: 'web',
    });
```

- [ ] **Step 2: Add vault event to capture-info**

Read `src/app/api/scan/capture-info/route.ts`.

Add import:
```typescript
import { writeVaultEvent } from '@/lib/vault/event-writer';
```

After the lead is successfully updated, add:
```typescript
    writeVaultEvent({
      type: 'lead_captured',
      scanId: parsed.data.scanId,
      leadEmail: parsed.data.email,
      leadPhone: parsed.data.phone,
      businessName: parsed.data.businessName,
      details: { captureMethod: 'direct' },
    });
```

- [ ] **Step 3: Replace followup/trigger mock with real implementation**

Read `src/app/api/followup/trigger/route.ts`.

Replace the TODO mock with real vault event + queue entry writes:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { writeVaultEvent } from '@/lib/vault/event-writer';
import { writeQueueEntry } from '@/lib/vault/queue-writer';
import type { TriggerFollowupResponse, ApiError } from '@/../contracts/api';
import type { DbScan, DbLead } from '@/lib/db/types';
import type { FunnelStage, StageSummary } from '@/../contracts/types';

const triggerFollowupSchema = z.object({
  scanId: z.string().min(1, 'scanId is required'),
  leadId: z.string().min(1, 'leadId is required'),
  reason: z.enum(['exit_intent', 'no_booking', 'abandoned_scan']),
});

export async function POST(request: NextRequest): Promise<NextResponse<TriggerFollowupResponse | ApiError>> {
  try {
    const body: unknown = await request.json();
    const parsed = triggerFollowupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { scanId, leadId, reason } = parsed.data;
    const supabase = createServiceClient();

    // Fetch scan and lead data for the queue entry
    const [scanResult, leadResult] = await Promise.all([
      supabase.from('scans').select('*').eq('id', scanId).single<DbScan>(),
      supabase.from('leads').select('*').eq('id', leadId).single<DbLead>(),
    ]);

    const scan = scanResult.data;
    const lead = leadResult.data;

    if (!scan || !lead) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Scan or lead not found' } },
        { status: 404 },
      );
    }

    // Write vault event
    writeVaultEvent({
      type: 'lead_exited',
      scanId,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      businessName: lead.business_name,
      websiteUrl: scan.website_url,
      details: { reason },
    });

    // Write queue entry for position 1 (email, 30-60s)
    const triggerMap: Record<string, 'conversation_abandoned' | 'bounced' | 'no_chat'> = {
      exit_intent: 'conversation_abandoned',
      no_booking: 'conversation_abandoned',
      abandoned_scan: 'bounced',
    };

    if (lead.email) {
      // Fetch weakest stage for queue context
      const { data: stages } = await supabase
        .from('funnel_stages')
        .select('stage, summary')
        .eq('scan_id', scanId)
        .not('summary', 'is', null)
        .returns<Array<{ stage: FunnelStage; summary: StageSummary }>>();

      const weakest = (stages ?? [])
        .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100))[0];

      const criticalFindings = (stages ?? [])
        .flatMap((s) => (s.summary?.findings ?? []).filter((f) => f.type === 'critical'))
        .slice(0, 3)
        .map((f) => f.title);

      writeQueueEntry({
        scanId,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        businessName: lead.business_name ?? scan.website_url,
        trigger: triggerMap[reason] ?? 'conversation_abandoned',
        sequencePosition: 1,
        channel: 'email',
        scheduledFor: new Date(Date.now() + 45 * 1000).toISOString(), // 45s from now
        weakestStage: weakest?.stage ?? 'unknown',
        weakestScore: weakest?.summary?.score ?? 0,
        criticalFindings,
        topInsight: weakest?.summary?.headline ?? 'Your funnel has room for improvement',
      });
    }

    const sequenceId = `seq_${crypto.randomUUID()}`;
    const response: TriggerFollowupResponse = {
      scheduled: !!lead.email,
      sequenceId,
      firstMessageAt: lead.email
        ? new Date(Date.now() + 45 * 1000).toISOString()
        : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[followup/trigger] Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to trigger follow-up sequence',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Add vault event to calcom webhook**

Read `src/app/api/followup/webhook/calcom/route.ts`.

Add import:
```typescript
import { writeVaultEvent } from '@/lib/vault/event-writer';
```

After a booking is created successfully (wherever `supabase.from('bookings').insert(...)` succeeds), add:

```typescript
    writeVaultEvent({
      type: 'booking_confirmed',
      scanId: booking.scan_id ?? '',
      leadEmail: lead.email,
      leadPhone: lead.phone,
      businessName: lead.business_name,
      details: {
        calEventId: booking.cal_event_id,
        scheduledAt: booking.scheduled_at,
        source: booking.source,
      },
    });
```

- [ ] **Step 5: Check the TriggerFollowupResponse type**

Read `contracts/api.ts` and verify `TriggerFollowupResponse` has a `firstMessageAt` field that accepts `string | null`. If it only accepts `string`, update it to `string | null`.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 7: Commit**

```bash
git add src/app/api/chat/start/[scanId]/route.ts src/app/api/scan/capture-info/route.ts src/app/api/followup/trigger/route.ts src/app/api/followup/webhook/calcom/route.ts
git commit -m "feat: add vault event writes to chat, capture, followup, and booking routes"
```

---

## Task 12: Add SALES_KNOWLEDGE_PATH to .env.local

**Agent:** Backend
**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add the env var**

Append to `.env.local`:
```
# Sales Agent knowledge base path (relative to project root)
SALES_KNOWLEDGE_PATH=../../agents/sales-orchestrator/knowledge
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add SALES_KNOWLEDGE_PATH env var"
```

Note: Do NOT commit `.env.local` if it contains secrets. If it does, add the env var to `.env.example` instead and document it.

---

## Task 13: Sales Orchestrator Identity + Vault Scaffold

**Agent:** Cody (Orchestrator)
**Files:**
- Create: `../../agents/sales-orchestrator/CLAUDE.md`
- Create: `../../agents/sales-orchestrator/eval.md`
- Create: `../../agents/sales-orchestrator/program.md`
- Create: `../../agents/sales-orchestrator/events/forge-scanner/.gitkeep`
- Create: `sales/queues/pending/.gitkeep`
- Create: `sales/queues/active/.gitkeep`
- Create: `sales/queues/completed/.gitkeep`
- Create: `sales/conversations/.gitkeep`
- Create: `sales/pipeline.json`

- [ ] **Step 1: Create vault directory structure**

```bash
mkdir -p ../../agents/sales-orchestrator/{knowledge,queues,events/forge-scanner,outputs}
mkdir -p sales/{queues/pending,queues/active,queues/completed,conversations}
touch ../../agents/sales-orchestrator/events/forge-scanner/.gitkeep
touch sales/queues/pending/.gitkeep
touch sales/queues/active/.gitkeep
touch sales/queues/completed/.gitkeep
touch sales/conversations/.gitkeep
```

- [ ] **Step 2: Create pipeline.json**

Write `sales/pipeline.json`:
```json
{
  "leads": [],
  "lastUpdated": null,
  "stats": {
    "totalScans": 0,
    "conversationsStarted": 0,
    "bookings": 0,
    "payments": 0
  }
}
```

- [ ] **Step 3: Write CLAUDE.md (Sales Orchestrator identity)**

Write `../../agents/sales-orchestrator/CLAUDE.md`. This is the full agent contract. Key sections:

1. **Identity:** Name TBD (Adrian picks). VP of Sales energy. Persistent orchestrator, same tier as Kova + Cody.
2. **Session:** `forge-sales` (tmux). Model: Opus.
3. **Boot sequence:** Read identity → knowledge → pipeline → queues → decisions → start /loop
4. **Loop behavior:** 5-minute cadence during business hours (8 AM - 10 PM), 30-minute overnight. Steps: read events, check queue, generate content, monitor quality, update pipeline, route escalations.
5. **Pipeline report format:** (as defined in spec Section 5)
6. **Escalation routing:** Booking/payment → needs-review (Critical). Hot lead → pipeline log. Cold lead → nightly recap. Never write to Kova's task queue.
7. **Relationship map:** Lead Systems = outbound prospecting. Sales Orchestrator = inbound automation. Clear handoff.

The CLAUDE.md should follow the format of existing agent identities at `../../agents/*/CLAUDE.md`.

- [ ] **Step 4: Write eval.md**

Write `../../agents/sales-orchestrator/eval.md`:
```markdown
# Sales Orchestrator — Evaluation Criteria

## Performance Metrics
1. **Speed-to-lead:** Time from exit event to first follow-up content generated (<60s)
2. **Pipeline accuracy:** Pipeline report reflects actual DB state (zero stale entries)
3. **Escalation routing:** Bookings/payments flagged to needs-review within one loop cycle
4. **Queue processing:** Zero overdue follow-ups (within 1 loop cycle of scheduled time)
5. **Conversation quality:** Objection handling deployed when classifier detects (>80% coverage)

## Quality Standards
- Pipeline report updated every loop cycle
- Events consumed and archived (not re-processed)
- Follow-up content personalized with scan data (no generic templates)
- Stalled conversations flagged within 2 loop cycles
- No false escalations (booking alerts for actual bookings only)
```

- [ ] **Step 5: Write program.md**

Write `../../agents/sales-orchestrator/program.md`:
```markdown
# Sales Orchestrator — Onboarding Program

## Week 1: Foundation
- [ ] Read all Hormozi knowledge files in knowledge/
- [ ] Process first 10 vault events successfully
- [ ] Generate first pipeline report
- [ ] Successfully route one escalation to needs-review

## Week 2: Optimization
- [ ] Achieve <60s speed-to-lead on follow-up generation
- [ ] Process 50+ events without errors
- [ ] Identify and flag first stalled conversation
- [ ] Generate follow-up content for all 3 sequence positions

## Week 3: Full Operations
- [ ] Run 5-minute loop reliably during business hours
- [ ] Zero overdue queue entries
- [ ] Weekly conversion report generated
- [ ] Patterns identified in conversion data
```

- [ ] **Step 6: Commit**

```bash
git add ../../agents/sales-orchestrator/ sales/
git commit -m "feat: scaffold Sales Orchestrator identity, eval, program, and vault infrastructure"
```

---

## Task 14: Integration Verification

**Agent:** Cody (Orchestrator) — runs after all other tasks complete
**Files:** None created — this is a verification pass

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Verify knowledge files are readable**

Check that `SALES_KNOWLEDGE_PATH` resolves correctly:
```bash
ls -la ../../agents/sales-orchestrator/knowledge/
```
Expected: `core-principles.md` and `objection-playbook.md` exist

- [ ] **Step 4: Verify vault event directory exists**

```bash
ls -la ../../agents/sales-orchestrator/events/forge-scanner/
```

- [ ] **Step 5: Verify queue directory exists**

```bash
ls -la sales/queues/pending/
```

- [ ] **Step 6: Verify DbConversation has new columns**

Grep for `engagement_score` in `src/lib/db/types.ts`:
Expected: Present in `DbConversation` interface

- [ ] **Step 7: Verify system prompt loads core principles**

Grep for `loadCorePrinciples` in `src/lib/prompts/sales-agent-system.ts`:
Expected: Import and usage present

- [ ] **Step 8: Verify classifier integration**

Grep for `classifyMessage` in `src/app/api/chat/message/route.ts`:
Expected: Import and call present

- [ ] **Step 9: Verify playbook loading**

Grep for `loadPlaybookSection` in `src/app/api/chat/stream/[convId]/route.ts`:
Expected: Import and usage present

- [ ] **Step 10: Verify vault events in routes**

Grep for `writeVaultEvent` across all route files:
Expected: Present in chat/start, chat/message, capture-info, followup/trigger, followup/webhook/calcom

- [ ] **Step 11: Commit verification results**

If all checks pass:
```bash
git add -A
git commit -m "chore: integration verification — all checks pass"
```

---

## Task 15: Chat UI Copy Fixes (Minimal Frontend)

**Agent:** Frontend (or Backend — these are 5 string replacements)
**Files:**
- Modify: `src/components/chat/ChatContainer.tsx`
- Modify: `src/components/chat/DataCard.tsx`

Per spec Section 8 — replace 5 chat-related `[COPY: ...]` placeholders with real copy. No other copy changes.

- [ ] **Step 1: Read ChatContainer.tsx**

Read `src/components/chat/ChatContainer.tsx`.

- [ ] **Step 2: Replace chat copy placeholders in ChatContainer.tsx**

Three replacements:
1. `'[COPY: chat initialization error message]'` → `'Something went wrong starting the chat. Please refresh the page and try again.'`
2. `'[COPY: message send error]'` → `'Failed to send your message. Please try again.'`
3. `[COPY: chat agent name]` → `Forge Advisor`

- [ ] **Step 3: Read DataCard.tsx**

Read `src/components/chat/DataCard.tsx`.

- [ ] **Step 4: Replace chat copy placeholders in DataCard.tsx**

Two replacements:
1. `[COPY: book a strategy call]` → `Book a Free Strategy Call`
2. `[COPY: book call description in chat]` → `30 minutes with Adrian — we'll walk through your scan and map out a game plan.`

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ChatContainer.tsx src/components/chat/DataCard.tsx
git commit -m "fix: replace chat copy placeholders with real copy"
```

---

## Dependency Graph

```
Task 1 (Core Principles) ─────────────────────────┐
Task 2 (Objection Playbook) ───────────────────────┤
                                                    ├─→ Task 5 (System Prompt Rewrite)
Task 3 (Objection Classifier) ────────────────────┤         │
Task 4 (Playbook Loader) ─────────────────────────┘         │
                                                              │
Task 6 (Vault Event Writer) ──────────┐                      │
Task 7 (Vault Queue Writer) ──────────┤                      │
Task 8 (DB Migration) ────────────────┤                      │
                                       ├─→ Task 9 (Classifier in message route)
                                       │   Task 10 (Playbook in stream route) ←──┘
                                       ├─→ Task 11 (Vault events in all routes)
                                       └─→ Task 12 (Env var)

Task 13 (Sales Orchestrator scaffold) ── independent, can run in parallel

Task 15 (Chat copy fixes) ── independent, can run in parallel

Task 14 (Integration verification) ←── depends on ALL above
```

### Parallel Execution Groups

**Group A (AI Engine — can run together):**
- Task 1 + Task 2 (knowledge files, no code dependencies)
- Task 3 + Task 4 (after 1+2, since Task 4 references the playbook format)

**Group B (Backend infrastructure — can run together):**
- Task 6 + Task 7 + Task 8 (independent utilities + migration)

**Group C (Backend integration — sequential, depends on A + B):**
- Task 5 (system prompt rewrite, depends on Task 4 for import)
- Task 9 (classifier in message route, depends on Task 3 + Task 8)
- Task 10 (playbook in stream route, depends on Task 4 + Task 5)
- Task 11 (vault events, depends on Task 6 + Task 7)
- Task 12 (env var)

**Group D (Independent — can run any time):**
- Task 13 (Sales Orchestrator scaffold)
- Task 15 (Chat copy fixes)

**Group E (Verification — last):**
- Task 14 (after everything)
