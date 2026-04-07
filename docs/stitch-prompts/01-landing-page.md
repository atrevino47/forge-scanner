# Stitch Redesign Prompt: Landing Page (/)

## Page Purpose
Primary entry point for audit.forgedigital.com. A user arrives, enters their website URL, and starts a free AI-powered funnel scan. The page must communicate premium quality and convert visitors into scan users in under 5 seconds.

## Brand System
- **Mode:** Light mode only (Brand v2)
- **Background:** #FAFAF7 (warm white)
- **Surface:** #F5F4F0 (cards, nav)
- **Card/Elevated:** #ECEAE4
- **Accent:** #E8530E (Forge Orange) — MAX 5 uses per viewport
- **Text:** #1A1917 (primary), #6B6860 (secondary), #B8B5AD (muted)
- **Fonts:** Outfit (display/headlines, weight 800/700), Space Grotesk (body), JetBrains Mono (data/technical)
- **Radius:** 8-12px max. Sharp, not rounded.
- **Texture:** Grain overlay on body (body::after). Dot grid pattern for depth in sections.

## Fixed Top Bar (Aupale Vodka-style)
- Fixed at top, full-width, glass effect: backdrop-filter blur(16px), bg rgba(250,250,247,0.92)
- Left: "BOOK A FREE STRATEGY CALL" — font-mono, uppercase, tracking-widest, text-xs. Subtle orange glow on hover. Opens Cal.com modal overlay.
- Center: FORGE logo (Outfit, weight 900, tracking tight)
- Right: Hamburger menu icon (for future use)
- Thin bottom border: #ECEAE4
- Height: ~56px

## Hero Section (full viewport height)
- Centered content, max-width 960px
- Decorative: Faint "F" watermark in top-right (font-display, ~380px, opacity 0.03). Subtle orange radial gradient glow in top-right corner (opacity 0.07).

### Components (top to bottom):
1. **Badge** — inline-flex, rounded-full, border #ECEAE4, bg #F5F4F0. Small orange dot + "AI-Powered Funnel Audit" in Space Grotesk, text-sm, text-secondary.
2. **Headline** — "Find what's broken in your funnel — in 60 seconds". Outfit weight 900, clamp(2.5rem, 5vw+1rem, 4rem), letter-spacing -0.02em, line-height 1.08, max-width 600px. Color: #1A1917.
3. **Subheadline** — "Enter your URL. We capture real screenshots, AI annotates every issue, and generate an optimized blueprint — free." Space Grotesk, text-lg, line-height 1.65, color #6B6860, max-width 480px.
4. **URL Input** — max-width 560px. Container: rounded-xl, border #ECEAE4, bg #F5F4F0. On focus: border goes orange 30% opacity, subtle box-shadow glow. Input: "yourwebsite.com" placeholder, Space Grotesk. Button inside: "Scan My Funnel" + arrow icon, bg Forge Orange, white text, rounded-lg, hover brightens to #FF6B2B. Height: 56px desktop, 64px mobile.
5. **Trust indicators** — horizontal flex, text-sm, color #B8B5AD. Three items separated by tiny dots: "Free, no card required" / "Results in 60 seconds" / "AI-powered analysis"

### Animation sequence (GSAP):
- Beat 1 (0.0s): Badge — fadeSlideUp (y:20, opacity:0 to y:0, opacity:1)
- Beat 2 (0.15s): Headline — clipReveal (clip-path wipe from bottom)
- Beat 3 (0.4s): Subheadline — fadeSlideUp
- Beat 4 (0.6s): URL Input — fadeSlideUp
- Beat 5 (0.8s): Trust indicators — fadeSlideUp

## How It Works Section
- Background: #F5F4F0 (surface)
- Section heading: "How It Works" — font-mono, xs, uppercase, tracking-widest, color #6B6860
- 3-step horizontal layout (stacks on mobile):

### Step cards:
Each card: bg #FAFAF7, border #ECEAE4, padding 32px, min-height ~200px
- **Step number** — font-mono, text-6xl, color Forge Orange, opacity 0.15
- **Title** — Outfit weight 700, text-xl
- **Description** — Space Grotesk, text-sm, color #6B6860, line-height 1.65

Steps:
1. "Enter Your URL" — "Paste your website URL. Our AI starts scanning your entire digital presence immediately."
2. "AI Analyzes Everything" — "We capture real screenshots of your site, socials, ads, and GBP. AI annotates every issue with specific callouts."
3. "Get Your Blueprint" — "See your optimized funnel map and a professional mockup of your weakest piece. Then book a free strategy call."

### Animation: Cards stagger in with scaleIn preset, 120ms stagger, triggered on scroll (start: top 85%)

## Trust / Social Proof Section
- Background: #FAFAF7
- Section heading: "Built for businesses that want to grow" — Outfit weight 700
- Stats row: 3-4 metrics in a horizontal flex
  - Each: font-display text-4xl weight 800 for the number, font-mono text-xs uppercase for the label
  - Examples: "500+" scans completed, "< 60s" average scan time, "5" funnel stages analyzed, "Free" always
- Optional: Logos strip of tools used (Supabase, Vercel, Claude, etc.) in monochrome, opacity 0.4

## FAQ Section
- Accordion-style, max-width 720px centered
- Each item: border-bottom #ECEAE4, padding-y 20px
- Question: Outfit weight 600, text-lg
- Answer: Space Grotesk, text-sm, color #6B6860
- Toggle icon: plus/minus, transitions with CSS
- 5-6 questions covering: "Is it really free?", "What do you scan?", "How does the AI work?", "Do I need to create an account?", "What happens after the scan?", "How do I book a call?"

## Footer
- Background: #1A1917 (near-black)
- Text: #B8B5AD
- Logo: FORGE in Outfit, white
- Links: Privacy, Terms
- Copyright: "(c) 2026 Forge Digital"
- Minimal — 2-3 rows max

## Mobile Considerations
- Hero headline: clamp scales down to ~2.5rem
- URL input: full-width, button stacks below input on very small screens
- How It Works: cards stack vertically
- All padding increases slightly for touch targets
- Top bar: logo only center, CTA text shorter or icon-only

## Key Design Principles
- NO particle effects, mesh gradients, or rainbow colors
- NO typewriter effects on headlines
- NO generic icon grids
- Generous whitespace between sections (min 80px vertical padding)
- Grain overlay visible subtly on all backgrounds
- Every element feels like it belongs in a $100K product
- The page should feel like Stripe's marketing site crossed with Aupale Vodka's aesthetic
