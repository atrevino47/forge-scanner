# Stitch Redesign Prompt: Scan Results Page (/scan/[id])

## Page Purpose
The core product page. After submitting a URL, the user lands here and watches their scan progress in real-time, then explores their full funnel audit results. This page must feel like receiving a deliverable from a premium agency — not a generic audit tool output. Everything drives toward one goal: book a strategy call.

## Page States
The page has 3 progressive states:
1. **Scanning** — progress indicator with streaming messages
2. **Results** — full audit with tabbed navigation (Overview / Stages / Roadmap)
3. **Blueprint** — generated funnel map + mockup (after user clicks CTA)

The chat panel and top banner CTA are persistent after email capture.

## Brand System
Same as landing page (Brand v2 light mode). Key additions:
- Semantic colors for findings: Critical #D93636, Warning #D4890A, Opportunity #2B7BD4, Positive #2D8C4E
- Glass effect cards for elevated components
- Dark mode only for chat panel (tool interface feel)

## Fixed Top Bar
- Same Aupale-style as landing page
- Shows scanned URL in center instead of FORGE logo when results are visible
- "Book a Free Strategy Call" always visible on left
- Glassmorphism: backdrop-blur(16px), semi-transparent

## Layout
- Single column, max-width ~480px (mobile-first, reads like a story on phone)
- Generous vertical spacing between sections
- Bottom navigation tabs (fixed) when results are complete

---

## State 1: Scanning (Progress)

### Progress Indicator
- Centered in viewport
- Animated Forge logo or subtle pulse
- Streaming text messages appear one by one:
  - "Starting your funnel scan..."
  - "Capturing your homepage..."
  - "Analyzing your Instagram..."
  - "Detecting your funnel structure..."
- Each message: font-body, text-sm, color #6B6860, fadeSlideUp animation
- Messages stack vertically, older ones fade to muted

### Email Capture Prompt (~15s in)
- Slides up from bottom (GSAP)
- Glass card: backdrop-blur, rounded-xl, shadow-2xl
- "Your scan is running — enter your details for the full results"
- Email input (required) + Phone input (optional, "Get a text when your blueprint is ready")
- Submit button: Forge Orange, full-width
- Dismiss X in corner
- If dismissed: results will be blurred behind an unlock gate

---

## State 2: Results (Complete)

### Bottom Tab Navigation (fixed at bottom)
Three tabs, full-width, bg glass effect:
- **Overview** — grid icon
- **Stages** — layers icon
- **Roadmap** — map icon
Active tab: Forge Orange text + bottom border. Inactive: #6B6860.
Height: ~64px with safe area padding.

### Tab: Overview

#### Audit Overview Section
- **Overall Health Score** — large number (font-display, text-7xl), /100, with severity badge (Strong/Weak/Critical)
  - Score card: bg Forge Orange, white text, rounded-xl, shadow-xl with orange glow
  - Badge: white bg, orange text, font-mono uppercase
- **Headline Summary** — AI-generated one-liner about their biggest issue
  - Card: bg #F5F4F0, left border 4px Forge Orange, padding 24px
  - Text: Outfit weight 700, text-xl
- **Stage Summary Grid** — horizontal scrollable pills for each funnel stage
  - Each pill shows: stage name + mini score or status icon
  - Active/clickable: navigates to Stages tab with that stage selected

#### Health & Potential Section
- Side-by-side comparison: Current State vs. Forge Potential
- Current: score with issues count
- Potential: projected score after fixes
- Visual: progress bars or radial gauges
- CTA: "See how we'd fix this" — Forge Orange button

### Tab: Stages (the core audit)

#### Stage Selector
- Horizontal scrollable pills at top
- Each pill: font-mono, text-[10px], uppercase, tracking-widest
- Active: bg Forge Orange, white text, shadow-md
- Only stages with data appear
- Stages: Traffic Sources, Landing Experience, Lead Capture, Offer & Conversion, Follow-Up System

#### Stage Content (per stage)

**Score Hero Card**
- bg Forge Orange, white text, rounded-xl
- Large score number (text-7xl) + /100 + severity badge
- font-mono label "AUDIT SCORE" above number

**Summary Card**
- bg #F5F4F0, left-border 4px Forge Orange
- AI-generated headline about this stage's main issue
- Outfit weight 700, text-xl

**Visual Context (Browser Mockup)**
- "VISUAL CONTEXT" section header: font-mono, xs, uppercase, tracking-widest
- Browser chrome bar: 3 dots (red/yellow/green style but in orange tones), URL bar showing source, lock icon
- **Screenshot viewport**: max-height 480px, scrollable (overflow-y auto). User scrolls within the mockup to see the full captured page.
- **Annotation dots** overlaid on screenshot at AI-determined positions:
  - Numbered circles (1, 2, 3...), 24px diameter
  - Color-coded: Orange (critical/warning), Green (positive), Blue (opportunity)
  - White border, colored shadow glow
  - Click to reveal popover with finding detail
  - GSAP stagger entrance: scale from 0, back.out easing
