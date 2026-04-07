# Patient Visitor Screenshot Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate blank/partially-rendered screenshots on animation-heavy websites by combining Playwright's native animation APIs with a slow-scroll "Patient Visitor" approach.

**Architecture:** 3-layer fix in a single file (`src/lib/screenshots/client.ts`). Layer 1: `reducedMotion: 'reduce'` on browser context. Layer 2: Patient Visitor slow scroll fires JS-based scroll triggers (GSAP, AOS). Layer 3: `animations: 'disabled'` + `style` parameter on `page.screenshot()` fast-forwards remaining CSS animations and applies targeted overrides only during capture. The existing IntersectionObserver mock, JS class cleanup, and lazy-load data-src swap stay unchanged.

**Tech Stack:** playwright-core 1.58.2 (CDP via `connectOverCDP`), TypeScript strict mode, Next.js 16

---

## File Structure

Only one file changes: `src/lib/screenshots/client.ts` (669 lines → ~720 lines)

| Section | What changes |
|---------|-------------|
| Constants (top) | Add 5 new scroll/idle constants |
| `captureScreenshot()` | Add `animations: 'disabled'`, `caret: 'hide'`, `style` parameter |
| `capturePageWithMetadata()` — context creation | Add `reducedMotion: 'reduce'` |
| `capturePageWithMetadata()` — content reveal | Remove `page.addStyleTag()` CSS injection block (lines 328-395). Keep JS class cleanup (lines 398-438). |
| `capturePageWithMetadata()` — new helper | Add `waitForIdle()` helper function |
| `capturePageWithMetadata()` — new helper | Add `slowScroll()` helper function |
| `capturePageWithMetadata()` — full mode | Replace blind waits with idle detection + slow scroll before tall viewport resize |
| `capturePageWithMetadata()` — fast mode | Replace blind 2000ms wait with idle detection |

---

## Task 1: Add constants and `SCREENSHOT_STYLE` CSS string

**Files:**
- Modify: `src/lib/screenshots/client.ts:10-46`

- [ ] **Step 1: Add Patient Visitor constants after the existing viewport constants**

At line 14 (after `const NAVIGATION_TIMEOUT_MS = 30_000;`), add:

```typescript
// ── Patient Visitor scroll constants ──
const SCROLL_STEP_PX = 300;
const SCROLL_PAUSE_MS = 400;
const SCROLL_BACK_SETTLE_MS = 2000;
const IDLE_WAIT_MAX_MS = 3000;
const MAX_SCROLL_TIME_MS = 30_000;
```

- [ ] **Step 2: Add the `SCREENSHOT_STYLE` constant after `MAX_VIEWPORT_HEIGHT`**

This CSS is injected via Playwright's `style` parameter — only applied during the screenshot capture, never permanently on the page. It replaces the current `page.addStyleTag()` block.

