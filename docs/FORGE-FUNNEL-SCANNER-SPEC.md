# FORGE FUNNEL SCANNER — MASTER SPEC

**Version:** 2.1
**Date:** March 17, 2026
**Author:** Adrián Treviño / Forge Digital
**Domain:** audit.forgedigital.com

---

## 1. EXECUTIVE SUMMARY

### What we're building
A premium AI-powered funnel scanner that:

1. Takes a single URL and starts working immediately — zero friction entry
2. Captures real screenshots of the business's website, social profiles, GBP, and ads
3. AI annotates those screenshots with specific callouts — what's broken, what's missing, what's costing them money
4. Analyzes video content performance — identifies viral patterns, script structures, and missed opportunities
5. Maps the complete sales funnel from traffic sources to offer
6. Generates an optimized funnel blueprint + visual mockup of the weakest piece
7. Deploys an AI Sales Agent trained on 6+ hours of Hormozi sales transcripts to work objections and book calls
8. Follows up across email, SMS, WhatsApp, and eventually voice if they leave without booking

### Why it exists
This is Forge's primary lead generation machine. The product IS the pitch. Every screenshot annotation, every mockup, every AI conversation demonstrates what Forge does — build complete sales systems. Every feature exists to do one thing: **get qualified prospects on a call with Forge.**

### The funnel
```
Traffic (social, ads, organic, outreach)
    ↓
URL input → scan starts instantly (zero friction)
    ↓
Progressive capture (email + phone mid-scan, after they see value)
    ↓
Annotated screenshots + funnel diagnosis (real-time streaming)
    ↓
"Generate your optimized blueprint" (no auth gate — email + phone is enough)
    ↓
Funnel map + mockup of weakest piece
    ↓
Always-visible CTA: Book a Free Strategy Call (Cal.com modal overlay, Aupale-style top banner)
    ↓ (if no booking after ~30s)
AI Sales Agent activates (Hormozi-trained, uses their data, works objections)
    ↓ (if they leave without booking)
Multi-channel AI Sales Agent: email (30-60s) → SMS/WhatsApp (24h) → final (3 days) → long-term nurture
    ↓ (if they left without even leaving email)
Contact scraping from their own website/GBP → outbound with their scan results as proof of value
```

### Core philosophy
**"Gift the diagnosis, sell the surgery."**

The scan shows them exactly what's broken in their funnel — with their own screenshots, their own data, their own gaps. The mockup shows them what the fix looks like. Both are free. The only thing they can't get for free is someone to actually build it. That's Forge.

---

## 2. PRODUCT PRINCIPLES

### The $100K feel
Every interaction must make the user think: "These people invested serious money into this." This is not negotiable. The product must reflect the full capabilities of Forge as a sales funnel agency — high attention to detail, everything highly thought out.

When they interact with the scan tool, the organic content, the ads, the lead magnets, the value given for free, the way the offer is positioned, the AI Sales Agent, the follow-up process, even the booking system — they must think: *"I want everything they have, everything they are doing, for my company. And it's so many things that I cannot do it alone."*

### Design mandate
1. **GSAP animations.** Not just fade-ins. Scroll-triggered reveals, staggered annotation appearances, parallax on screenshots, smooth page transitions, text split animations on hero copy. Every motion should feel intentional and premium.
2. **Typography.** Distinctive. Not Inter, not Roboto. A display font with personality + a clean body font. Reference: Aupale Vodka's serif display type — bold and memorable.
3. **Layout.** Generous whitespace. Asymmetric where it creates visual interest. Screenshots as large, high-quality cards — not thumbnails in a grid. Each annotation reveal feels like a micro-moment.
4. **Results presentation.** Not a list of findings. A visual story. The user scrolls through their funnel like flipping through a beautifully designed case study. Each screenshot is large, each annotation animates in, each finding is presented as a narrative beat.
5. **AI Chat.** Does not look like Intercom or Drift. Custom-designed. Feels like iMessage or WhatsApp. Messages animate smoothly. Typing indicators that feel natural, not instant.
6. **Loading states.** Not spinners. Skeleton screens with subtle shimmer. Progress indicators that show actual work: "Capturing your homepage... Analyzing your Instagram... Detecting your funnel structure..."
7. **The blueprint/mockup.** This is the crown jewel. It should look like a deliverable from a $20K strategy engagement. The funnel map is interactive, animated, beautiful. The mockup looks like a real redesign.

---

## 3. USER JOURNEY

### Phase 1: Entry (0-5 seconds)
1. User arrives at audit.forgedigital.com
2. Sees a premium, dark-mode landing page with a single input: "Enter your website URL"
3. Always-visible top banner CTA: "Book a Free Strategy Call" — Aupale Vodka-style nav-integrated button (left: CTA text with subtle glow, center: Forge logo, right: menu). Clicking opens Cal.com as a modal overlay on the current page.
4. Types/pastes their URL
5. Hits "Scan my funnel" (or Enter)
6. **Scan starts immediately.** Page transitions to the results view with visible progress.

### Phase 2: Progressive Scan (5-60 seconds)
7. System begins crawling their website, detecting social links, capturing screenshots
8. User sees real-time progress — screenshots appearing, AI analysis running
9. **~15-20 seconds in:** A non-intrusive prompt slides in: "Enter your email and phone so we can send you the full results"
   - This feels natural because the scan is visibly working — they're already invested
   - Email: required to continue viewing full results
   - Phone: framed as "We'll text you when your blueprint is ready"
   - If they found social handles on the site, show them auto-detected with confirmation:
     - If confident match: "We found your Instagram (@handle) — confirm?"
     - If ambiguous (multiple similar handles): popup asking "Is your business @company.x or @company_x?" with options
   - If socials weren't auto-detected: optional manual input
10. Scan continues in background regardless — capture prompt doesn't block the analysis
11. **If they DON'T enter email:** They can still see scan progress. When results are ready, full details are blurred/gated behind email capture: "Enter your email to see your full results."
12. **If they leave without entering email OR completing the scan:** System attempts contact recovery (see Section 9: Exit Recovery).

