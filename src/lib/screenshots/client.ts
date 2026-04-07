// src/lib/screenshots/client.ts
// Screenshot client — connects to headless Chrome via CDP WebSocket and captures pages.
// Supports self-hosted Chrome (BROWSER_WS_ENDPOINT) with Browserless.io fallback.

import { chromium, type Browser, type Page } from 'playwright-core';
import sharp from 'sharp';

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
  '[id*="cookie"] button[class*="allow"]',
  '[id*="cookie"] button[class*="close"]',
  '[class*="cookie"] button[class*="accept"]',
  '[class*="cookie"] button[class*="agree"]',
  '[class*="cookie"] button[class*="allow"]',
  '[class*="cookie"] button[class*="close"]',
  '[id*="consent"] button[class*="allow"]',
  '[id*="consent"] button[class*="accept"]',
  '[class*="consent"] button[class*="allow"]',
  '[class*="consent"] button[class*="accept"]',
  // CookieBot
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  'button[id*="CybotCookiebot"][id*="Allow"]',
  // OneTrust
  '#onetrust-accept-btn-handler',
  // Complianz
  '.cmplz-accept',
  // Cookie Notice plugin
  '.cookie-notice-container .cn-set-cookie',
  // Generic "Accept" / "Accept All" / "Allow" buttons in common banner positions
  '[aria-label*="cookie" i] button',
  '[aria-label*="consent" i] button',
  'button[id*="accept"]',
  'button[id*="allow"]',
  // Catch-all: any button inside a dialog/banner that says "Allow" or "Accept"
  '[role="dialog"] button[class*="allow"]',
  '[role="dialog"] button[class*="accept"]',
  '[role="banner"] button[class*="allow"]',
  '[role="banner"] button[class*="accept"]',
];

// Chrome's maximum texture height — viewport height cap for tall viewport capture
const MAX_VIEWPORT_HEIGHT = 16_384;

// Scroll-and-stitch constants
const STITCH_OVERLAP_PX = 50;
const MAX_SCROLL_SEGMENTS = 30;

