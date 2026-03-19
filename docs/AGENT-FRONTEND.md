# AGENT-FRONTEND — Frontend Agent Instructions

> Read `CLAUDE.md` first, then this file.

## Your role
You own ALL user-facing pages, components, layouts, animations, and the design system. You make this app look and feel like a $100K product. Every interaction is a silent sales pitch for Forge.

## Your directories
```
/src/app/layout.tsx                    # Root layout
/src/app/page.tsx                      # Landing page
/src/app/scan/[id]/page.tsx            # Results page (scan + results + blueprint + chat)
/src/app/admin/page.tsx                # Admin dashboard
/src/app/admin/scan/[id]/page.tsx      # Team scan view (calls + payments)
/src/components/                       # ALL components
/src/styles/                           # Global styles, design tokens
/public/                               # Static assets, fonts
/tailwind.config.ts                    # Tailwind configuration
```

## DO NOT TOUCH
- `/src/app/api/` (Backend)
- `/src/lib/db/` (Backend)
- `/src/lib/screenshots/` (Backend)
- `/src/lib/ai/` (AI Engine)
- `/src/lib/prompts/` (AI Engine)
- `/contracts/` (Orchestrator only)

## CRITICAL: Read the frontend-design skill FIRST
Before writing any UI code, read `/mnt/skills/public/frontend-design/SKILL.md`. Follow its principles for distinctive, non-generic design.

## Brand tokens
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

## Design rules
- Dark mode default. No toggle on public pages.
- Glassmorphism: `backdrop-filter: blur(16px)`, translucent cards, subtle glow borders.
- GSAP for ALL motion. Install `gsap` and `@gsap/react`. Use `useGSAP` hook with proper cleanup.
- Typography: pick a distinctive display font + clean body. NOT Inter/Roboto/Arial. Load via `next/font` or Google Fonts.
- Sharp corners: 8-12px radius max. Thin 0.5px borders. Generous whitespace.
- Gold accents on hover states and CTAs.

## Build order

### Phase 1: Foundation (Week 1)

**1. Project setup**
```bash
npx create-next-app@latest forge-scanner --typescript --tailwind --app --src-dir
cd forge-scanner
npm install gsap @gsap/react @supabase/supabase-js @stripe/stripe-js lucide-react
npx shadcn@latest init
```

NOTE: `create-next-app` may wipe the `.claude/` folder. Reinstall skills after init.

**2. Root layout + globals.css**
- Dark mode default via `<html class="dark">`
- Forge brand tokens in CSS variables
- Font loading (distinctive display + clean body)
- PostHog provider setup

**3. Always-visible top banner (Aupale Vodka style)**
```
┌──────────────────────────────────────────────────────────────┐
│  🔥 BOOK A FREE STRATEGY CALL         [Forge Logo]    MENU ≡│
└──────────────────────────────────────────────────────────────┘
```
- Left: CTA text with subtle gold glow pulse
- Center: Forge logo
- Right: Menu (minimal)
- Background: `--forge-surface` with `backdrop-filter: blur(16px)`
- Fixed position, stays during scroll
- On click: Cal.com modal overlay (NEVER navigates away)
- Mobile: compact but CTA equally visible

**4. Landing page (`/`)**
- Single URL input hero. Massive, prominent.
- Headline: `[COPY: benefit-driven headline about scanning their funnel]`
- Subhead: `[COPY: what happens when they enter their URL]`
- Input: full-width URL field with "Scan my funnel" button
- Below fold: "How it works" (3-step visual), trust signals, FAQ
- GSAP: hero text split animation on load, scroll-triggered reveals for sections below
- Mobile-first. Lighthouse 90+.

### Phase 2: Results Page (Week 2)

**5. Results page (`/scan/[id]`)**
This is the most important page. It's where everything happens — streaming results, annotations, blueprint, chat, booking. ONE page, many states.

**Components:**
```
/src/components/scan/
├── ScanLayout.tsx              # Overall page layout + SSE connection
├── ProgressIndicator.tsx       # Real-time scan progress
├── CapturePrompt.tsx           # Email + phone capture slide-in
├── SocialConfirmation.tsx      # Handle disambiguation popup
├── StageSection.tsx            # One funnel stage with screenshots
├── ScreenshotCard.tsx          # Large screenshot with annotation overlays
├── AnnotationMarker.tsx        # Clickable annotation dot on screenshot
├── AnnotationPopover.tsx       # Detail popover on annotation click
├── FunnelHealthSummary.tsx     # Overall scan summary
├── BlueprintCTA.tsx            # "Generate your blueprint" button
├── BlueprintView.tsx           # Funnel map + mockup display
├── FunnelMap.tsx               # Interactive SVG funnel diagram
├── MockupPreview.tsx           # HTML mockup in iframe/container
├── VideoAnalysis.tsx           # Top video performance display
└── SkeletonLoader.tsx          # Shimmer loading states
```