### Phase 3: Results (60-120 seconds)
13. Screenshots stream in as each funnel stage completes, with AI annotations overlaid via GSAP staggered animations
14. Each stage shows: large screenshot card(s) + callout bubbles pointing to specific issues
15. Funnel map builds progressively — shows which stages exist, which are missing, which are broken
16. After all stages complete: overall funnel health summary
17. All results presented as a visual story — each screenshot is a large card, annotations animate in, findings presented as narrative beats. Not a checklist. Not a table. A story.

### Phase 4: The Blueprint (user-triggered, no auth gate)
18. Prominent CTA: "Generate your optimized funnel blueprint"
19. **No Google OAuth required.** Email + phone captured during the scan is sufficient. Blueprint generates immediately on click.
20. AI generates the funnel map (current state vs. ideal) + visual mockup of the weakest piece
21. User sees their current state vs. the ideal side-by-side
22. The mockup is viewable on-screen but not downloadable — they can screenshot it, but that's it
23. Google OAuth exists only as an optional soft prompt: "Create an account to save your results and access them later." Not a blocker.

### Phase 5: The Close
24. **Primary CTA (always visible via top banner):** "Book a Free Strategy Call" — Cal.com opens as modal overlay on the current page. Pre-fills name, email, phone from captured data. User never leaves the results page.
25. **If they don't book within ~30 seconds of viewing results/blueprint:** AI Sales Agent chat appears
   - Opens with a contextual message referencing their specific findings
   - Uses Hormozi CLOSER framework to work objections
   - Can show scan data inline (screenshots, findings) during the conversation
   - When ready, embeds Cal.com calendar directly in the chat
26. **If they book:** Confirmation animation on page (subtle gold sparkle), confirmation email + SMS/WhatsApp sent. Booking source tracked: 'banner_cta', 'ai_agent', 'results_cta', 'email_link', etc.

### Phase 6: Exit Recovery (if they leave without booking)
27. **The scan ALWAYS completes** — even if the lead bounces. Results are stored and become ammunition for outreach.
28. **30-60 seconds after exit (if email captured):** AI Sales Agent sends first email
   - Personalized subject: "[Business Name] — 3 things costing you leads right now"
   - Contains: top 3 annotated findings with thumbnail screenshots, specific hooks about their business
   - Not a template — AI writes each email dynamically using their scan data + Hormozi principles
29. **24 hours after exit:** SMS + WhatsApp
   - Short, personal, direct with one specific insight + Cal.com link
   - If they reply: AI Sales Agent continues the conversation in that channel, full access to scan data
30. **3 days after exit:** Final email
   - "We held your results but they expire in 48 hours"
   - If they don't engage: move to long-term nurture (see Section 8)
31. **If they left without email:** Contact scraping pipeline activates (see Section 9)

---

## 4. FUNNEL SCAN ENGINE — WHAT WE ANALYZE

The scan maps the business's digital presence to 5 funnel stages. Not every business will have all stages — that's a finding in itself ("you're missing a lead capture stage entirely").

### Stage 1: Traffic Sources
**What we look for:** How does this business get attention?

**Screenshots captured:**
- Instagram profile + last 6-9 posts grid
- Facebook page header + recent posts
- TikTok profile (if detected/provided)
- LinkedIn company page (if detected/provided)
- Google Business Profile listing
- Meta Ad Library (check for active ads)
- Google Ads Transparency Center (check for active ads)

**AI analyzes:**
- Which platforms are active vs. dormant
- Posting frequency and consistency
- Content quality and variety
- Bio optimization (does it drive action?)
- Follower-to-engagement ratio
- Ad presence and apparent strategy
- SEO signals (is the site indexed, does it rank for brand name?)

**Video content deep analysis (Instagram Reels, TikTok, YouTube Shorts):**
- **Top-performing videos identified** — sorted by views/engagement, outliers flagged
- **Script structure analysis** — does the video follow a proven hook → body → CTA structure?
- **Hook effectiveness** — what type of hook? (question, bold claim, visual pattern interrupt, etc.)
- **Topic clustering** — what topics get the most engagement vs. least?
- **Posting recency vs. virality** — are their viral videos recent or from years ago? A viral video from 5 years ago may be irrelevant to today's market.
- **Doubling down metric** — after a video performed well, did they make more on that topic/format? Or did they abandon it?
- **Consistency analysis** — posting frequency over last 90 days vs. engagement trend
- **Format analysis** — talking head vs. B-roll vs. screen recording vs. text overlay — which performs best for them?

**Annotation examples:**
- "Your Instagram bio has no CTA — every visitor is a missed lead"
- "Last post was 3 weeks ago — inconsistency kills trust"
- "No active ads found — you're relying 100% on organic"
- "Your GBP has 4 photos — businesses with 20+ get 35% more clicks"
- "Your top video (142K views) was 8 months ago about [topic] — you never made another video on this topic. You're leaving proven demand on the table."
- "6 of your last 9 videos use the same hook format — mixing in question-based hooks could 2x reach"
- "Your Reel from March 3 hit 8.4% engagement vs. your average 1.2% — the difference is the script structure. That Reel used a 3-second hook, your others start with 6+ seconds of intro."

**Data collection for video analysis:**
- Public profile data via scraping or API
- Video view counts, like counts, comment counts
- Video captions/descriptions for content analysis
- Posting dates for recency weighting
- Claude Sonnet analyzes metadata, captions, and thumbnail composition
- *Limitation:* We cannot watch or transcribe video content in this version. Analysis is based on metadata (views, engagement, dates, captions) and visual elements (thumbnails). Full video transcription analysis is a future feature.

### Stage 2: Landing Experience
**What we look for:** When someone arrives, what do they see?

**Screenshots captured:**
- Homepage (full page, above-the-fold focus)
- Key inner pages (auto-detected: about, services, contact, pricing)
- Mobile view of homepage
- GBP listing detail view

**AI analyzes:**
- First-impression quality (professional or dated?)
- Loading speed (Core Web Vitals via PageSpeed API)
- Mobile responsiveness
- Navigation clarity
- Value proposition visibility (can you tell what they do in 5 seconds?)
- Trust signals (testimonials, logos, certifications)
- Visual consistency with social profiles

**Annotation examples:**
- "Your headline says what you DO, not what the customer GETS"
- "No visible phone number above the fold — 68% of mobile users want to call"
- "This page takes 4.2s to load — 53% of visitors leave after 3s"
- "Your mobile menu covers the CTA button"