- Subtle gradient fade at bottom of viewport (scroll hint)

**Detailed Findings List**
- Header: "Detailed Findings (N)" — font-mono, xs, uppercase
- Each finding card: bg #FEFEFE, padding 20px
  - Left stripe: 1.5px for critical (Forge Orange), 1px for others (matching color)
  - Index number: font-display, text-2xl, matching color, opacity 0.4
  - Severity badge: colored bg + text, font-mono, text-[10px], uppercase
  - Material icon (report/warning/check_circle) in matching color
  - Title: Outfit weight 700, text-lg
  - Detail: Space Grotesk, text-sm, color #6B6860

**Bottom CTA Card**
- Gradient: from Forge Orange to #ff7a3d
- White text
- "Ready to Forge?" headline, Outfit weight 800, text-3xl
- Subtext about fixing this stage's issues
- Full-width white button: "INITIATE REFACTOR" — font-mono, uppercase, tracking-widest
- Faint construction icon watermark in top-right

### Tab: Roadmap

#### Implementation Roadmap
- Prioritized list of fixes across all stages
- Grouped by priority: P1 (Critical), P2 (High), P3 (Medium)
- Each item: stage badge + finding title + estimated impact
- Bottom CTA: "Forge Your Solution" — same orange gradient card style

---

## State 3: Blueprint (after generation)

### Blueprint CTA
- Appears in Overview tab after scan complete + email captured
- Card: bg #F5F4F0, border dashed #ECEAE4
- "Generate Your Optimized Blueprint" — Outfit weight 700
- "See what your funnel should look like" — Space Grotesk, text-sm
- Button: Forge Orange, full-width
- Loading state: skeleton shimmer with "Generating your blueprint..." text
- Error state: red border, retry button

### Blueprint View (replaces CTA after generated)
- **Funnel Map**: Interactive diagram showing current vs. optimized funnel
  - Left column: current state (stages with health indicators)
  - Right column: optimized state (all stages connected, green indicators)
  - Missing stages highlighted as gaps
  - Click any stage to expand details
- **Key Piece Mockup**: Live HTML preview of the redesigned weakest piece
  - Rendered in an iframe-like container
  - Uses their brand colors (extracted from scan)
  - "Built by Forge" watermark
  - Not downloadable

---

## Persistent Elements

### Email Gate (if not captured)
- Results are visible but blurred (GSAP blur 8px)
- Fixed bottom overlay: gradient from base to transparent
- "Unlock Your Full Results" — Outfit weight 700
- "Enter your email to see the complete audit findings"
- Button: "Unlock Results" — Forge Orange

### Chat Panel (after email capture, 30s delay)
- Slides in from bottom-right (mobile: full-width bottom sheet)
- Toggle button: fixed bottom-right, circular, Forge Orange, chat icon
- Panel: dark mode (bg #141413, text #F0EFE9)
- iMessage feel — NOT Intercom/Drift
- Messages: rounded bubbles, assistant on left (subtle dark card bg), user on right (Forge Orange bg)
- Typing indicator: 3 bouncing dots
- Can show data cards inline (scan findings)
- Can embed Cal.com calendar directly in chat
- Auto-focus input on open, smooth scroll to latest message

### Cal.com Modal
- Triggered by any "Book a Call" CTA
- Dark backdrop overlay
- Results page visible behind
- Pre-fills: name, email, phone from capture data
- On booking: confirmation animation (subtle gold sparkle)

---

## Animation Sequences (all GSAP)

### Results entrance:
- Score card: scaleIn (0.0s)
- Summary: fadeSlideUp (0.2s)
- Browser mockup: scaleIn (0.4s)
- Annotation dots: scale from 0 with back.out (0.8s, 150ms stagger)
- Finding cards: fadeSlideUp (0.8s, 100ms stagger)
- CTA card: scaleIn (1.6s)

### Email gate:
- Blur on: filter blur(0px to 8px), 0.6s
- Overlay entrance: fadeSlideUp, 0.5s, 0.2s delay
- Unblur: overlay fades first (0.3s), then blur removes (0.8s)

### Chat:
- Panel entrance: slideUp from below viewport
- Messages: fadeSlideUp with subtle scale
- Badge pulse: GSAP-driven, not CSS

## Mobile Considerations
- Max-width ~480px already mobile-optimized
- Bottom nav: safe-area-inset-bottom padding
- Chat: full-width bottom sheet instead of floating panel
- Stage pills: horizontal scroll with momentum
- Screenshot mockup: same scroll behavior, smaller chrome bar
