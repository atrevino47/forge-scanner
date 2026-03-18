# AGENT-AI-ENGINE — AI Engine Agent Instructions

> Read `CLAUDE.md` first, then this file.

## Your role
You own all AI interactions: screenshot annotation prompts, funnel analysis logic, blueprint generation, the AI Sales Agent system prompt, video analysis, and all AI-generated content (emails, SMS, WhatsApp messages). You are the intelligence behind the product.

## Your directories
```
/src/lib/ai/
├── client.ts                  # Anthropic API client (Sonnet + Haiku routing)
├── annotate.ts                # Screenshot annotation pipeline
├── blueprint.ts               # Funnel map + mockup generation
├── sales-agent.ts             # AI Sales Agent conversation handler
├── followup-content.ts        # AI-generated email/SMS/WhatsApp content
└── video-analysis.ts          # Video content performance analysis

/src/lib/prompts/
├── annotation.ts              # Screenshot annotation prompt per stage
├── stage-summary.ts           # Stage-level summary prompt
├── funnel-map.ts              # Funnel map generation prompt
├── mockup.ts                  # Key piece mockup prompt
├── sales-agent-system.ts      # AI Sales Agent system prompt
├── sales-agent-openers.ts     # Channel-specific conversation openers
├── email-followup.ts          # AI email generation prompts
├── sms-followup.ts            # SMS message prompts
├── whatsapp-followup.ts       # WhatsApp message prompts
├── video-analysis.ts          # Video content analysis prompt
└── contact-scrape.ts          # Contact extraction from website HTML

/src/lib/scanner/
├── orchestrator.ts            # Coordinates all 5 stage analyses
├── stage-traffic.ts           # Traffic Sources stage logic
├── stage-landing.ts           # Landing Experience stage logic
├── stage-capture.ts           # Lead Capture stage logic
├── stage-offer.ts             # Offer & Conversion stage logic
├── stage-followup.ts          # Follow-up & Retention stage logic
└── utils.ts                   # Shared utilities (score calculation, etc.)

/src/lib/blueprint/
├── funnel-map.ts              # Funnel map data generation
├── mockup-generator.ts        # HTML mockup generation
└── brand-extractor.ts         # Extract brand colors from screenshots
```

## DO NOT TOUCH
- `/src/app/api/` (Backend)
- `/src/components/` (Frontend)
- `/src/lib/db/` (Backend)
- `/src/lib/screenshots/` (Backend)
- `/contracts/` (Orchestrator only)

## AI client architecture

### Model routing
```typescript
// /src/lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Sonnet for: annotations, summaries, blueprints, Sales Agent, email content
export async function analyzeWithSonnet(params: {
  systemPrompt: string;
  userPrompt: string;
  images?: Array<{ type: 'base64'; media_type: string; data: string }>;
  maxTokens?: number;
}): Promise<string> {
  const content: Anthropic.MessageParam['content'] = [];
  if (params.images) {
    for (const img of params.images) {
      content.push({ type: 'image', source: img });
    }
  }
  content.push({ type: 'text', text: params.userPrompt });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: params.maxTokens || 4096,
    system: params.systemPrompt,
    messages: [{ role: 'user', content }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// Haiku for: technical checks, pixel detection, quick classification
export async function analyzeWithHaiku(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: params.maxTokens || 2048,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userPrompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// Streaming Sonnet for: Sales Agent chat responses
export async function streamWithSonnet(params: {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}): AsyncIterable<string> {
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: params.maxTokens || 2048,
    system: params.systemPrompt,
    messages: params.messages,
  });
  // Yield tokens as they arrive for SSE
}
```

### Model assignment
| Task | Model | Why |
|------|-------|-----|
| Screenshot annotation (with vision) | Sonnet | Visual understanding + strategic analysis |
| Stage summaries | Sonnet | Requires synthesizing multiple findings |
| Funnel map generation | Sonnet | Strategic reasoning about gaps |
| Mockup HTML generation | Sonnet | Creative + strategic + code generation |
| Sales Agent conversations | Sonnet (streaming) | Nuanced conversation, objection handling |
| Email/SMS/WhatsApp content | Sonnet | Personalized, persuasive writing |
| Video content analysis | Sonnet | Pattern recognition in content metadata |
| Technical checks (pixels, tags) | Haiku | Fast, formulaic detection |
| Page speed parsing | Haiku | Structured data extraction |
| Contact extraction from HTML | Haiku | Pattern matching in HTML |

## Build order

### Phase 1: Annotation System (Week 2)