### Stage 3: Lead Capture
**What we look for:** How does this business turn visitors into contacts?

**Screenshots captured:**
- Any forms found on the site
- Pop-ups or slide-ins (if detected)
- Contact page
- CTA buttons (annotated on existing screenshots)

**AI analyzes:**
- Forms present? How many fields?
- Lead magnet offered? (free guide, consultation, discount, etc.)
- CTA clarity and placement
- Multiple CTAs or single clear path?
- Exit intent mechanisms
- Email/SMS capture points
- WhatsApp widget or chat present?
- Newsletter signup
- Gated content

**Annotation examples:**
- "No lead magnet — you're asking people to buy before they trust you"
- "Your contact form has 11 fields — each field reduces completion by ~10%"
- "CTA says 'Submit' — that's the least compelling word in marketing"
- "No way to capture leads who aren't ready to buy yet"

### Stage 4: Offer & Conversion
**What we look for:** What are they selling and how compelling is it?

**Screenshots captured:**
- Pricing page (if exists)
- Services/products page
- Any sales or landing pages
- Checkout flow (if e-commerce)

**AI analyzes:**
- Is the offer clearly defined?
- Value proposition vs. price (Hormozi value equation)
- Risk reversal (guarantees, free trials, refund policies)
- Social proof placement (reviews, testimonials, case studies)
- Urgency/scarcity elements
- Payment friction (how many steps to buy?)
- Upsell/cross-sell presence

**Annotation examples:**
- "No guarantee mentioned — you're asking for 100% trust upfront"
- "Your pricing page has no testimonials — price without proof creates objections"
- "3 different CTAs on this page — decision paralysis kills conversion"
- "No urgency element — there's no reason to act today vs. next month"

### Stage 5: Follow-up & Retention
**What we look for:** What happens after initial contact?

**Data analyzed (inferred, no screenshots):**
- Email marketing signals (newsletter signup, Mailchimp/Klaviyo detection)
- Retargeting pixels (Meta Pixel, Google Ads tag, GTM)
- Review management (response rate, response quality on GBP)
- Loyalty/repeat purchase mechanisms
- Content strategy for nurturing (blog, resources, FAQ)

**AI analyzes:**
- Is there any follow-up system at all?
- Pixel/tracking installation for retargeting
- Review response rate and quality
- Content depth (does the blog exist? Is it active?)

**Finding examples (text blocks, no screenshots):**
- "Meta Pixel detected but no Google Ads tag — you can retarget on Meta but not Google"
- "You respond to 2 of 15 Google reviews — unanswered reviews signal you don't care"
- "No blog or resource section — content marketing builds trust at scale for free"

### What we DON'T analyze
- Internal systems (CRM, email automations, sales processes)
- Paid ad performance metrics (we only detect presence)
- Revenue or financial data
- Private/logged-in areas of their site
- App store presence

---

## 5. VISUAL ANNOTATIONS SYSTEM

### How annotations work

Each screenshot gets processed by Claude Sonnet with vision. The AI receives:
1. The screenshot image
2. The funnel stage context (what to look for)
3. The business context (industry, goals — if captured)
4. Instructions to return structured annotation data

### Annotation output format
```typescript
interface ScreenshotAnnotation {
  screenshotId: string;
  screenshotUrl: string;
  pageUrl: string;
  stage: FunnelStage;
  annotations: Annotation[];
}

interface Annotation {
  id: string;
  position: {
    x: number; // 0-100 (% from left)
    y: number; // 0-100 (% from top)
    width?: number;
    height?: number;
  };
  type: 'critical' | 'warning' | 'opportunity' | 'positive';
  title: string;
  detail: string;
  category: string;
}
```

### Frontend rendering
- Screenshot displayed at full width in a card
- Annotation markers (colored dots/icons) overlaid at the specified positions
- Click/hover on a marker reveals the annotation detail in a popover
- Color coding: red (critical), amber (warning), blue (opportunity), green (positive)
- GSAP staggered entrance animations as each annotation appears

### Screenshot capture pipeline
```
URL input
    ↓
Browserless.io / Playwright (headless Chromium)
    ↓
Capture: homepage, inner pages, mobile viewport
    ↓
Social profile detection (parse website for social links)
    ↓
Social handle disambiguation (if ambiguous, ask user)
    ↓
Capture: Instagram, Facebook, TikTok, LinkedIn (public views)
    ↓
GBP detection (Google Places API or from website)
    ↓
Capture: GBP listing
    ↓
Ad detection (Meta Ad Library API, Google Ads Transparency)
    ↓
Store all screenshots in Supabase Storage
    ↓
Feed each screenshot to Claude Sonnet (vision) for annotation
    ↓
Return structured annotations + store in database
```

---

## 6. BLUEPRINT GENERATOR

### Two outputs, one experience

When the user clicks "Generate your optimized funnel blueprint" (requires email + phone captured, no auth gate):

#### Output 1: Funnel Map
A visual diagram showing:
- **Left side:** Their current funnel state (which stages exist, which are missing, traffic flow)
- **Right side:** The optimized funnel (what it should look like with all stages connected)
- Missing stages highlighted as gaps
- Broken connections marked
- Revenue impact estimates where possible ("adding a lead magnet could capture 30% more leads")

Generated as an interactive SVG/HTML component with GSAP animations. Not an image. Looks premium.

#### Output 2: Key Piece Mockup
The AI identifies the **single weakest piece** of their funnel and generates a visual mockup of the improved version.

**Selection logic:**
- No lead capture → mockup a lead magnet landing page
- Weak homepage → mockup a redesigned above-the-fold
- No social presence → mockup an Instagram profile strategy
- Weak offer page → mockup an improved pricing/services page

**Generation method:**
- Claude Sonnet generates HTML/CSS using:
  - Their brand colors (extracted from website screenshots)
  - Their actual business name and industry
  - Best practices from the scan findings
  - Conversion optimization principles
- Rendered as a live HTML preview within the results page
- Looks like a real professional redesign
- Includes a "Built by Forge" watermark

**Key constraint:** Viewable on-screen only. No download button, no export. They can screenshot it, but to get it built for real, they book a call.

---