```typescript
// CSS overrides applied ONLY during screenshot capture via Playwright's `style`
// parameter. Unlike addStyleTag(), this does NOT persist on the page, so it
// cannot break carousel JS or layout calculations.
const SCREENSHOT_STYLE = `
  /* Elementor entrance animations */
  .elementor-invisible {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .elementor-widget[data-settings*="animation"],
  .elementor-element[data-settings*="animation"] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* AOS — Animate on Scroll */
  [data-aos] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* WOW.js */
  .wow {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* Animate.css */
  .animate__animated {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* ScrollReveal.js */
  [data-sr-id] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* SAL — Scroll Animation Library */
  [data-sal] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* Generic scroll-trigger patterns */
  [data-animate], [data-animation], [data-scroll] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* GSAP ScrollTrigger hidden elements */
  [style*="visibility: hidden"][style*="opacity: 0"],
  [style*="visibility:hidden"][style*="opacity:0"] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* RevSlider hidden layers */
  .tp-caption, .rs-layer {
    opacity: 1 !important;
    visibility: visible !important;
  }
  /* Divi Builder */
  .et_pb_section .et_had_animation {
    opacity: 1 !important;
    visibility: visible !important;
  }
`;
```

Key difference from the old CSS block: no `transform: none !important` (which broke carousels — FIX-0011), no `transition: none !important` or `animation-name: none !important` (which killed carousel initialization — FIX-0012). Those are now handled by Playwright's `animations: 'disabled'` which fast-forwards them properly instead of nuking them.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors (constants are just values, no type issues possible)

- [ ] **Step 4: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "feat: add Patient Visitor constants and SCREENSHOT_STYLE for capture-time CSS injection"
```

---

## Task 2: Update `captureScreenshot()` — add `animations`, `caret`, `style`

**Files:**
- Modify: `src/lib/screenshots/client.ts:129-151` (the `captureScreenshot` function)

- [ ] **Step 1: Update the `page.screenshot()` call to use Playwright's animation-aware APIs**

Replace the entire `captureScreenshot` function body:

```typescript
export async function captureScreenshot(
  page: Page,
  options?: CaptureScreenshotOptions,
): Promise<Buffer> {
  try {
    if (options?.viewport) {
      await page.setViewportSize(options.viewport);
    }

    const screenshot = await page.screenshot({
      fullPage: options?.fullPage ?? true,
      type: 'png',
      animations: 'disabled',
      caret: 'hide',
      style: SCREENSHOT_STYLE,
    });

    return Buffer.from(screenshot);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `[screenshots/client] Screenshot capture failed: ${message}`,
    );
  }
}
```

Three additions:
- `animations: 'disabled'` — fast-forwards CSS animations/transitions to end state, cancels infinite ones
- `caret: 'hide'` — hides text cursor for cleaner captures
- `style: SCREENSHOT_STYLE` — injects CSS overrides only during capture (replaces permanent `addStyleTag`)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "feat: enable animations:'disabled' + style injection on page.screenshot()"
```

---

## Task 3: Add `reducedMotion: 'reduce'` to browser context

**Files:**
- Modify: `src/lib/screenshots/client.ts:199-238` (context creation block inside `capturePageWithMetadata`)

- [ ] **Step 1: Add `reducedMotion` to the `browser.newContext()` call**

Find the context creation block (currently lines 199-238). Change the `newContext` call from:

```typescript
      context = await browser.newContext({
        userAgent: CHROME_USER_AGENT,
        locale: 'en-US',
        javaScriptEnabled: true,
      });
```

To:

```typescript
      context = await browser.newContext({
        userAgent: CHROME_USER_AGENT,
        locale: 'en-US',
        javaScriptEnabled: true,
        reducedMotion: 'reduce',
      });
```

This emulates `prefers-reduced-motion: reduce`. Sites that respect this media query will voluntarily disable their own animations, showing content immediately.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "feat: emulate prefers-reduced-motion on browser context for cleaner captures"
```

---

## Task 4: Add `waitForIdle()` helper function

**Files:**
- Modify: `src/lib/screenshots/client.ts` — add before `capturePageWithMetadata`

- [ ] **Step 1: Add the idle detection helper**

Insert this function after `captureScreenshot()` and before `capturePageWithMetadata()`:

```typescript
/**
 * Waits for the browser to reach an idle state using a rAF chain +
 * requestIdleCallback pattern. More reliable than blind waitForTimeout()
 * because it detects when the browser has finished painting.
 *
 * Falls back to a short timeout if requestIdleCallback isn't available
 * (shouldn't happen in Chrome, but defensive).
 */
async function waitForIdle(page: Page, maxMs: number = IDLE_WAIT_MAX_MS): Promise<void> {
  try {
    await page.waitForFunction(
      (timeoutMs: number) => {
        return new Promise<boolean>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => resolve(true), { timeout: timeoutMs });
              } else {
                setTimeout(() => resolve(true), 100);
              }
            });
          });
        });
      },
      maxMs,
      { timeout: maxMs + 2000 },
    );
  } catch {
    // Non-critical — if idle detection times out, proceed anyway
    console.warn('[screenshots/client] Idle detection timed out, proceeding with capture');
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "feat: add waitForIdle() helper using rAF chain + requestIdleCallback"
```

---

## Task 5: Add `slowScroll()` helper function

**Files:**
- Modify: `src/lib/screenshots/client.ts` — add after `waitForIdle`

- [ ] **Step 1: Add the Patient Visitor scroll helper**

Insert this function after `waitForIdle()`:

```typescript
/**
 * Patient Visitor scroll: scrolls the page in small increments with pauses
 * between each step. This fires scroll-triggered JS animations (GSAP
 * ScrollTrigger, AOS, WOW.js, vanilla IntersectionObserver handlers)
 * naturally, just like a real visitor scrolling through the page.
 *
 * After reaching the bottom, scrolls back to top and settles — hero
 * sections often have entrance animations that replay on return.
 *
 * Safety cap: MAX_SCROLL_TIME_MS prevents infinite loops on infinite-scroll pages.
 */
async function slowScroll(page: Page): Promise<void> {
  const startTime = Date.now();

  try {
    // Scroll down in increments
    let previousHeight = 0;
    let currentPosition = 0;

    while (Date.now() - startTime < MAX_SCROLL_TIME_MS) {
      const docHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      );

      if (currentPosition >= docHeight) {
        // Reached the bottom — check if page grew (lazy-loaded content)
        if (docHeight <= previousHeight) break;
        previousHeight = docHeight;
      }

      await page.evaluate((step) => window.scrollBy(0, step), SCROLL_STEP_PX);
      currentPosition += SCROLL_STEP_PX;
      await page.waitForTimeout(SCROLL_PAUSE_MS);
    }

    if (Date.now() - startTime >= MAX_SCROLL_TIME_MS) {
      console.warn(
        `[screenshots/client] Slow scroll hit ${MAX_SCROLL_TIME_MS}ms cap. Captured ${currentPosition}px of content.`,
      );
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(SCROLL_BACK_SETTLE_MS);
  } catch {
    // Non-critical — if scroll fails, proceed with whatever was visible
    console.warn('[screenshots/client] Slow scroll failed, proceeding with capture');
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "feat: add slowScroll() Patient Visitor helper for scroll-triggered animations"
```

---

## Task 6: Remove the `page.addStyleTag()` CSS injection block

**Files:**
- Modify: `src/lib/screenshots/client.ts:326-441` (the "CONTENT REVEAL" try/catch block)

- [ ] **Step 1: Remove the CSS injection, keep the JS class cleanup**

The current code at lines 319-441 has two parts inside one try/catch:
1. `page.addStyleTag()` CSS injection (lines 328-395) — **REMOVE THIS**
2. `page.evaluate()` JS class cleanup (lines 398-438) — **KEEP THIS**

Replace the entire try/catch block (lines 319-441) with:

```typescript
    // ── CONTENT REVEAL: JS class cleanup for scroll-hidden elements ──
    // Animation framework CSS overrides are now handled by the `style`
    // parameter on page.screenshot() (SCREENSHOT_STYLE constant), which
    // injects CSS only during capture — not permanently on the page.
    // This JS cleanup remains necessary for libraries that check class
    // presence rather than computed styles.
    try {
      await page.evaluate(() => {
        // Elementor: remove .elementor-invisible, let default styles show
        document.querySelectorAll('.elementor-invisible').forEach((el) => {
          el.classList.remove('elementor-invisible');
        });
        // AOS: mark all elements as already animated
        document.querySelectorAll('[data-aos]').forEach((el) => {
          el.classList.add('aos-animate');
        });
        // WOW.js: mark animated
        document.querySelectorAll('.wow').forEach((el) => {
          el.classList.add('animated');
          (el as HTMLElement).style.visibility = 'visible';
          (el as HTMLElement).style.opacity = '1';
        });
        // SAL
        document.querySelectorAll('[data-sal]').forEach((el) => {
          el.classList.add('sal-animate');
        });
        // Force any inline opacity:0 / visibility:hidden on common widget containers
        document.querySelectorAll(
          '.elementor-widget-wrap, .elementor-column-wrap, .elementor-widget, ' +
          '.wp-block-cover, .wp-block-group, section, .rev_slider .tp-caption'
        ).forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.opacity === '0') (el as HTMLElement).style.opacity = '1';
          if (style.visibility === 'hidden') (el as HTMLElement).style.visibility = 'visible';
        });
        // Try triggering Elementor's frontend animation handler if it exists
        const win = window as unknown as Record<string, unknown>;
        if (win.elementorFrontend && typeof (win.elementorFrontend as Record<string, unknown>).waypoint === 'function') {
          document.querySelectorAll('.elementor-element').forEach((el) => {
            el.dispatchEvent(new Event('appear'));
          });
        }
        // Try triggering AOS refresh
        if (win.AOS && typeof (win.AOS as Record<string, unknown>).refreshHard === 'function') {
          (win.AOS as { refreshHard: () => void }).refreshHard();
        }
      });
    } catch {
      // Content reveal is non-critical — scroll + animations:'disabled' handle most cases
    }
