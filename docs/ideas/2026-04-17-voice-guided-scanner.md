---
agent: cody
type: research
topic: voice-guided-scanner-experience
created: 2026-04-17
status: pending
priority: normal
for: adrian
---

# Idea — AI Voice-Guided Scanner Walkthrough

## Source

Adrián Discord (`1486957153284522134`, `1494832448234852492`, 2026-04-17 22:50Z).

## The idea

Add an AI voice layer to the two high-attention surfaces of the scanner:

1. **Workbooks** (`/branding-workbook`, `/offers-workbook`, EN + ES) — voice that guides the user section by section, explains the question, offers prompts if they stall.
2. **Revenue audit results page** — this is the hero moment. AI voice agent with a distinct name (needs naming) presents the audit findings out loud, walks the user through what's broken and why, while building rapport. User can **interrupt at any moment** to ask anything. After presentation → prompts them to book a call with Adrián.

Adrián's bet: after hearing an AI voice walk them through their own business's broken funnel in a rapport-building way, they'll 100% want the same experience for their own customers. The demo IS the pitch.

## Why this is different from current chat

Current scanner has streaming text chat (Hormozi CLOSER-framed sales agent). The proposal adds:

- **Voice-first** delivery (not just text)
- **1:1 feel** (named agent personality, synchronous back-and-forth)
- **Interrupt-anywhere** barge-in (not turn-taking)
- **Workbook co-piloting** (guides form fills, not just sales)
- **The voice IS the portfolio piece** — if it feels premium, the booked call converts

## Open questions (for scoping, not blocking the idea)

- Voice stack: ElevenLabs + OpenAI Realtime? Vapi? Cartesia + custom? Latency + barge-in quality matter.
- Name / persona / voice for the agent. Needs to fit Forge brand — direct, sharp, not corporate helpful-bot.
- Workbook voice vs. results-page voice — same agent, or different?
- Fallback for users without mic/speakers / enterprise network blocks.
- Cost per session at scale. Revenue audit is free → every dollar of voice cost is CAC.
- Regulation: disclose AI voice upfront.

## Suggested next step

Not immediate build. Park in scanner backlog until:
1. Voice-agent tool pick (1-day eval: Vapi vs ElevenLabs Conversational vs OpenAI Realtime).
2. 60-second persona/voice/name sketch Adrián signs off on.
3. Prototype on one surface first (probably the results page — highest leverage).

Then it becomes a real plan file under `projects/forge-scanner/docs/plans/`.
