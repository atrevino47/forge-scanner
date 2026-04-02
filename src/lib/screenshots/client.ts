// src/lib/screenshots/client.ts
// Browserless.io screenshot client — connects via CDP WebSocket and captures pages.

import { chromium, type Browser, type Page } from 'playwright-core';

// ============================================================
// Viewport presets
// ============================================================

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

const NAVIGATION_TIMEOUT_MS = 30_000;

// Realistic user-agent — avoids "HeadlessChrome" detection that causes
// sites to serve blank pages, CAPTCHAs, or bot-block redirects.
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// Common cookie consent selectors — dismissed before capture so overlays
// don't hide page content. Ordered by prevalence.
const COOKIE_DISMISS_SELECTORS = [
  // Generic patterns (most cookie banners)
  '[id*="cookie"] button[class*="accept"]',
  '[id*="cookie"] button[class*="agree"]',
  '[id*="cookie"] button[class*="close"]',
  '[class*="cookie"] button[class*="accept"]',
  '[class*="cookie"] button[class*="agree"]',
  '[class*="cookie"] button[class*="close"]',
  // CookieBot
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  // OneTrust
  '#onetrust-accept-btn-handler',
  // Complianz
  '.cmplz-accept',
  // Cookie Notice plugin
  '.cookie-notice-container .cn-set-cookie',
  // Generic "Accept" / "Accept All" buttons in common banner positions
  '[aria-label*="cookie" i] button',
  '[aria-label*="consent" i] button',
  'button[id*="accept"]',
];

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
      `wss://chrome.browserless.io?token=${apiKey}&stealth&timeout=300000`,
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
 * Two-tier capture modes:
 * - 'full': Patient visitor — slow scroll, idle detection, cookie dismiss.
 *           Used for homepage where screenshot quality = client trust.
 * - 'fast': Quick capture — networkidle + short settle. Used for inner
 *           pages, social profiles, GBP where AI analysis matters more
 *           than pixel-perfect screenshots.
 */
export type CaptureMode = 'full' | 'fast';

/**
 * Creates a new page, navigates to the URL, captures a screenshot,
 * extracts HTML and page title, then closes the page.
 *
 * Uses a shared browser context for cookie continuity within a scan
 * (inner pages may need session cookies from the homepage visit).
 *
 * @param browser - Browser instance from connectBrowser()
 * @param url - URL to navigate to
 * @param viewport - 'desktop' (1440x900) or 'mobile' (375x812)
 * @param mode - 'full' (patient visitor) or 'fast' (quick capture). Defaults to 'fast'.
 */
export async function capturePageWithMetadata(
  browser: Browser,
  url: string,
  viewport: 'desktop' | 'mobile',
  mode: CaptureMode = 'fast',
): Promise<PageWithMetadata> {
  const viewportSize =
    viewport === 'desktop' ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;

  let page: Page | null = null;

  try {
    // Shared context per browser — preserves cookies between captures
    // within a scan (e.g., homepage cookies available for inner pages).
    // First call creates the context with a real user-agent; subsequent
    // calls reuse it.
    const contexts = browser.contexts();
    const context = contexts.length > 0
      ? contexts[0]
      : await browser.newContext({
          userAgent: CHROME_USER_AGENT,
          locale: 'en-US',
          javaScriptEnabled: true,
        });
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

    // ── DOM readiness: ensure the page actually has rendered content ──
    // networkidle fires when network goes quiet, but SPAs (React, Vue, etc.)
    // may not have hydrated yet. Wait for at least one visible element in <body>.
    try {
      await page.waitForFunction(
        () => {
          const body = document.body;
          if (!body) return false;
          const children = body.querySelectorAll('*');
          for (const el of children) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
              return true;
            }
          }
          return false;
        },
        { timeout: 5_000 },
      );
    } catch {
      console.warn(
        `[screenshots/client] DOM readiness check timed out for ${url}. Page may be empty or blocked. Continuing.`,
      );
    }

    // ── Diagnostic: log anchor count to detect blocked pages ──
    try {
      const anchorCount = await page.evaluate(() => document.querySelectorAll('a').length);
      if (anchorCount < 3) {
        console.warn(
          `[screenshots/client] Only ${anchorCount} links found on ${url} — page may be blocked by bot detection`,
        );
      }
    } catch {
      // Non-critical diagnostic
    }

    // ── Cookie consent dismissal ──
    try {
      for (const selector of COOKIE_DISMISS_SELECTORS) {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(500);
          break;
        }
      }
    } catch {
      // Cookie dismissal is non-critical
    }

    // ── Capture mode: full (patient visitor) vs fast ──
    if (mode === 'full') {
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

      // Phase 1 — Initial settle
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

      // Phase 2 — Slow scroll down
      try {
        await page.evaluate(async (opts: { stepPx: number; pauseMs: number; maxTimeMs: number }) => {
          const startTime = Date.now();
          let previousHeight = 0;

          while (Date.now() - startTime < opts.maxTimeMs) {
            const currentHeight = document.body.scrollHeight;
            const currentPosition = window.scrollY + window.innerHeight;

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

      // Phase 3 — Scroll back to top
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

      // Phase 4 — Final paint wait
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
    } else {
      // Fast mode — just a short settle for basic JS rendering
      await page.waitForTimeout(2000);
    }

    // Capture screenshot (full page for desktop, viewport-only for mobile)
    const screenshotBuffer = await captureScreenshot(page, {
      fullPage: viewport === 'desktop',
      viewport: viewportSize,
    });

    // Extract page content and title
    const html = await page.content();
    const title = await page.title();
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
    // Close the page but keep the context alive for subsequent captures
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