```

This is the same JS class cleanup code that exists today (lines 398-438), just without the `page.addStyleTag()` call that preceded it.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "refactor: remove permanent CSS injection, move overrides to screenshot style param"
```

---

## Task 7: Rewrite `full` mode — slow scroll + idle detection + tall viewport capture

**Files:**
- Modify: `src/lib/screenshots/client.ts:512-597` (the `if (mode === 'full')` block)

This is the core change. The current `full` mode does: blind 1500ms wait → tall viewport resize → re-swap data-src → wait for images → re-measure. The new version adds slow scroll and idle detection BEFORE the tall viewport resize.

- [ ] **Step 1: Replace the entire `if (mode === 'full')` block**

Replace from `if (mode === 'full') {` through the closing `}` before the `else` (lines 513-597) with:

```typescript
    if (mode === 'full') {
      /* PATIENT VISITOR + TALL VIEWPORT CAPTURE
       *
       * 1. Idle detection  — let above-fold JS/animations settle
       * 2. Slow scroll     — fire scroll-triggered animations (GSAP, AOS, etc.)
       * 3. Idle detection  — let animations triggered by scroll complete
       * 4. Tall viewport   — resize to full doc height (avoids Chrome tile eviction)
       * 5. Re-swap data-src — catch lazy content now inside viewport
       * 6. Image decode     — wait for all images + fonts
       * 7. Re-measure      — resize if page grew from lazy content
       * 8. Screenshot       — with animations:'disabled' + style override
       */

      // Phase 1 — Initial idle: let above-fold JS hydration + animations settle
      await waitForIdle(page);

      // Phase 2 — Slow scroll: fire scroll-triggered JS animations
      await slowScroll(page);

      // Phase 3 — Post-scroll idle: let animations complete after scroll-back
      await waitForIdle(page);

      // Phase 4 — Tall viewport: resize to full document height
      const docHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      );
      const cappedHeight = Math.min(docHeight, MAX_VIEWPORT_HEIGHT);
      await page.setViewportSize({ width: viewportSize.width, height: cappedHeight });
      console.log(`[screenshots/client] Tall viewport: ${viewportSize.width}x${cappedHeight} (doc: ${docHeight})`);

      // Brief wait for lazy content triggered by the new viewport
      await page.waitForTimeout(1500);

      // Phase 5 — Re-run data-src swap for elements now inside the viewport
      try {
        await page.evaluate(() => {
          const srcAttrs = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy'];
          document.querySelectorAll('img').forEach((img) => {
            for (const attr of srcAttrs) {
              const val = img.getAttribute(attr);
              if (val && (!img.src || img.src.includes('data:') || img.src.includes('placeholder') || img.src.includes('blank'))) {
                img.src = val;
                break;
              }
            }
          });
          // Re-remove loading="lazy" on any new elements
          document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
            img.removeAttribute('loading');
            const currentSrc = img.getAttribute('src');
            if (currentSrc) {
              img.removeAttribute('src');
              img.setAttribute('src', currentSrc);
            }
          });
        });
      } catch {
        // Non-critical
      }

      // Phase 6 — Wait for all images to decode + fonts to load
      try {
        await page.evaluate(async () => {
          await Promise.allSettled(
            Array.from(document.querySelectorAll('img')).map((img) => {
              if (img.complete && img.naturalWidth > 0) return Promise.resolve();
              return Promise.race([
                img.decode().catch(() => {}),
                new Promise((r) => setTimeout(r, 5_000)),
              ]);
            }),
          );
          await document.fonts.ready;
        });
      } catch {
        console.warn(`[screenshots/client] Image decode wait failed for ${url}. Continuing.`);
      }

      // Phase 7 — Re-measure in case lazy content grew the page
      const finalHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      );
      if (finalHeight > docHeight) {
        const newCapped = Math.min(finalHeight, MAX_VIEWPORT_HEIGHT);
        await page.setViewportSize({ width: viewportSize.width, height: newCapped });
        console.log(`[screenshots/client] Page grew: resized to ${viewportSize.width}x${newCapped}`);
        await page.waitForTimeout(1000);
      }
    }
```