**1. Annotation prompts — one per stage**

Each prompt receives: the screenshot image (base64), the funnel stage context, and optional business info. Returns structured JSON matching `Annotation[]` from contracts.

```typescript
// /src/lib/prompts/annotation.ts

export function getAnnotationPrompt(stage: FunnelStage, businessContext?: string): string {
  const stageInstructions = {
    traffic: `Analyze this screenshot of a social media profile or ad presence. Look for:
      - Bio optimization (does it drive action?)
      - Visual quality and consistency
      - Posting frequency signals
      - CTA presence
      - Follower/engagement signals
      - Ad presence indicators`,
    landing: `Analyze this screenshot of a website page. Look for:
      - First impression quality
      - Value proposition visibility (can you tell what they do in 5 seconds?)
      - CTA clarity and placement
      - Trust signals (testimonials, logos, certifications)
      - Mobile responsiveness issues
      - Navigation clarity
      - Loading/performance signals`,
    capture: `Analyze this screenshot for lead capture elements. Look for:
      - Forms: how many fields? Is there a lead magnet?
      - CTA text: is it compelling or generic?
      - Multiple CTAs vs single clear path
      - Exit intent mechanisms
      - Email/SMS capture points
      - Chat widgets
      - Newsletter signup`,
    offer: `Analyze this screenshot of a pricing, services, or product page. Look for:
      - Offer clarity: is it easy to understand what they sell?
      - Risk reversal (guarantees, free trials)
      - Social proof placement
      - Urgency/scarcity elements
      - Price-to-value communication
      - Payment friction signals`,
    followup: `Analyze this page for follow-up and retention signals. Look for:
      - Retargeting pixels (Meta Pixel, Google tag code)
      - Email marketing indicators
      - Blog/resource section
      - Review management signals
      - Loyalty/repeat purchase mechanisms`,
  };

  return `You are an expert digital marketing analyst specializing in conversion optimization and sales funnels.

Analyze this screenshot and identify specific issues, opportunities, and positives.

${stageInstructions[stage]}

${businessContext ? `Business context: ${businessContext}` : ''}

Return ONLY valid JSON matching this schema:
{
  "annotations": [
    {
      "id": "unique-id",
      "position": { "x": 0-100, "y": 0-100 },
      "type": "critical" | "warning" | "opportunity" | "positive",
      "title": "Short label (5-8 words max)",
      "detail": "Specific explanation with data or benchmarks (2-3 sentences)",
      "category": "descriptive_category"
    }
  ]
}

Position x/y are percentages from top-left. Place annotations precisely on the relevant element.
Return 3-7 annotations per screenshot. Prioritize critical issues first.
Be specific. Reference actual elements visible in the screenshot. No generic advice.`;
}
```

**2. Annotation pipeline**
```typescript
// /src/lib/ai/annotate.ts

export async function annotateScreenshot(
  screenshotBase64: string,
  stage: FunnelStage,
  businessContext?: string
): Promise<Annotation[]> {
  const prompt = getAnnotationPrompt(stage, businessContext);
  const result = await analyzeWithSonnet({
    systemPrompt: prompt,
    userPrompt: 'Analyze this screenshot.',
    images: [{ type: 'base64', media_type: 'image/png', data: screenshotBase64 }],
  });

  // Parse JSON, validate against Annotation schema, handle errors
  const parsed = JSON.parse(result);
  return parsed.annotations;
}
```

**3. Stage orchestrator**
```typescript
// /src/lib/scanner/orchestrator.ts

export async function runScanAnalysis(
  scanId: string,
  screenshots: ScreenshotData[],
  updateStage: (stage: FunnelStage, update: Partial<FunnelStageResult>) => Promise<void>
) {
  // Group screenshots by stage
  // Run all 5 stages in parallel (Promise.allSettled)
  // Each stage: annotate screenshots → generate summary → update DB
  // If one stage fails, others continue
}
```

### Phase 2: Blueprint Generator (Week 3)

**4. Funnel map generation**
Takes all stage results, generates `FunnelMapData` showing current vs ideal state.

**5. Key piece mockup**
- Identifies the weakest stage
- Extracts brand colors from screenshots
- Generates HTML/CSS mockup of the improved version
- Uses their actual business name, colors, industry

**6. Brand color extraction**
```typescript
// /src/lib/blueprint/brand-extractor.ts
// Analyze homepage screenshot with Sonnet vision
// Extract: primary, secondary, accent, background, text colors
// Return structured color object for mockup generation
```

### Phase 3: AI Sales Agent (Week 3)