## 7. AI SALES AGENT

### Architecture

The AI Sales Agent is not a chatbot on the results page. It is a **full omnichannel sales system** — one brain that operates across web chat, email, SMS, WhatsApp, and eventually voice.

### One brain, many channels
The agent maintains a single conversation context per lead. Whether the lead replies via WhatsApp, clicks a link in an email, or reopens the web chat — the agent picks up where it left off. It knows:
- The full scan results and annotations
- Every message it has sent and received across all channels
- Whether the lead has opened emails, clicked links, replied
- The lead's specific funnel gaps and what fixing them would look like

### Training data
The AI Sales Agent is trained on:
1. **6+ hours of Hormozi sales training transcripts** — CLOSER framework, value equation, objection handling, closing techniques, discovery questions, urgency creation, risk reversal language
2. The lead's complete scan results (all annotations, all stages, all findings)
3. The blueprint data (what their optimized funnel looks like)
4. Forge's service offerings and value proposition
5. Common objections and industry-specific rebuttals

### Hormozi training pipeline
```
Raw transcripts (6+ hrs)
    ↓
Structured extraction:
  - Sales frameworks (CLOSER, value equation, offer design)
  - Objection handling patterns
  - Tonality and language patterns
  - Closing techniques
  - Discovery question sequences
  - Urgency creation methods
  - Risk reversal language
    ↓
Distilled into structured knowledge base (~10-15K tokens)
    ↓
Embedded in AI Sales Agent system prompt as reference material
    ↓
Testing: 20+ simulated conversations against different lead personas
    ↓
Iteration based on test results
```

### System prompt structure
```
[ROLE] You are the AI Sales Agent for Forge Digital...
[CONTEXT] Lead scan data: {scan_results}
[KNOWLEDGE BASE] Hormozi sales training: {distilled_training}
[CONVERSATION HISTORY] {all_messages_across_all_channels}
[CHANNEL] {current_channel: web|email|sms|whatsapp}
[RULES] Adapt tone to channel. Never be pushy. Always use their data. Match lead's language (EN/ES).
[OBJECTIVE] Book a strategy call via Cal.com
```

### Channel-specific behavior
| Channel | Behavior |
|---------|----------|
| Web chat (results page) | Consultative. References specific screenshots. Shows data inline. Drives to Cal.com modal. |
| Email | Detailed. Includes annotated screenshot thumbnails. Specific hooks about their business. Dynamic subject lines. |
| SMS | Short. Direct. One specific insight + "Worth a 15-min call?" + Cal.com link. |
| WhatsApp | Medium length. Can include images. More conversational. Two-way. |
| Voice (Phase 2) | Natural feminine voice. Opens with their name + one specific finding. Books the call live. |

### Web chat activation
- **Trigger:** User has been on results page for 30+ seconds without clicking "Book a Call"
- **Secondary trigger:** User has viewed the blueprint but hasn't booked
- Opens with a contextual first message — never generic

**Example first messages (AI generates dynamically):**
- "I noticed your website has zero lead capture — that means every visitor who isn't ready to buy right now is lost forever. Want me to walk you through what fixing that looks like?"
- "Your Instagram has 2,300 followers but your website gets no traffic from it — there's a disconnect. Curious what's happening there?"
- "You're running Meta ads but your landing page has no form — you're paying for traffic and sending it to a dead end. That's fixable."

### Web chat capabilities
- Text messages with natural typing indicators
- Inline data cards (show specific scan findings within the chat)
- Cal.com embed directly in chat (when user is ready to book)
- GSAP-animated message entrance

### Email behavior (not templates — dynamic AI content)
Each email is written dynamically using the lead's specific scan data:
- References specific findings with thumbnails of their annotated screenshots
- Includes personalized hooks: "Here's a headline that would work better for your homepage..."
- Suggests specific improvements with enough detail to impress but not enough to DIY
- Adapts tone based on sequence position (first = generous, second = direct, third = urgency)

### Long-term nurture (if 3-touch drip doesn't convert)
If the initial sequence doesn't close, the AI Sales Agent continues nurturing at lower frequency:
- Weekly insight email: "We noticed [competitor] just launched a new landing page — here's what they're doing that you're not"
- Industry-specific tips that reference their scan
- Seasonal hooks: "Mother's Day is 6 weeks away — here's what your funnel should look like to capture seasonal demand"
- Personalized content based on their specific funnel gaps

This is not spam. This is a sales agent that never forgets, never gets tired, and always has something relevant to say because it has their data.

---

## 8. MULTI-CHANNEL FOLLOW-UP SYSTEM

### Trigger: User leaves without booking a call

Detection: `visibilitychange` event + `beforeunload` + server-side timeout (no new requests for 2+ minutes).

### Sequence

#### Message 1: Email — 30-60 seconds after exit
**Channel:** Resend
**Content:**
- AI-generated subject line using their business name + specific finding
- Top 3 annotated findings with thumbnail screenshots
- One compelling stat from their scan
- Urgency framing (natural, not fake)
- Single CTA: "Book your free strategy call" → Cal.com link
- Written dynamically by AI Sales Agent using their data + Hormozi principles

#### Message 2: SMS + WhatsApp — 24 hours after exit
**Channels:** Twilio (SMS) + WhatsApp Business API
- Short, personal, direct with one specific insight
- If they reply: AI Sales Agent continues the conversation in that channel with full scan data access

#### Message 3: Final email — 3 days after exit
**Channel:** Resend
- Urgency: "Your results are available for a limited time"
- Last Cal.com CTA
- If no engagement after this: transition to long-term nurture (weekly insights)

### Follow-up rules
- If lead books a call at ANY point → immediately stop all follow-ups
- If lead replies "stop" or "unsubscribe" → immediately stop + mark in database
- Maximum 3 aggressive touches. Then transition to low-frequency nurture.
- Every message is personalized with their scan data — zero generic templates
- All messages comply with TCPA (SMS), CAN-SPAM (email), and WhatsApp Business policies

---

## 9. EXIT RECOVERY — NO EMAIL CAPTURED

If a lead enters their URL but leaves before providing email/phone, the system recovers contact info and still reaches out with their completed scan.

