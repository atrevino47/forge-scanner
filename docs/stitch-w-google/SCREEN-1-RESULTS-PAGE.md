# Screen 1: Results Page

**Mode:** Web
**Priority:** Highest — this is the core product experience

## Prompt

```
Design a dark-mode web page that shows AI audit results for a website. The page uses a story-scroll layout where each section takes the full viewport.

Section 1: A stage called 'Traffic Sources' with a score badge (0/100, red). Shows a summary finding in large text. Minimal — this stage had no data found.

Section 2: 'Landing Experience' with score 35/100 (yellow). Left side shows a website screenshot inside a laptop device frame. Right side shows a findings list with color-coded dots (red = critical, yellow = warning, green = positive). Below: a mobile screenshot in a phone frame, smaller than the laptop.

Section 3-4: Similar layout for 'Lead Capture' (45/100) and 'Offer & Conversion' (15/100).

Section 5: 'Follow-up & Nurture' — another minimal section (0/100).

Section 6: Health score reveal — large radial gauge showing 19/100 with red arc. Three stat cards: stages found, stages missing, critical issues. A prominent gold CTA button to generate the blueprint.

Style: deep navy #0B1120 background, glassmorphism frosted-glass cards, warm gold #D4A537 accents (sparingly), Instrument Serif for headlines. Premium SaaS quality.
```

## What we're fixing
- All 5 stages dump at once — needs story-scroll, one stage per viewport
- Screenshots are raw images — need device chrome (laptop/phone frames)
- Mobile and desktop screenshots look identical — need size differentiation
- Annotation dots disconnected from findings list — need visual linkage
- Health score is just a number — needs radial gauge
- No visual rhythm between stages — needs breathing room
