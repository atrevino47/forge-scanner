// src/lib/screenshots/client.ts
// Screenshot client — connects to headless Chrome via CDP WebSocket and captures pages.
// Supports self-hosted Chrome (BROWSER_WS_ENDPOINT) with Browserless.io fallback.

import { chromium, type Browser, type Page } from 'playwright-core';

// ============================================================
// Viewport presets
// ============================================================

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

const NAVIGATION_TIMEOUT_MS = 30_000;

// ── Patient Visitor scroll constants ──
const SCROLL_STEP_PX = 300;
const SCROLL_PAUSE_MS = 400;
const SCROLL_BACK_SETTLE_MS = 2000;
const IDLE_WAIT_MAX_MS = 3000;
const MAX_SCROLL_TIME_MS = 30_000;

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

// Chrome's maximum texture height — viewport height cap for tall viewport capture
const MAX_VIEWPORT_HEIGHT = 16_384;

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
 * Connects to a headless Chrome instance via CDP WebSocket.
 *
 * Priority: BROWSER_WS_ENDPOINT (self-hosted Chrome on Hetzner VPS)
 * Fallback: BROWSERLESS_API_KEY (Browserless.io hosted service)
 *
 * See docs/HETZNER-SETUP.md for self-hosted Chrome deployment.
 */