- [ ] **Step 2: Replace the `else` (fast mode) block with idle detection**

Replace the `else` block (currently lines 598-601):

```typescript
    } else {
      // Fast mode — idle detection for basic JS rendering (replaces blind 2000ms wait)
      await waitForIdle(page);
    }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 4: Verify the build succeeds**

Run: `bun run build`
Expected: Clean build, no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/screenshots/client.ts
git commit -m "feat: Patient Visitor slow scroll + idle detection in full capture mode

Replaces blind waitForTimeout calls with rAF-based idle detection.
Adds slow scroll (300px steps, 400ms pauses) to fire GSAP ScrollTrigger
and other JS-driven scroll animations before tall viewport capture.
Combined with animations:'disabled' on screenshot call (Task 2), this
handles both CSS-based and JS-based animation frameworks."
```

---

## Task 8: Full integration verification

**Files:**
- Read: `src/lib/screenshots/client.ts` (final state)
- Read: `src/lib/screenshots/pipeline.ts` (verify no breaking changes)

- [ ] **Step 1: Read the complete modified file and verify coherence**

Read `src/lib/screenshots/client.ts` top to bottom. Verify:
1. Constants section has all 5 new constants + `SCREENSHOT_STYLE`
2. `captureScreenshot()` uses `animations: 'disabled'`, `caret: 'hide'`, `style: SCREENSHOT_STYLE`
3. `waitForIdle()` helper exists before `capturePageWithMetadata()`
4. `slowScroll()` helper exists before `capturePageWithMetadata()`
5. Context creation has `reducedMotion: 'reduce'`
6. No `page.addStyleTag()` call remains (the old CSS injection is gone)
7. JS class cleanup block is intact
8. Lazy-load data-src swap is intact (both initial and re-swap in full mode)
9. IntersectionObserver mock in `addInitScript` is intact
10. `full` mode has: idle → scroll → idle → tall viewport → data-src → images → re-measure
11. `fast` mode has: idle detection (not blind 2000ms)

