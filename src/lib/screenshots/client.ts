// src/lib/screenshots/client.ts
// Browserless.io screenshot client — connects via CDP WebSocket and captures pages.

import { chromium, type Browser, type Page } from 'playwright-core';

// ============================================================
// Viewport presets
// ============================================================

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

const NAVIGATION_TIMEOUT_MS = 30_000;

// "Patient visitor" scroll constants — simulate a real human scrolling
// so scroll-triggered animations (GSAP ScrollTrigger, AOS, Intersection
// Observer) fire and play to completion before we capture.
const SCROLL_STEP_PX = 300;
const SCROLL_PAUSE_MS = 400;
const SCROLL_BACK_SETTLE_MS = 2000;
const IDLE_WAIT_MAX_MS = 3000;
const MAX_SCROLL_TIME_MS = 30_000;

// ============================================================
// Types
// ============================================================

export interface CaptureScreenshotOptions {
  fullPage?: boolean;
  viewport?: { width: number; height: number };
}

export interface PageWithMetadata {
  screenshot: Buffer;
  html: string;
  title: string;
  url: string;
}

// ============================================================
// connectBrowser
// ============================================================

/**
 * Connects to Browserless.io via CDP WebSocket.
 * Requires BROWSERLESS_API_KEY environment variable.
 */
export async function connectBrowser(): Promise<Browser> {
  const apiKey = process.env.BROWSERLESS_API_KEY;

  if (!apiKey) {
    throw new Error(
      '[screenshots/client] BROWSERLESS_API_KEY environment variable is not set. ' +
        'Set it to your Browserless.io API key to enable screenshot capture.',
    );
  }

  try {
    const browser = await chromium.connectOverCDP(
      `wss://chrome.browserless.io?token=${apiKey}`,
    );
    return browser;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `[screenshots/client] Failed to connect to Browserless.io: ${message}. ` +
        'Check that your BROWSERLESS_API_KEY is valid and the service is reachable.',
    );
  }
}

// ============================================================
// captureScreenshot
// ============================================================

/**
 * Takes a PNG screenshot of the current page state.
 * Optionally sets viewport size before capturing.
 */
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

// ============================================================
// capturePageWithMetadata
// ============================================================

/**
 * Creates a new page, navigates to the URL, captures a screenshot,
 * extracts HTML and page title, then closes the page.
 *
 * @param browser - Browser instance from connectBrowser()
 * @param url - URL to navigate to
 * @param viewport - 'desktop' (1440x900) or 'mobile' (375x812)
 */