### The scan ALWAYS completes
Even if the lead bounces at the URL-entry stage, the scan runs to completion. Results are stored. Why waste the compute? Those results become ammunition.

### Contact recovery methods
1. **Website scrape:** Extract email addresses, phone numbers from their own website (public info)
2. **GBP data:** Pull business phone and email from Google Business Profile
3. **Social profiles:** Note detected handles for manual outreach
4. **WHOIS lookup:** For small businesses, WHOIS sometimes has owner contact info

### Recovery flow
```
Lead enters URL → scan starts → lead leaves without email
    ↓
Scan completes in background
    ↓
Scrape pipeline: website → GBP → social → WHOIS
    ↓
If contact found:
    → AI Sales Agent sends first email: "We ran a free funnel scan on [business] — here's what we found"
    → Include 1-2 annotated screenshots as proof of value
    → CTA: "See your full results" → links back to their scan page
If no contact found:
    → Flag in admin panel for manual outreach by Forge team
    → Social handles available for DM outreach
```

---

## 10. PROGRESSIVE CAPTURE UX

### The flow in detail

```
[1] User enters URL → scan starts
    Lead created with: website_url, ip_address, utm params
    Status: anonymous (no email, no phone)

[2] ~15-20 seconds into scan → capture prompt appears
    Non-blocking slide-in:
    "Your scan is running — enter your details to receive the full results"
    
    Fields:
    - Email (required to see full results)
    - Phone (framed as "Get a text when your blueprint is ready")
    
    Scan continues visually in background.
    If they DON'T enter email:
      - They see scan progress but results are blurred when ready
      - "Enter your email to see your full results"

[3] After email captured → full results visible
    Lead updated with: email, phone (if provided)

[4] Social handle confirmation (inline, non-blocking)
    Confident match: "We found your Instagram (@handle) — confirm?"
    Ambiguous match (multiple similar handles):
      ┌──────────────────────────────────────────────────────┐
      │ We found two Instagram profiles linked to your site  │
      │                                                      │
      │ Which is your main business account?                 │
      │                                                      │
      │  ○ @company.x                                        │
      │  ○ @company_x                                        │
      │  ○ Both are mine                                     │
      │  ○ Neither — my handle is: [________]                │
      └──────────────────────────────────────────────────────┘
    Not detected: "Add your social profiles for a more complete analysis (optional)"

[5] Blueprint CTA
    "Generate your optimized funnel blueprint"
    → Generates immediately (email + phone already captured)
    → No OAuth gate
```

### Capture psychology
- URL first = zero commitment entry
- They see the scan working = investment builds
- Email prompt comes after they've seen value = reciprocity
- Phone is optional and framed as a benefit = low friction
- Blueprint requires nothing extra = zero friction to the emotional peak

---

## 11. ALWAYS-VISIBLE CTA — AUPALE VODKA STYLE

### Reference: aupalevodka.com
The site has a "WHERE TO BUY?" button integrated into the top nav bar. Always there, never intrusive, feels like part of the site architecture.

### Forge implementation
```
┌──────────────────────────────────────────────────────────────┐
│  🔥 BOOK A FREE STRATEGY CALL         [Forge Logo]    MENU ≡│
└──────────────────────────────────────────────────────────────┘
```

- **Left:** CTA text + subtle animation (gentle glow pulse on text, not the whole bar)
- **Center:** Forge logo
- **Right:** Menu (if needed)
- **Background:** Semi-transparent glass (`--forge-surface` with backdrop-blur)
- **Position:** Fixed top, stays during scroll
- **On click:** Cal.com modal overlays the current page — user NEVER navigates away
- **Mobile:** Slightly more compact but equally visible
- **Design:** Premium, minimal, part of the brand architecture — not a sales popup

---

## 12. CAL.COM INTEGRATION

Cal.com is always a **modal overlay** on the current page. The user never leaves the results page.

### Triggers
1. Clicking the top banner CTA
2. AI Sales Agent embedding a booking link in chat
3. Any "Book a Call" CTA anywhere on the results page

### Behavior
- Modal overlays current page with a dark backdrop
- User can see scan results peeking behind the modal
- Pre-fills: name, email, phone (from progressive capture data)
- On successful booking: modal closes, confirmation animation, confetti or subtle gold sparkle
- Booking source tracked: 'banner_cta', 'ai_agent', 'results_cta', 'email_link', 'sms_link', 'whatsapp_link'

---

## 13. STRIPE — TEAM-INITIATED PAYMENTS

Stripe is used for **team-initiated payments during live strategy calls**, not for self-serve product upsells.

### Use case
Forge team member is on a strategy call, sharing the lead's scan results on screen. They close the deal and process payment right there — the lead sees their annotated results while paying. No "I'll send you an invoice later" momentum killer.

### Implementation
- Stripe Elements embedded in admin/team view of scan results
- Team member can generate a payment link or process payment directly
- Payment types: setup fee, monthly retainer, custom package
- Receipt sent to client automatically
- Payment status visible in admin panel

---

## 14. VOICE AI — ARCHITECT NOW, BUILD PHASE 2

Voice AI is part of the architecture from day one, built in Phase 2 (post-launch, pre-scale).

### Use case 1: AI Sales Agent voice calls
- Calls leads who haven't booked after the 3-touch drip sequence
- Natural conversational voice (ElevenLabs)
- Opens with their name + one specific finding from scan
- Goal: book the call
- If voicemail: leaves a personalized message with callback number

### Use case 2: Client Executive AI Assistant (premium service)
- Part of Forge's high-ticket client package
- Natural feminine voice trained on client's business context
- Handles: scheduling, email triage, customer service, CRM updates, task management
- Available via phone, WhatsApp voice notes, web interface
- Separate product/service from the scan tool — shares the AI infrastructure

### Shared infrastructure
```
┌──────────────────────────────────────┐
│         Voice Infrastructure         │
│  ElevenLabs + Deepgram + Twilio      │
├──────────────┬───────────────────────┤
│ Sales Agent  │  Executive Assistant  │
│ (scan leads) │  (premium clients)    │
└──────────────┴───────────────────────┘
```

---

## 15. TECHNICAL ARCHITECTURE