const SCREENSHOT_STYLE = `
  .elementor-invisible {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .elementor-widget[data-settings*="animation"],
  .elementor-element[data-settings*="animation"] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [data-aos] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .wow {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .animate__animated {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [data-sr-id] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [data-sal] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [data-animate], [data-animation], [data-scroll] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [style*="visibility: hidden"][style*="opacity: 0"],
  [style*="visibility:hidden"][style*="opacity:0"] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  .tp-caption, .rs-layer {
    opacity: 1 !important;
    visibility: visible !important;
  }
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
// Scroll-and-stitch helpers
// ============================================================

/**
 * Smart scroll that works on sites where `window.scrollTo()` doesn't work.
 * Some sites (WordPress + Elementor, RevSlider) set `html, body { height: 100% }`
 * which constrains them to viewport height. The actual content overflows the body,
 * making document.body the scroll container instead of the window.
 *
 * Detects which scroll target works on first call and reuses it.
 */
async function smartScrollTo(page: Page, y: number): Promise<void> {
  await page.evaluate((targetY) => {
    // Set ALL scroll targets — some sites use body as the scroll container
    // (WordPress + Elementor with height:100% on html+body), others use
    // the standard window/documentElement. Setting all three is safe and
    // avoids false-positive short-circuiting when checking window.scrollY
    // (which reads 0 on body-scroll sites even when body.scrollTop !== 0).
    window.scrollTo({ top: targetY, behavior: 'instant' });
    document.documentElement.scrollTop = targetY;
    document.body.scrollTop = targetY;
  }, y);
}

/**
 * Scrolls page in viewport-height steps to trigger scroll-based lazy loaders,
 * then returns to top. Replaces the tall viewport resize as the lazy-load
 * trigger mechanism.
 */
async function triggerLazyLoadViaScroll(
  page: Page,
  viewportSize: { width: number; height: number },
): Promise<void> {
  try {
    const docHeight = await page.evaluate(() =>
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    );
    const steps = Math.min(Math.ceil(docHeight / viewportSize.height), MAX_SCROLL_SEGMENTS);

    for (let i = 1; i <= steps; i++) {
      await smartScrollTo(page, i * viewportSize.height);
      await page.waitForTimeout(200);
    }

    await smartScrollTo(page, 0);
    await page.waitForTimeout(300);
  } catch {
    console.warn('[screenshots/client] Lazy-load scroll pass failed, proceeding');
  }
}

/**
 * Detects elements with position:fixed or position:sticky and marks them
 * with a data attribute. Returns the count of marked elements.
 */
async function detectFixedElements(page: Page): Promise<number> {
  return page.evaluate(() => {
    let count = 0;
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        el.setAttribute('data-stitch-hide', 'true');
        count++;
      }
    }
    return count;
  });
}

/**
 * Scroll-and-stitch capture: scrolls through the page one viewport at a time,
 * captures each segment, and stitches them vertically with Sharp.
 *
 * Avoids Chrome's GPU tile eviction at extreme viewport heights. Fixed/sticky
 * elements are hidden after the first segment to prevent duplication.
 */
async function scrollAndStitch(
  page: Page,
  viewportSize: { width: number; height: number },
): Promise<Buffer> {
  const docHeight = await page.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
  );
  const vh = viewportSize.height;
  const vw = viewportSize.width;

  // Short page — single capture, no stitching needed
  if (docHeight <= vh) {
    const single = await page.screenshot({
      type: 'png',
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      style: SCREENSHOT_STYLE,
    });
    return Buffer.from(single);
  }

  // Detect fixed/sticky elements for hiding in segments 2+
  const fixedCount = await detectFixedElements(page);

  // CSS to hide fixed elements + common cookie/consent overlays in segments 2+
  // Cookie banners are position:fixed but may inject AFTER detection runs,
  // so we target them by selector as a safety net.
  const hideFixedCSS = [
    fixedCount > 0 ? '[data-stitch-hide] { visibility: hidden !important; }' : '',
    `[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
     [id*="CybotCookiebot"], .cc-window, .cc-banner, #onetrust-banner-sdk,
     .otFlat, [class*="gdpr" i], [id*="gdpr" i] {
       display: none !important;
     }`,
  ].filter(Boolean).join('\n');

  // Build scroll positions — cap at max scrollable and actual segment limit
  const maxScroll = docHeight - vh;
  const scrollPositions: number[] = [0];
  for (let i = 1; i < MAX_SCROLL_SEGMENTS; i++) {
    const target = i * vh - STITCH_OVERLAP_PX;
    if (target >= maxScroll) {
      scrollPositions.push(maxScroll); // Final position — always land exactly at bottom
      break;
    }
    scrollPositions.push(target);
  }
  // Ensure we always capture the bottom of the page
  if (scrollPositions[scrollPositions.length - 1] < maxScroll) {
    scrollPositions.push(maxScroll);
  }

  console.log(`[screenshots/client] Scroll-and-stitch: ${scrollPositions.length} segments, ${fixedCount} fixed, doc=${docHeight}`);

  // Capture each segment, recording actual scroll positions
  const captured: { buffer: Buffer; actualY: number }[] = [];

  for (let i = 0; i < scrollPositions.length; i++) {
    await smartScrollTo(page, scrollPositions[i]);
    await page.waitForTimeout(i === 0 ? 100 : 150);

    // Get actual scroll position (browser may clamp)
    const actualY = await page.evaluate(() =>
      Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop),
    );

    const segmentStyle = i === 0
      ? SCREENSHOT_STYLE  // First segment: fixed elements visible (header/nav)
      : (hideFixedCSS ? `${SCREENSHOT_STYLE}\n${hideFixedCSS}` : SCREENSHOT_STYLE);

    const shot = await page.screenshot({
      type: 'png',
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      style: segmentStyle,
    });
    captured.push({ buffer: Buffer.from(shot), actualY });
  }

  // Clean up data attributes
  if (fixedCount > 0) {
    await page.evaluate(() => {
      document.querySelectorAll('[data-stitch-hide]').forEach((el) => {
        el.removeAttribute('data-stitch-hide');
      });
    });
  }

  // Stitch segments using ACTUAL scroll positions to calculate overlap
  const compositeInputs: { input: Buffer; top: number; left: number }[] = [];
  let stitchY = 0;

  for (let i = 0; i < captured.length; i++) {
    if (i === 0) {
      // First segment: use full viewport height
      compositeInputs.push({ input: captured[i].buffer, top: 0, left: 0 });
      stitchY = vh;
    } else {
      const prevY = captured[i - 1].actualY;
      const currY = captured[i].actualY;

      // Overlap = how much of this segment was already in the previous segment
      const overlap = Math.max(0, (prevY + vh) - currY);

      // For last segment: visible content may be less than viewport
      const isLast = i === captured.length - 1;
      const contentInViewport = isLast ? Math.min(vh, docHeight - currY) : vh;
      const usableHeight = contentInViewport - overlap;

      if (usableHeight <= 0) continue; // Skip if fully overlapping

      const cropped = await sharp(captured[i].buffer)
        .extract({ left: 0, top: overlap, width: vw, height: usableHeight })
        .toBuffer();

      compositeInputs.push({ input: cropped, top: stitchY, left: 0 });
      stitchY += usableHeight;
    }
  }

  const stitched = await sharp({
    create: {
      width: vw,
      height: stitchY,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(compositeInputs)
    .png()
    .toBuffer();

  console.log(`[screenshots/client] Stitched: ${vw}x${stitchY} from ${captured.length} segments`);
  return stitched;
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

    // ── Capture mode: full (scroll-and-stitch) vs fast ──
    let screenshotBuffer: Buffer;

    if (mode === 'full') {
      /* SCROLL-AND-STITCH CAPTURE
       *
       * Instead of resizing to a tall viewport (which causes Chrome tile
       * eviction — blank areas in the middle of long pages), we:
       * 1. Scroll through the page to trigger lazy loaders
       * 2. Re-swap data-src for newly loaded elements
       * 3. Wait for images to decode
       * 4. Capture one viewport-sized segment at a time
       * 5. Stitch all segments vertically with Sharp
       */

      // Phase 1 — Initial settle for JS hydration + above-fold animations
      await page.waitForTimeout(1500);

      // Phase 2 — Scroll to trigger lazy loaders, then return to top
      await triggerLazyLoadViaScroll(page, viewportSize);

      // Phase 3 — Re-run data-src swap for elements now loaded
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

      // Phase 5 — Scroll-and-stitch capture
      screenshotBuffer = await scrollAndStitch(page, viewportSize);
    } else {
      // Fast mode — short settle for basic JS rendering
      await page.waitForTimeout(2000);
      screenshotBuffer = await captureScreenshot(page, {
        fullPage: viewport === 'desktop',
        viewport: viewportSize,
      });
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