export async function connectBrowser(): Promise<Browser> {
  // Self-hosted Chrome (Hetzner VPS) takes priority over Browserless.io
  const wsEndpoint = process.env.BROWSER_WS_ENDPOINT;
  const browserlessKey = process.env.BROWSERLESS_API_KEY;

  if (!wsEndpoint && !browserlessKey) {
    throw new Error(
      '[screenshots/client] No browser endpoint configured. ' +
        'Set BROWSER_WS_ENDPOINT (self-hosted Chrome) or BROWSERLESS_API_KEY (Browserless.io).',
    );
  }

  const label = wsEndpoint ? 'self-hosted Chrome' : 'Browserless.io';

  try {
    let url: string;

    if (wsEndpoint) {
      // Self-hosted Chrome: discover the WebSocket debugger URL via /json/version
      // then rewrite it to use the tunnel hostname (Chrome returns ws://localhost/...)
      const httpUrl = wsEndpoint.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
      const versionRes = await fetch(`${httpUrl}/json/version`);
      const version = await versionRes.json() as { webSocketDebuggerUrl: string };
      // Rewrite ws://localhost/devtools/... → wss://chrome.forgewith.ai/devtools/...
      const path = new URL(version.webSocketDebuggerUrl).pathname;
      url = `${wsEndpoint}${path}`;
      console.log(`[screenshots/client] Discovered CDP endpoint: ${url}`);
    } else {
      url = `wss://chrome.browserless.io?token=${browserlessKey}&stealth&timeout=300000`;
    }

    const browser = await chromium.connectOverCDP(url);
    console.log(`[screenshots/client] Connected to ${label}`);
    return browser;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[screenshots/client] Failed to connect to ${label}: ${message}. ` +
        (wsEndpoint
          ? 'Check that your VPS is running and the Chrome container is healthy.'
          : 'Check that your BROWSERLESS_API_KEY is valid and the service is reachable.'),
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
    let context = contexts.length > 0 ? contexts[0] : null;

    if (!context) {
      context = await browser.newContext({
        userAgent: CHROME_USER_AGENT,
        locale: 'en-US',
        javaScriptEnabled: true,
        reducedMotion: 'reduce',
      });

      // ── LAZY-LOAD LAYER 2: Mock IntersectionObserver ──
      // Runs before ANY page JS executes. Tells every JS-based lazy loader
      // (React, Vue, vanilla-lazyload, lozad, lazysizes, Shopify, Squarespace)
      // that all observed elements are already fully visible. The libraries
      // then eagerly load everything instead of waiting for scroll.
      await context.addInitScript(() => {
        window.IntersectionObserver = class MockIntersectionObserver {
          private cb: IntersectionObserverCallback;
          constructor(cb: IntersectionObserverCallback) { this.cb = cb; }
          observe(target: Element) {
            // Fire callback on next frame so the element is attached to DOM
            requestAnimationFrame(() => {
              this.cb(
                [{
                  target,
                  isIntersecting: true,
                  intersectionRatio: 1.0,
                  boundingClientRect: target.getBoundingClientRect(),
                  intersectionRect: target.getBoundingClientRect(),
                  rootBounds: null,
                  time: performance.now(),
                } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              );
            });
          }
          unobserve() {}
          disconnect() {}
          takeRecords(): IntersectionObserverEntry[] { return []; }
          get root() { return null; }
          get rootMargin() { return '0px'; }
          get thresholds() { return [0]; }
        } as unknown as typeof IntersectionObserver;
      });
    }

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

    // ── CONTENT REVEAL: Force-show scroll-hidden elements ──
    // WordPress Elementor, AOS, WOW.js, GSAP ScrollTrigger, RevSlider, and
    // dozens of other frameworks hide below-fold elements with opacity:0 /
    // visibility:hidden / transform, then reveal them on scroll via waypoints
    // or IntersectionObserver. In headless capture those scroll triggers don't
    // fire reliably. Proven fix: inject CSS that force-overrides ALL known
    // hiding patterns, then clean up JS classes so framework CSS cooperates.
    try {
      // Step 1 — CSS override: nuclear !important on every known pattern
      await page.addStyleTag({
        content: `
          /* Elementor entrance animations */
          .elementor-invisible {
            opacity: 1 !important;
            visibility: visible !important;
          }
          /* Elementor motion effects */
          .elementor-widget[data-settings*="animation"],
          .elementor-element[data-settings*="animation"] {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
          }
          /* AOS — Animate on Scroll */
          [data-aos] {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            transition: none !important;
          }
          /* WOW.js */
          .wow {
            opacity: 1 !important;
            visibility: visible !important;
            animation-name: none !important;
          }
          /* Animate.css hidden-before-trigger */
          .animate__animated {
            opacity: 1 !important;
            visibility: visible !important;
          }
          /* ScrollReveal.js */
          [data-sr-id] {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
          }
          /* SAL — Scroll Animation Library */
          [data-sal] {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
          }
          /* Generic scroll-trigger patterns */
          [data-animate], [data-animation], [data-scroll] {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
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
        `,
      });

      // Step 2 — JS class cleanup: remove hiding classes, add revealed classes
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
          // Force all waypoints to trigger
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
      // Content reveal is non-critical — scroll may still trigger some animations
    }

    // ── LAZY-LOAD LAYER 3: Force-swap data-src attributes ──
    // Many lazy-load libraries store the real URL in data-src, data-lazy-src,
    // data-original, etc. The IO mock (Layer 2) handles most cases, but some
    // libraries initialize before the mock or use non-IO triggers. This sweep
    // catches stragglers by copying data attributes to their real counterparts.
    try {
      await page.evaluate(() => {
        // img: data-src variants → src
        const srcAttrs = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy'];
        const srcsetAttrs = ['data-srcset', 'data-lazy-srcset'];
        document.querySelectorAll('img').forEach((img) => {
          for (const attr of srcAttrs) {
            const val = img.getAttribute(attr);
            if (val && (!img.src || img.src.includes('data:') || img.src.includes('placeholder') || img.src.includes('blank'))) {
              img.src = val;
              break;
            }
          }
          for (const attr of srcsetAttrs) {
            const val = img.getAttribute(attr);
            if (val) img.srcset = val;
          }
          // Shopify: data-widths + data-sizes="auto"
          if (img.getAttribute('data-sizes') === 'auto') {
            img.sizes = `${img.getBoundingClientRect().width}px`;
          }
        });
        // picture > source: data-srcset → srcset
        document.querySelectorAll('source[data-srcset]').forEach((source) => {
          const val = source.getAttribute('data-srcset');
          if (val) source.setAttribute('srcset', val);
        });
        // Background images: data-bg, data-background-image
        document.querySelectorAll('[data-bg], [data-background-image], [data-bg-image]').forEach((el) => {
          const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background-image') || el.getAttribute('data-bg-image');
          if (bgUrl) (el as HTMLElement).style.backgroundImage = `url('${bgUrl}')`;
        });
        // CSS class swap: lazy → lazyloaded (triggers CSS visibility rules)
        document.querySelectorAll('.lazy, .lazyload, .b-lazy, .owl-lazy').forEach((el) => {
          el.classList.remove('lazy', 'lazyload', 'b-lazy', 'owl-lazy');
          el.classList.add('lazyloaded', 'loaded');
        });
        // Remove native loading="lazy" — Chrome's built-in loader ignores the IO mock
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
          img.removeAttribute('loading');
          const currentSrc = img.getAttribute('src');
          if (currentSrc) {
            img.removeAttribute('src');
            img.setAttribute('src', currentSrc);
          }
        });
        document.querySelectorAll('iframe[loading="lazy"]').forEach((iframe) => {
          iframe.removeAttribute('loading');
        });
        // Iframes with data-src
        document.querySelectorAll('iframe[data-src]').forEach((iframe) => {
          const val = iframe.getAttribute('data-src');
          if (val) iframe.setAttribute('src', val);
        });
        // Trigger library-specific loadAll APIs
        const win = window as unknown as Record<string, unknown>;
        if (win.lazyLoadInstance && typeof (win.lazyLoadInstance as { loadAll?: () => void }).loadAll === 'function') {
          (win.lazyLoadInstance as { loadAll: () => void }).loadAll();
        }
      });
    } catch {
      // Non-critical — IO mock and scroll handle most cases
    }

    // ── Capture mode: full (tall viewport) vs fast ──
    if (mode === 'full') {
      /* TALL VIEWPORT CAPTURE
       * Instead of scrolling (which causes Chrome tile eviction when scrolling
       * back to top), resize the viewport to the full document height. With
       * nothing "below the fold," lazy loaders fire immediately and Chrome
       * composites the entire page. Screenshot with fullPage: false since the
       * viewport IS the full page.
       *
       * Phase 1: Initial settle — let above-fold JS/animations run
       * Phase 2: Measure doc height → resize viewport to match (cap 16384px)
       * Phase 3: Re-run data-src swap for newly visible elements
       * Phase 4: Wait for all images to decode + fonts to load
       * Phase 5: Re-measure (lazy content may have grown the page)
       * Phase 6: Screenshot with fullPage: false
       */

      // Phase 1 — Initial settle for JS hydration + above-fold animations
      await page.waitForTimeout(1500);

      // Phase 2 — Measure document height and resize viewport
      const docHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      );
      const cappedHeight = Math.min(docHeight, MAX_VIEWPORT_HEIGHT);
      await page.setViewportSize({ width: viewportSize.width, height: cappedHeight });
      console.log(`[screenshots/client] Tall viewport: ${viewportSize.width}x${cappedHeight} (doc: ${docHeight})`);

      // Brief wait for lazy content triggered by the new viewport
      await page.waitForTimeout(1500);

      // Phase 3 — Re-run data-src swap for elements now inside the viewport
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

      // Phase 4 — Wait for all images to decode + fonts to load
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

      // Phase 5 — Re-measure in case lazy content grew the page
      const finalHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      );
      if (finalHeight > docHeight) {
        const newCapped = Math.min(finalHeight, MAX_VIEWPORT_HEIGHT);
        await page.setViewportSize({ width: viewportSize.width, height: newCapped });
        console.log(`[screenshots/client] Page grew: resized to ${viewportSize.width}x${newCapped}`);
        await page.waitForTimeout(1000);
      }
    } else {
      // Fast mode — just a short settle for basic JS rendering
      await page.waitForTimeout(2000);
    }

    // Phase 6 — Capture screenshot
    // Full mode: fullPage: false because the viewport IS the full page (tall viewport)
    // Fast mode + mobile: use standard fullPage behavior
    const useFullPage = mode !== 'full' && viewport === 'desktop';
    const screenshotBuffer = await captureScreenshot(page, {
      fullPage: useFullPage,
      viewport: mode === 'full' ? undefined : viewportSize,
    });

    // Reset viewport to original size for any subsequent captures
    if (mode === 'full') {
      await page.setViewportSize(viewportSize);
    }

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