### 15.1 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | SSR, streaming, RSC |
| Styling | Tailwind CSS + shadcn/ui (customized) | Design system base |
| Animations | GSAP (ScrollTrigger, Flip, SplitText) | Premium motion |
| Database | Supabase (PostgreSQL + Auth + Storage) | Data, auth, files |
| Auth | Supabase Auth | Google OAuth (optional save, not a gate) |
| Payments | Stripe Elements | Team-initiated in-call payments |
| Email | Resend + React Email | Transactional + AI-generated drip |
| SMS | Twilio | SMS follow-ups + 2-way AI conversation |
| WhatsApp | WhatsApp Business API | WhatsApp follow-ups + AI conversation |
| Voice (Phase 2) | ElevenLabs + Deepgram + Twilio Voice | AI voice calls + executive assistant |
| Scheduling | Cal.com (embedded modal) | Call booking overlay |
| AI (Analysis) | Claude Sonnet 4 | Visual analysis, annotations, blueprint gen |
| AI (Quick) | Claude Haiku 3.5 | Technical checks, classification |
| AI (Sales Agent) | Claude Sonnet 4 | Omnichannel sales conversations |
| Screenshots | Browserless.io (primary) / Playwright (fallback) | Headless captures |
| Storage | Supabase Storage | Screenshots, assets |
| Analytics | PostHog + Vercel Analytics | Funnel tracking, session replay |
| Hosting | Vercel | Deployment, edge, CDN |
| i18n | next-intl | Bilingual EN/ES |

### 15.2 Database Schema

```sql
-- Leads (captured progressively during scan)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  full_name TEXT,
  website_url TEXT NOT NULL,
  business_name TEXT,
  language TEXT DEFAULT 'en',
  source TEXT DEFAULT 'organic',   -- 'organic', 'outreach', 'ad'
  capture_method TEXT,             -- 'direct', 'scraped', 'manual'
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (created on optional Google OAuth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',        -- 'user', 'team', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  website_url TEXT NOT NULL,
  status TEXT DEFAULT 'scanning',  -- scanning, capturing, analyzing, completed, failed
  detected_socials JSONB,
  provided_socials JSONB,
  completed_without_lead BOOLEAN DEFAULT FALSE, -- true if lead never provided email
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Funnel Stages
CREATE TABLE funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,             -- 'traffic', 'landing', 'capture', 'offer', 'followup'
  status TEXT DEFAULT 'pending',   -- pending, capturing, analyzing, completed, failed
  summary JSONB,
  findings JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Screenshots
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  source_type TEXT NOT NULL,       -- 'website', 'instagram', 'facebook', 'tiktok', 'linkedin', 'gbp', 'ads'
  source_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  viewport TEXT DEFAULT 'desktop',
  annotations JSONB,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blueprints (generated on user request)
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  funnel_map_data JSONB,
  mockup_html TEXT,
  mockup_target TEXT,              -- 'homepage', 'landing_page', 'instagram', etc.
  brand_colors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Sales Agent Conversations (unified across all channels)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  status TEXT DEFAULT 'active',    -- 'active', 'booked', 'declined', 'nurturing', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,           -- 'web', 'email', 'sms', 'whatsapp', 'voice'
  role TEXT NOT NULL,              -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB,                  -- inline data cards, Cal.com embeds, email subject, etc.
  delivered BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Sequence Tracking
CREATE TABLE followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  scan_id UUID NOT NULL REFERENCES scans(id),
  sequence_position INTEGER NOT NULL,
  channel TEXT NOT NULL,           -- 'email', 'sms', 'whatsapp', 'voice'
  status TEXT DEFAULT 'pending',   -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed'
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  scan_id UUID REFERENCES scans(id),
  cal_event_id TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no-show'
  source TEXT,                     -- 'banner_cta', 'ai_agent', 'results_cta', 'email_link', 'sms_link', 'whatsapp_link', 'voice_call'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (team-initiated during calls)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  scan_id UUID REFERENCES scans(id),
  team_member_id UUID REFERENCES users(id),
  stripe_payment_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  product_type TEXT NOT NULL,      -- 'setup_fee', 'monthly_retainer', 'custom_package'
  description TEXT,
  status TEXT DEFAULT 'pending',   -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limiting
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET,
  scan_count INTEGER DEFAULT 0,
  last_scan_at TIMESTAMPTZ DEFAULT NOW(),
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_scans_lead ON scans(lead_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_funnel_stages_scan ON funnel_stages(scan_id);
CREATE INDEX idx_screenshots_scan ON screenshots(scan_id);
CREATE INDEX idx_conversations_scan ON conversations(scan_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_followups_lead ON followups(lead_id);
CREATE INDEX idx_followups_scheduled ON followups(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_bookings_lead ON bookings(lead_id);
CREATE INDEX idx_payments_lead ON payments(lead_id);
CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_address);
```

### 15.3 API Routes

```
/api/
├── scan/
│   ├── start              POST — Accept URL, create lead + scan, start pipeline
│   ├── status/[id]        GET  — SSE stream for real-time scan progress
│   ├── capture-info       POST — Progressive capture (email, phone, socials)
│   └── results/[id]       GET  — Full scan results after completion
├── blueprint/
│   └── generate/[scanId]  POST — Generate funnel map + key piece mockup (email required, no auth gate)
├── auth/
│   ├── callback           GET  — Google OAuth callback (optional save)
│   └── link-scan          POST — Link authenticated user to existing scan
├── chat/
│   ├── start/[scanId]     POST — Initialize AI Sales Agent conversation
│   ├── message            POST — Send message to AI Sales Agent
│   └── stream/[convId]    GET  — SSE stream for AI responses
├── followup/
│   ├── trigger            POST — Trigger exit-intent follow-up sequence
│   ├── scrape-contact     POST — Attempt contact recovery for no-email leads
│   ├── webhook/sms        POST — Twilio SMS inbound webhook
│   ├── webhook/whatsapp   POST — WhatsApp inbound webhook
│   └── webhook/calcom     POST — Cal.com booking webhook
├── payments/
│   ├── create-intent      POST — Stripe payment intent (team-initiated)
│   ├── webhook            POST — Stripe webhook handler
│   └── verify             GET  — Verify payment status
├── admin/
│   ├── leads              GET  — Lead pipeline (team/admin only)
│   ├── dashboard          GET  — Metrics overview
│   ├── scan/[id]          GET  — Team view of scan results (for calls + payments)
│   └── team               CRUD — Team member management
├── cron/
│   ├── followup-sender    POST — Process pending follow-ups (runs every minute)
│   ├── nurture-sender     POST — Process long-term nurture emails (runs daily)
│   └── stale-scans        POST — Clean up abandoned scans (runs hourly)
└── health                 GET  — System health check
```

