// src/lib/screenshots/client.ts
// Browserless.io screenshot client — connects via CDP WebSocket and captures pages.

import { chromium, type Browser, type Page } from 'playwright-core';

// ============================================================
// Viewport presets
// ============================================================

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

const NAVIGATION_TIMEOUT_MS = 30_000;

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

    // Scroll down incrementally to trigger scroll-based animations (GSAP, Framer Motion, etc.)
    try {
      await page.evaluate(async () => {
        const scrollStep = Math.max(window.innerHeight * 0.8, 400);
        const maxScroll = document.body.scrollHeight;
        let currentScroll = 0;

        while (currentScroll < maxScroll) {
          window.scrollBy(0, scrollStep);
          currentScroll += scrollStep;
          await new Promise((r) => setTimeout(r, 200));
        }

        // Scroll back to top
        window.scrollTo(0, 0);
      });

      // Wait for animations to settle after scrolling
      await page.waitForTimeout(1500);
    } catch (scrollError: unknown) {
      const scrollMessage =
        scrollError instanceof Error ? scrollError.message : String(scrollError);
      console.warn(
        `[screenshots/client] Scroll routine failed for ${url}: ${scrollMessage}. Capturing without scroll.`,
      );
    }

    // Force all elements visible — override animation initial states
    // (opacity: 0, transform, clip-path, visibility hidden, etc.)
    try {
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            opacity: 1 !important;
            visibility: visible !important;
            clip-path: none !important;
            -webkit-clip-path: none !important;
            transition: none !important;
            animation: none !important;
          }
        `,
      });
      // Brief wait for reflow after style injection
      await page.waitForTimeout(500);
    } catch (styleError: unknown) {
      const styleMessage =
        styleError instanceof Error ? styleError.message : String(styleError);
      console.warn(
        `[screenshots/client] Style injection failed for ${url}: ${styleMessage}. Capturing as-is.`,
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