- [ ] **Step 2: Verify pipeline.ts doesn't need changes**

Read `src/lib/screenshots/pipeline.ts`. Confirm:
- It calls `capturePageWithMetadata(browser, url, viewport, mode)` — signature unchanged
- It passes `'full'` for homepage captures, default `'fast'` for inner pages — unchanged
- No direct `page.screenshot()` calls that bypass our function — confirmed

- [ ] **Step 3: Full TypeScript check**

Run: `bunx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 4: Full build**

Run: `bun run build`
Expected: Clean build

- [ ] **Step 5: Verify with lint**

Run: `bun run lint`
Expected: No new lint errors from our changes

- [ ] **Step 6: Commit any lint fixes if needed**

```bash
git add src/lib/screenshots/client.ts
git commit -m "fix: address lint issues from Patient Visitor implementation"
```

(Skip this step if lint passes clean.)

---

## Summary of changes

| What | Before | After |
|------|--------|-------|
| CSS animation handling | Permanent `addStyleTag()` injection | `animations: 'disabled'` fast-forwards to end state |
| CSS overrides for hidden elements | `addStyleTag()` — persists, breaks carousels | `style` param — during capture only |
| Motion preference | Not used | `reducedMotion: 'reduce'` on context |
| Wait strategy (full mode) | `waitForTimeout(1500)` | `waitForIdle()` — rAF + requestIdleCallback |
| Wait strategy (fast mode) | `waitForTimeout(2000)` | `waitForIdle()` |
| Scroll-triggered animations | Never fire (no scroll in tall viewport) | `slowScroll()` fires them naturally |
| Full mode sequence | wait → tall viewport → capture | idle → scroll → idle → tall viewport → capture |
| Text cursor | Visible | Hidden via `caret: 'hide'` |

**Performance impact:** Full mode captures go from ~4-5s to ~10-15s per page. The SSE progress stream keeps users informed. Screenshot quality is the product's first impression — the added time is worth it.

**Risk:** Low. Only one file changes. The function signatures and return types are identical. `pipeline.ts` calls are unchanged. The three Playwright APIs (`animations`, `style`, `reducedMotion`) are all confirmed available in playwright-core 1.58.2.