### 15.4 Real-Time Streaming (SSE)

```
Client                              Server

POST /api/scan/start
  { url: "example.com" }
    ←── { scanId: "abc-123" }

GET /api/scan/status/abc-123 (SSE)
    ←── { type: "scan_started", url: "example.com" }
    ←── { type: "page_discovered", url: "/about", stage: "landing" }
    ←── { type: "screenshot_captured", stage: "landing", thumbnailUrl: "..." }
    ←── { type: "social_detected", platform: "instagram", handle: "@example", confidence: "high" }
    ←── { type: "social_ambiguous", platform: "instagram", options: ["@co.x", "@co_x"] }
    ←── { type: "capture_prompt" }
    ←── { type: "screenshot_captured", stage: "traffic", source: "instagram", thumbnailUrl: "..." }
    ←── { type: "video_analysis", stage: "traffic", platform: "instagram", topVideos: [...] }
    ←── { type: "stage_analyzing", stage: "landing" }
    ←── { type: "annotation_ready", screenshotId: "...", annotations: [...] }
    ←── { type: "stage_completed", stage: "landing", findings: [...] }
    ←── { type: "stage_completed", stage: "traffic", findings: [...] }
    ←── { ... more stages ... }
    ←── { type: "scan_completed", summary: { ... } }
    ←── { type: "blueprint_available" }
```

### 15.5 Screenshot Pipeline

**Primary:** Browserless.io — managed headless browser API. $0 for first 1,000 pages/month, then usage-based. Simple, scalable, no infra headache.
**Fallback:** Self-hosted Playwright on Railway.

```typescript
async function captureScreenshots(scanId: string, websiteUrl: string) {
  const browser = await connectToBrowserless();
  
  // 1. Homepage (desktop + mobile)
  await captureAndStore(browser, websiteUrl, 'desktop', 'website', 'landing');
  await captureAndStore(browser, websiteUrl, 'mobile', 'website', 'landing');
  
  // 2. Inner pages (auto-detected, max 5)
  const innerPages = await detectInnerPages(browser, websiteUrl);
  for (const page of innerPages.slice(0, 5)) {
    await captureAndStore(browser, page.url, 'desktop', 'website', page.stage);
  }
  
  // 3. Social links detection + disambiguation
  const socials = await detectSocialLinks(browser, websiteUrl);
  // Emit SSE events (social_detected or social_ambiguous)
  
  // 4. Social profile captures
  for (const social of socials) {
    await captureAndStore(browser, social.url, 'desktop', social.platform, 'traffic');
  }
  
  // 5. GBP detection + capture
  const gbpUrl = await detectGBP(websiteUrl);
  if (gbpUrl) await captureAndStore(browser, gbpUrl, 'desktop', 'gbp', 'traffic');
  
  // 6. Ad library checks
  await checkMetaAdLibrary(websiteUrl);
  await checkGoogleAdsTransparency(websiteUrl);
  
  await browser.close();
}
```

---

## 16. PAGE STRUCTURE

```
/                          → Landing page (URL input hero, Aupale-style top banner)
/scan/[id]                 → Results page (streaming → complete → blueprint, all in one page)
/admin                     → Admin dashboard (leads, payments, scans)
/admin/scan/[id]           → Team view of scan (shareable during calls + Stripe payment)
```

**Three public pages. Two admin pages.** Cal.com is always a modal overlay, never its own page.

---

## 17. BRAND & DESIGN DIRECTION

### Color tokens
```css
:root {
  --forge-base: #0B1120;
  --forge-surface: #0F172A;
  --forge-card: #1E293B;
  --forge-accent: #D4A537;
  --forge-accent-hover: #E5B84A;
  --forge-text: #F8FAFC;
  --forge-text-muted: #94A3B8;
  --forge-border: rgba(212, 165, 55, 0.12);
  --forge-glass: rgba(30, 41, 59, 0.5);
  --forge-glass-border: rgba(212, 165, 55, 0.12);
  --forge-critical: #EF4444;
  --forge-warning: #F59E0B;
  --forge-opportunity: #3B82F6;
  --forge-positive: #22C55E;
}
```

### Design principles
- **Dark mode default.** No toggle on public pages.
- **Glassmorphism.** `backdrop-filter: blur(16px)`, translucent cards, subtle glow borders.
- **GSAP for all motion.** Not CSS transitions. Scroll-triggered reveals, staggered annotations, parallax, text splits.
- **Typography.** Distinctive display font + clean body font. Not Inter. Not Roboto. Must be memorable.
- **Sharp corners.** 8-12px radius max. Thin borders. Generous whitespace. Gold accents on hover.
- **Screenshot-first layout.** Results organized around large screenshot cards with floating annotations. A visual story, not a data table.
- **Conversation-native chat.** Custom-designed. Feels like iMessage. Not a helpdesk widget.

---

## 18. COPY PHASE

All website copy, email subjects, CTA text, chat openers, and AI Sales Agent messaging go through a **dedicated copy phase** after the product is functional.

During development, all user-facing text uses placeholders: `[COPY: description of what goes here]`

The copy phase covers:
- Landing page hero, subhead, section copy
- CTA button copy across all touchpoints
- AI Sales Agent conversation openers per channel
- Email subject line frameworks
- SMS and WhatsApp message frameworks
- Objection-response library
- Loading state messages ("Capturing your homepage..." etc.)
- Error messages and edge cases

This phase happens in parallel with AI Sales Agent training — both require the Hormozi transcripts and a deep understanding of the target audience.

---

## 19. MULTI-AGENT BUILD ARCHITECTURE

### 4 agents (streamlined)