**7. System prompt**

The Sales Agent system prompt includes:
- Role definition (Forge sales consultant)
- Lead's complete scan data (all annotations, all stages)
- Blueprint data (if generated)
- Hormozi CLOSER framework reference
- [PLACEHOLDER for Hormozi training transcripts — distilled knowledge base will be inserted here]
- Channel-specific behavior rules
- Cal.com booking instructions

```typescript
// /src/lib/prompts/sales-agent-system.ts

export function buildSalesAgentPrompt(params: {
  scanResults: ScanResult;
  blueprint?: BlueprintData;
  channel: Channel;
  conversationHistory: ChatMessage[];
  hormoziKnowledge: string; // distilled training — injected after transcript processing
}): string {
  return `You are the AI Sales Agent for Forge Digital. You've just reviewed a complete funnel scan for ${params.scanResults.websiteUrl}.

YOUR GOAL: Get them to book a free 30-minute strategy call.

SCAN RESULTS:
${JSON.stringify(params.scanResults.stages.map(s => ({
  stage: s.stage,
  health: s.summary?.score,
  headline: s.summary?.headline,
  topFindings: s.summary?.findings.slice(0, 3),
})), null, 2)}

${params.blueprint ? `BLUEPRINT: Their biggest gap is ${params.blueprint.funnelMap.biggestGap}. ${params.blueprint.funnelMap.revenueImpactEstimate}` : ''}

SALES FRAMEWORK:
${params.hormoziKnowledge}

CHANNEL: ${params.channel}
${getChannelRules(params.channel)}

RULES:
- Always reference THEIR specific data. Never be generic.
- Match their energy. If they're skeptical, be empathetic. If they're excited, be direct.
- Never be pushy. If they say no, respect it and leave the door open.
- When they're ready, provide the Cal.com link naturally.
- Language: English.
- Tone: direct, confident, knowledgeable. Like a smart friend who happens to be a marketing expert.`;
}
```

**8. Channel-specific openers**
AI generates the first message dynamically based on scan results:
- Web: consultative, references a specific screenshot
- Email: detailed, includes thumbnail references
- SMS: one insight + one question + Cal.com link
- WhatsApp: medium length, conversational

### Phase 4: Follow-up Content (Week 4)

**9. Email content generator**
Not templates — each email is written by Sonnet using the lead's scan data.

**10. SMS/WhatsApp content**
Short, channel-appropriate messages.

**11. Long-term nurture content**
Weekly insight emails for leads that didn't convert in the 3-touch sequence.

### Phase 5: Video Analysis (Week 2, parallel)

**12. Video content analysis**
```typescript
// /src/lib/ai/video-analysis.ts

export async function analyzeVideoContent(
  platform: 'instagram' | 'tiktok',
  profileData: {
    videos: Array<{
      views: number;
      likes: number;
      comments: number;
      caption: string;
      postedAt: string;
      thumbnailBase64?: string;
    }>;
    totalFollowers: number;
  }
): Promise<VideoAnalysis> {
  // Send to Sonnet for analysis
  // Returns: top performers, patterns, doubling-down score, etc.
}
```

## Hormozi training pipeline (Week 2 — dedicated phase)

When Adrián provides the 6+ hours of transcripts:

```
Step 1: Chunk transcripts into ~4K token sections
Step 2: Extract from each chunk:
  - Sales frameworks mentioned
  - Objection handling patterns
  - Closing techniques
  - Discovery question patterns
  - Urgency creation methods
  - Risk reversal language
  - Key quotes and principles
Step 3: Deduplicate and organize into categories
Step 4: Distill into ~10-15K token knowledge base document
Step 5: Embed in Sales Agent system prompt
Step 6: Test with 20+ simulated conversations
Step 7: Iterate based on test results
```

Output: `/src/lib/prompts/hormozi-knowledge-base.ts`
This file exports a single string constant that gets injected into the Sales Agent system prompt.

## Key principles
1. **Every AI response must reference THEIR data.** No generic "your website could be better." Always: "Your homepage headline says X but doesn't tell visitors Y."
2. **JSON from AI must always be validated.** Wrap all AI JSON parsing in try/catch with graceful fallback.
3. **Prompts are your product.** The quality of prompts directly determines scan quality. Invest time. Be specific. Include examples.
4. **Annotations must be precise.** Position x/y must correspond to actual elements in the screenshot. Test against real screenshots during development.
5. **The Sales Agent is a closer, not a chatbot.** It has a goal (book a call). Every message should move toward that goal without being pushy.
