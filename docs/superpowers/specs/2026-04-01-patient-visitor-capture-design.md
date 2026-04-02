# Patient Visitor Screenshot Capture — Design Spec

**Date:** 2026-04-01
**Status:** Approved
**Scope:** `src/lib/screenshots/client.ts` — `capturePageWithMetadata` function

## Problem

Screenshot captures on animation-heavy websites (GSAP, Framer Motion, AOS, ScrollTrigger) produce blank or partially-rendered images. The current approach scrolls too fast (200ms per 80%-viewport step) and relies on a CSS force-override (`opacity: 1 !important; visibility: visible !important`) to make hidden content visible. This produces screenshots that don't match what a real visitor sees — undermining client trust in Forge's scan quality.

**History:** FIX-0008 through FIX-0012 iterated on this problem. FIX-0010 added aggressive CSS overrides (transform, transition, animation, clip-path). FIX-0011 rolled back transform. FIX-0012 simplified to opacity + visibility only. The core issue persists: we're fighting the page's animations instead of letting them complete naturally.

## Solution — "Patient Visitor"

Simulate a real human visiting the page. Scroll slowly enough for scroll-triggered animations to fire and play to completion. Wait for the browser to finish painting. Capture the page exactly as a visitor would see it. Remove all CSS force-overrides.

## File Modified

`src/lib/screenshots/client.ts` — only the `capturePageWithMetadata` function body (lines ~118-240). No other files change. The function signature, return type (`PageWithMetadata`), and all other exports remain identical.

## Constants

```typescript
const SCROLL_STEP_PX = 300;
const SCROLL_PAUSE_MS = 400;
const SCROLL_BACK_SETTLE_MS = 2000;
const IDLE_WAIT_MAX_MS = 3000;
const MAX_SCROLL_TIME_MS = 30_000;
```

## Capture Sequence

After `page.goto(url, { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT_MS })`:

### Phase 1 — Initial settle

Wait for above-the-fold animations (hero fades, entrance timelines) to complete. Use a JS-level idle detection pattern:

```
requestAnimationFrame → requestAnimationFrame → requestIdleCallback
```

Wrapped in a Promise with `IDLE_WAIT_MAX_MS` (3s) timeout. This detects when the browser has finished its initial paint cycle, which is more reliable than a blind `waitForTimeout`.

### Phase 2 — Slow scroll down

- Scroll in `SCROLL_STEP_PX` (300px) increments using `window.scrollBy(0, step)`
- Pause `SCROLL_PAUSE_MS` (400ms) between each step — enough for ScrollTrigger, AOS, Intersection Observer callbacks to fire and animation timelines to play
- After reaching the current `document.body.scrollHeight`, re-measure height
- If height grew (lazy-loaded content appeared), continue scrolling
- Safety cap: `MAX_SCROLL_TIME_MS` (30s) total scroll time to prevent infinite loops on infinite-scroll pages

### Phase 3 — Scroll back to top

- `window.scrollTo(0, 0)`
- Wait `SCROLL_BACK_SETTLE_MS` (2000ms) — hero sections often have entrance animations that replay or settle when the viewport returns to top

### Phase 4 — Final paint wait

Same idle detection as Phase 1: `requestAnimationFrame` chain + `requestIdleCallback`, capped at `IDLE_WAIT_MAX_MS` (3s). Catches any final repaints triggered by the scroll-back.

### Phase 5 — Capture

`page.screenshot({ fullPage, type: 'png' })` — identical to current behavior.

## What Gets Removed

1. **CSS force-override block** (current lines 184-199): The `page.addStyleTag` that injects `opacity: 1 !important; visibility: visible !important` on all elements. Removed entirely. We trust the page to render as the visitor sees it.

2. **Blind 2000ms wait** (current line 179): `await page.waitForTimeout(2000)` — replaced by the idle detection in Phase 1.

## What Stays Unchanged

- `connectBrowser()` — Browserless.io CDP connection
- `disconnectBrowser()` — browser cleanup
- `captureScreenshot()` — low-level screenshot helper
- `CaptureScreenshotOptions` and `PageWithMetadata` types
- Navigation logic with timeout fallback and partial-load capture
- HTML extraction (`page.content()`) and title extraction (`page.title()`)
- Error handling pattern: try/catch per phase, warn and continue on non-fatal failures
- Viewport constants: `DESKTOP_VIEWPORT` (1440x900), `MOBILE_VIEWPORT` (375x812)

## Error Handling

Each phase (initial settle, scroll, scroll-back, final wait) is wrapped in its own try/catch. If any phase fails, log a warning and proceed to the next phase. The capture itself is the only phase where failure propagates up.

The scroll routine's `MAX_SCROLL_TIME_MS` safety cap prevents hangs on infinite-scroll pages — if the cap is hit, log a warning and proceed with whatever was scrolled.

## Performance Impact

| Metric | Current | After |
|--------|---------|-------|
| Per-page capture | ~4-5s | ~10-15s |
| Full scan (10 pages) | ~50s | ~2-2.5min |
| Total pipeline (capture + AI) | ~60-90s | ~3-4min |

The SSE progress stream keeps the user informed during capture. The added time is acceptable — screenshot quality is the product's first impression.

## Edge Cases

- **Infinite scroll pages** (Instagram, Twitter): `MAX_SCROLL_TIME_MS` cap prevents hanging. We capture what loaded during the scroll window.
- **Click-to-reveal content**: Not captured. This is correct — a real visitor wouldn't see it on first load either.
- **Extremely long pages** (10,000px+): Scroll time grows linearly. A 10,000px page at 300px steps = ~33 steps * 400ms = ~13s scroll time. Within the 30s cap.
- **Pages with no animations**: The idle detection returns quickly, scroll pauses are just short waits. Overhead is minimal (~2-3s extra vs current).
- **Sites that block scrolling** (scroll-jacking, fullpage.js): The scroll commands still fire via `window.scrollBy`, which bypasses CSS `overflow: hidden` on body. If JS intercepts scroll events, we may not scroll the full page. Acceptable — the screenshot captures what the viewport shows, same as a real visitor stuck on the first "slide."

## Testing

1. `bunx tsc --noEmit` — zero errors
2. `bun run build` — clean build
3. Manual test: run a scan on an animation-heavy site and verify screenshots show fully-rendered content
4. Manual test: run a scan on a simple static site and verify no regression (content still visible, no blank areas)