| Agent | Role | Owns |
|-------|------|------|
| **Orchestrator** | Coordinates, manages contracts, deploys | `/contracts/`, `/docs/`, `CLAUDE.md` |
| **Backend** | DB, API routes, auth, screenshots, follow-up system, Stripe, webhooks, admin | `/src/app/api/`, `/src/lib/`, `/supabase/` |
| **Frontend** | All pages, components, design system, GSAP animations | `/src/app/(pages)/`, `/src/components/`, `/src/styles/` |
| **AI Engine** | All prompts, annotations, blueprint gen, Sales Agent, Hormozi training, drip copy | `/src/lib/ai/`, `/src/lib/prompts/`, `/src/i18n/` |

---

## 20. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Screenshots
BROWSERLESS_API_KEY=

# Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# WhatsApp
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# Voice (Phase 2)
ELEVENLABS_API_KEY=
DEEPGRAM_API_KEY=

# Scheduling
NEXT_PUBLIC_CALCOM_EMBED_URL=
CALCOM_API_KEY=
CALCOM_WEBHOOK_SECRET=

# Google APIs
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_PLACES_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=https://audit.forgedigital.com
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

---

## 21. RATE LIMITING

- 3 scans per IP per 24h rolling window
- 1 scan per email (if email captured)
- 60 API requests per minute per IP
- 1 SSE connection per scan_id
- Follow-up messages: max 3 aggressive touches per lead, then low-frequency nurture

---

## 22. ESTIMATED MONTHLY COSTS (at 500 scans/month)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Pro | $20/mo | Hosting |
| Supabase Pro | $25/mo | Database, auth, storage |
| Anthropic API | ~$100-150/mo | Annotations + Sales Agent conversations |
| Browserless.io | ~$30/mo | Screenshots |
| Resend | $20/mo | Pro tier for volume |
| Twilio SMS | ~$25-40/mo | SMS + phone number |
| WhatsApp Business | ~$30-50/mo | Conversation-based pricing |
| ElevenLabs (Phase 2) | ~$22-99/mo | Voice synthesis |
| Deepgram (Phase 2) | ~$15-25/mo | Speech-to-text |
| Twilio Voice (Phase 2) | ~$20-30/mo | Outbound calls |
| Stripe | 2.9% + $0.30/txn | On team-processed payments only |
| Cal.com | $15/mo | Scheduling |
| Google APIs | ~$5-10/mo | PageSpeed, Places |
| PostHog | $0 (free) | Up to 1M events |
| GSAP | $0 or $99/yr | Business license |
| **TOTAL** | **~$330-510/mo** | **Before revenue** |

**Break-even:** One Forge client at $10K/mo covers 20-30 months of tool operation.

---

## 23. TIMELINE

### Week 1: Foundation
- [ ] Orchestrator: Contracts, agent instructions, CLAUDE.md
- [ ] Backend: Supabase schema, auth, API stubs
- [ ] Frontend: Next.js 15 + GSAP setup, landing page, results page skeleton
- [ ] AI Engine: Begin Hormozi transcript processing pipeline

### Week 2: Scan Pipeline + AI Training
- [ ] Backend: Browserless integration, screenshot pipeline, social detection, SSE streaming
- [ ] AI Engine: Annotation prompts, video analysis logic, stage analysis
- [ ] AI Engine: **Hormozi training distillation** — process 6+ hrs of transcripts into structured knowledge base
- [ ] Frontend: Progressive capture UI, real-time results with GSAP animations

### Week 3: Integration + Blueprint + Sales Agent
- [ ] Integration: Full scan pipeline wired end-to-end
- [ ] AI Engine: Blueprint generator, funnel map builder
- [ ] AI Engine: **Sales Agent system prompt** — Hormozi-trained, omnichannel
- [ ] Frontend: Blueprint section, chat UI, Cal.com modal
- [ ] Backend: Cal.com webhooks, Stripe integration (team payments)

### Week 4: Follow-up System + Admin
- [ ] Backend: Resend drip, Twilio SMS, WhatsApp Business API, exit detection
- [ ] Backend: Contact scraping pipeline (for no-email leads)
- [ ] Backend: Admin panel (lead pipeline, team payments, scan viewer)
- [ ] AI Engine: Sales Agent testing — 20+ simulated conversations
- [ ] Frontend: Admin panel UI, mobile optimization, GSAP polish

### Week 5: Copy + Voice + Launch Prep
- [ ] **Dedicated copy phase:** All user-facing text, CTAs, email subjects, chat openers
- [ ] AI Engine: Sales Agent copy refinement based on testing
- [ ] Voice AI: ElevenLabs + Deepgram + Twilio Voice infrastructure
- [ ] Voice AI: Sales Agent voice persona training
- [ ] QA: E2E testing, cross-browser, mobile, all channels

### Week 6: Launch + Iterate
- [ ] Deploy: Vercel production, custom domain, analytics
- [ ] Launch scan tool
- [ ] Monitor: conversion rates, chat engagement, follow-up response rates
- [ ] Iterate: prompt tuning, copy optimization, animation polish
- [ ] Begin: Forge organic content strategy execution (parallel workstream)

---

## 24. SUCCESS METRICS

### Week 1-2 Post-Launch
- Scan completion rate: >80%
- Email capture rate: >60% of scan starters
- Phone capture rate: >30% of email captures
- Blueprint generation rate: >40% of email-captured leads

### Month 1
- Total scans: 300+
- Calls booked (all sources): 30+
- Calls from AI Sales Agent: 10+
- Calls from follow-up drip: 5+
- Forge packages closed: 2-4

### Month 3
- Total scans: 1,000+
- Monthly calls booked: 40+
- Forge monthly closes: 3-5
- AI Sales Agent chat→book rate: >15%
- Follow-up drip email→book rate: >5%

---

## 25. FUTURE CONSIDERATIONS

- **Video walkthrough** — AI generates a personalized video narrating findings
- **PDF export** — Branded report for offline sharing
- **White-label** — Let other agencies use the tool under their brand
- **Full video transcription** — Analyze actual video content, not just metadata
- **Campaign link system** — Unique trackable URLs for outreach (currently using UTM params)
- **Referral program** — "Share your scan, get X"
- **Re-scan** — "Check your progress" after implementing changes
- **Additional lead magnets** — Calculator, industry templates, hook library

---

*This document is the single source of truth for the Forge Funnel Scanner. All agent instructions, contracts, and implementation details derive from this spec.*