**UX flow:**
1. SSE connects to `/api/scan/status/{id}`
2. Screenshots stream in with GSAP staggered reveals
3. ~15-20s in: `CapturePrompt` slides in from bottom
4. As stages complete: annotations animate onto screenshots (GSAP stagger)
5. After all stages: `FunnelHealthSummary` + `BlueprintCTA` appear
6. On blueprint click: `BlueprintView` expands with GSAP timeline animation
7. After 30s of inactivity: AI chat slides in (see below)

**Screenshot annotations UX:**
- Screenshot displayed full-width in a card
- Colored dots at annotation positions (red/amber/blue/green)
- GSAP stagger: dots appear one by one (200ms delay each)
- Click/hover reveals popover with title + detail
- Mobile: tap to toggle popover

**6. AI Sales Agent chat**
```
/src/components/chat/
├── ChatContainer.tsx           # Chat panel (slides in from right or bottom)
├── ChatMessage.tsx             # Individual message bubble
├── ChatInput.tsx               # Text input + send
├── DataCard.tsx                # Inline screenshot/finding card in chat
├── CalcomEmbed.tsx             # Calendar embed within chat
├── TypingIndicator.tsx         # Natural typing dots
└── ChatToggle.tsx              # Minimize/expand button
```

Custom design — NOT Intercom/Drift style. Feels like iMessage:
- Smooth slide-in from right (desktop) or bottom (mobile) via GSAP
- Messages animate in smoothly
- Typing indicator with natural pacing
- Data cards show scan screenshots inline
- Cal.com embeds directly in the conversation

**7. Cal.com modal**
```
/src/components/shared/
├── CalcomModal.tsx              # Full-screen overlay with Cal.com embed
├── BookingConfirmation.tsx      # Success animation after booking
└── TopBanner.tsx                # The always-visible nav CTA
```

Uses `@calcom/embed-react`. Modal overlays current page. Pre-fills name/email/phone. On successful booking: close modal + gold sparkle confetti animation.

### Phase 3: Admin (Week 4)

**8. Admin dashboard (`/admin`)**
- Metric cards: total scans, leads, bookings, revenue
- Recent scans table with status, lead info
- Always dark mode

**9. Team scan view (`/admin/scan/[id]`)**
- Full scan results (same as public but with admin controls)
- Stripe Elements payment form (embedded)
- Lead info sidebar
- Notes field for team

### Phase 4: Polish (Week 4-5)

**10. GSAP animation pass**
- Page transitions between routes
- Scroll-triggered reveals on landing page
- Score count-up animations
- Screenshot parallax on scroll
- Annotation stagger timing refinement
- Blueprint funnel map entrance animation
- Mobile: respect `prefers-reduced-motion`

**11. Performance**
- Next.js Image for all images
- Dynamic imports for heavy components (Cal.com, Stripe, chat)
- GSAP: register plugins once in layout, not per component
- Lighthouse 90+ on landing page (heavy animations need careful loading)

## Data fetching
Always call Backend API routes. Never import from `/src/lib/db/`.
```typescript
// ✅ Correct
const res = await fetch(`/api/scan/results/${id}`);
const data = await res.json();

// ❌ Wrong
import { getScanResults } from '@/lib/db/queries';
```

## GSAP in React pattern
```typescript
'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function AnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.annotation-dot', {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      stagger: 0.15,
      ease: 'back.out(1.7)',
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>...</div>;
}
```

## Glassmorphism card pattern
```tsx
<div className="backdrop-blur-xl bg-forge-glass border border-forge-glass-border rounded-xl p-6 transition-all duration-200 hover:border-forge-accent/20">
  {children}
</div>
```

## Receiving Fix Tickets

When Adrián gives you a fix ticket path (e.g., `docs/fixes/FIX-0004.md`):

1. Read the ticket file completely
2. Read the file(s) listed in "File(s) to modify"
3. Apply ONLY the change described — no refactoring, no "while I'm here" improvements
4. Do NOT modify files outside your owned directories
5. Do NOT modify the fix ticket itself (it is Orchestrator-owned)
6. Do NOT modify `docs/fixes/FIX-LOG.md` (it is Orchestrator-owned)
7. After applying the fix, confirm to Adrián what you changed
8. The Orchestrator will run verification separately