export async function capturePageWithMetadata(
  browser: Browser,
  url: string,
  viewport: 'desktop' | 'mobile',
): Promise<PageWithMetadata> {
  const viewportSize =
    viewport === 'desktop' ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;

  let page: Page | null = null;

  try {
    // Create a new page in the first available browser context,
    // or create a new context if none exist.
    const contexts = browser.contexts();
    const context =
      contexts.length > 0 ? contexts[0] : await browser.newContext();
    page = await context.newPage();

    await page.setViewportSize(viewportSize);

    // Navigate with timeout and wait for network idle
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT_MS,
      });
    } catch (navError: unknown) {
      const navMessage =
        navError instanceof Error ? navError.message : String(navError);

      // If it's a timeout, still try to capture what loaded
      if (navMessage.includes('Timeout') || navMessage.includes('timeout')) {
        console.warn(
          `[screenshots/client] Navigation to ${url} timed out after ${NAVIGATION_TIMEOUT_MS}ms. ` +
            'Capturing partial page load.',
        );
      } else {
        throw new Error(
          `[screenshots/client] Navigation to ${url} failed: ${navMessage}`,
        );
      }
    }

    /* PATIENT VISITOR CAPTURE SEQUENCE
     * Simulates a real human visiting the page so scroll-triggered
     * animations (GSAP ScrollTrigger, AOS, Intersection Observer) fire
     * and play to completion. No CSS force-overrides — the screenshot
     * shows exactly what a visitor sees.
     *
     * Phase 1 (0s):   Initial settle — wait for above-the-fold animations
     * Phase 2 (~3s):  Slow scroll down — 300px steps, 400ms pause each
     * Phase 3 (var):  Scroll back to top — 2s settle for hero replays
     * Phase 4 (var):  Final paint wait — idle detection before capture
     */

    // Phase 1 — Initial settle: wait for above-the-fold animations to complete
    try {
      await page.evaluate(async (maxWait: number) => {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, maxWait);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => { clearTimeout(timeout); resolve(); });
              } else {
                setTimeout(() => { clearTimeout(timeout); resolve(); }, 500);
              }
            });
          });
        });
      }, IDLE_WAIT_MAX_MS);
    } catch (settleError: unknown) {
      const settleMessage =
        settleError instanceof Error ? settleError.message : String(settleError);
      console.warn(
        `[screenshots/client] Initial settle failed for ${url}: ${settleMessage}. Continuing.`,
      );
    }

    // Phase 2 — Slow scroll down: trigger scroll-based animations
    try {
      await page.evaluate(async (opts: { stepPx: number; pauseMs: number; maxTimeMs: number }) => {
        const startTime = Date.now();
        let previousHeight = 0;

        // Scroll until we've seen the full page (including lazy-loaded content)
        while (Date.now() - startTime < opts.maxTimeMs) {
          const currentHeight = document.body.scrollHeight;
          const currentPosition = window.scrollY + window.innerHeight;

          // If we've scrolled past the bottom and height hasn't changed, we're done
          if (currentPosition >= currentHeight && currentHeight === previousHeight) {
            break;
          }

          previousHeight = currentHeight;
          window.scrollBy(0, opts.stepPx);
          await new Promise((r) => setTimeout(r, opts.pauseMs));
        }
      }, { stepPx: SCROLL_STEP_PX, pauseMs: SCROLL_PAUSE_MS, maxTimeMs: MAX_SCROLL_TIME_MS });
    } catch (scrollError: unknown) {
      const scrollMessage =
        scrollError instanceof Error ? scrollError.message : String(scrollError);
      console.warn(
        `[screenshots/client] Scroll routine failed for ${url}: ${scrollMessage}. Capturing without full scroll.`,
      );
    }

    // Phase 3 — Scroll back to top and settle for hero animations
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(SCROLL_BACK_SETTLE_MS);
    } catch (scrollBackError: unknown) {
      const scrollBackMessage =
        scrollBackError instanceof Error ? scrollBackError.message : String(scrollBackError);
      console.warn(
        `[screenshots/client] Scroll-back failed for ${url}: ${scrollBackMessage}. Capturing at current position.`,
      );
    }

    // Phase 4 — Final paint wait: ensure all repaints from scroll-back are done
    try {
      await page.evaluate(async (maxWait: number) => {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, maxWait);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => { clearTimeout(timeout); resolve(); });
              } else {
                setTimeout(() => { clearTimeout(timeout); resolve(); }, 500);
              }
            });
          });
        });
      }, IDLE_WAIT_MAX_MS);
    } catch (finalWaitError: unknown) {
      const finalWaitMessage =
        finalWaitError instanceof Error ? finalWaitError.message : String(finalWaitError);
      console.warn(
        `[screenshots/client] Final paint wait failed for ${url}: ${finalWaitMessage}. Capturing as-is.`,
      );
    }

    // Capture screenshot (full page for desktop, viewport-only for mobile)
    const screenshotBuffer = await captureScreenshot(page, {
      fullPage: viewport === 'desktop',
      viewport: viewportSize,
    });

    // Extract page content and title
    const html = await page.content();

    const title = await page.title();

    // Get the final URL (after any redirects)
    const finalUrl = page.url();

    return {
      screenshot: screenshotBuffer,
      html,
      title,
      url: finalUrl,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `[screenshots/client] Failed to capture page ${url} (${viewport}): ${message}`,
    );
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (closeError: unknown) {
        const closeMessage =
          closeError instanceof Error ? closeError.message : String(closeError);
        console.warn(
          `[screenshots/client] Failed to close page for ${url}: ${closeMessage}`,
        );
      }
    }
  }
}

// ============================================================
// disconnectBrowser
// ============================================================

/**
 * Safely closes the browser connection.
 * Swallows errors to prevent crash during cleanup.
 */
export async function disconnectBrowser(browser: Browser): Promise<void> {
  try {
    await browser.close();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.warn(
      `[screenshots/client] Browser disconnect warning: ${message}`,
    );
  }
}
