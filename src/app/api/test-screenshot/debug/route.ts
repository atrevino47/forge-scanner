// DEBUG-ONLY route — connects to Chrome and diagnoses scroll behavior on a page.
// Returns JSON with diagnostic info. Not for production.

import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 });
  }
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const wsEndpoint = process.env.BROWSER_WS_ENDPOINT;
  if (!wsEndpoint) {
    return NextResponse.json({ error: 'BROWSER_WS_ENDPOINT not set' }, { status: 500 });
  }

  let browser;
  try {
    const httpUrl = wsEndpoint.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
    const versionRes = await fetch(`${httpUrl}/json/version`);
    const version = (await versionRes.json()) as { webSocketDebuggerUrl: string };
    const path = new URL(version.webSocketDebuggerUrl).pathname;
    const cdpUrl = `${wsEndpoint}${path}`;
    browser = await chromium.connectOverCDP(cdpUrl);

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'en-US',
      javaScriptEnabled: true,
    });

    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(normalizedUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});

    // Wait for page to settle
    await page.waitForTimeout(2000);

    // Diagnostic 1: document height
    const docHeight = await page.evaluate(() =>
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    );

    // Diagnostic 2: body/html overflow and scroll-behavior
    const scrollInfo = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const bodyStyle = window.getComputedStyle(body);
      const htmlStyle = window.getComputedStyle(html);
      return {
        bodyOverflow: bodyStyle.overflow,
        bodyOverflowY: bodyStyle.overflowY,
        htmlOverflow: htmlStyle.overflow,
        htmlOverflowY: htmlStyle.overflowY,
        bodyScrollBehavior: bodyStyle.scrollBehavior,
        htmlScrollBehavior: htmlStyle.scrollBehavior,
        bodyHeight: bodyStyle.height,
        htmlHeight: htmlStyle.height,
      };
    });

    // Diagnostic 3: try scrolling and check if it works
    const scrollTests = [];
    for (const targetY of [900, 1800, 3000]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), targetY);
      await page.waitForTimeout(200);
      const actualY = await page.evaluate(() => window.scrollY);
      scrollTests.push({ targetY, actualY, worked: Math.abs(actualY - targetY) < 50 });
    }

    // Diagnostic 4: detect fixed/sticky elements
    const fixedElements = await page.evaluate(() => {
      const results: { tag: string; classes: string; position: string; rect: string }[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') {
          const rect = el.getBoundingClientRect();
          results.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className.toString().slice(0, 100),
            position: style.position,
            rect: `${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
          });
        }
      });
      return results;
    });

    // Diagnostic 5: check for Revolution Slider / scroll-jacking containers
    const sliderInfo = await page.evaluate(() => {
      const revSlider = document.querySelector('.rev_slider, .rs-fullwidth-wrap, [class*="revslider"]');
      const fullpageJs = document.querySelector('.fullpage-wrapper, #fullpage');
      const scrollContainer = document.querySelector('[class*="scroll-container"], [class*="smooth-scroll"]');

      // Check if there's a non-body scroll container
      let actualScrollEl = null;
      const candidates = document.querySelectorAll('div, main, section');
      for (const el of candidates) {
        const style = window.getComputedStyle(el);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 100) {
          actualScrollEl = {
            tag: el.tagName,
            classes: el.className.toString().slice(0, 100),
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
          };
          break;
        }
      }

      return {
        hasRevSlider: !!revSlider,
        revSliderClasses: revSlider?.className?.toString().slice(0, 200) ?? null,
        hasFullpageJs: !!fullpageJs,
        hasScrollContainer: !!scrollContainer,
        alternateScrollElement: actualScrollEl,
      };
    });

    // Diagnostic 6: find the REAL scroll container (not window)
    const scrollContainers = await page.evaluate(() => {
      const results: { tag: string; id: string; classes: string; overflowY: string; scrollHeight: number; clientHeight: number; depth: number }[] = [];
      function findScrollable(parent: Element, depth: number) {
        if (depth > 8) return;
        for (const el of Array.from(parent.children)) {
          const style = window.getComputedStyle(el);
          const hasScroll = el.scrollHeight > el.clientHeight + 50;
          if (hasScroll) {
            results.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              classes: el.className.toString().slice(0, 150),
              overflowY: style.overflowY,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              depth,
            });
          }
          findScrollable(el, depth + 1);
        }
      }
      findScrollable(document.body, 0);
      return results;
    });

    // Diagnostic 7: try scrolling via document.body.scrollTop
    const bodyScrollTest = await page.evaluate(() => {
      document.body.scrollTop = 1000;
      const afterBody = document.body.scrollTop;
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 1000;
      const afterHtml = document.documentElement.scrollTop;
      document.documentElement.scrollTop = 0;
      return { bodyScrollTop: afterBody, htmlScrollTop: afterHtml };
    });

    // Diagnostic 8: try scrolling the largest scroll container directly
    let containerScrollTest = null;
    if (scrollContainers.length > 0) {
      const largest = scrollContainers.reduce((a, b) => a.scrollHeight > b.scrollHeight ? a : b);
      containerScrollTest = await page.evaluate(({ tag, id, classes }) => {
        // Find the element again
        let el: Element | null = null;
        if (id) {
          el = document.getElementById(id);
        } else {
          const candidates = document.querySelectorAll(tag);
          for (const c of candidates) {
            if (c.className.toString().slice(0, 150) === classes) { el = c; break; }
          }
        }
        if (!el) return { found: false };

        // Try scrolling this container
        el.scrollTop = 1000;
        const actualScroll = el.scrollTop;
        el.scrollTop = 0;
        return {
          found: true,
          tag: el.tagName,
          id: el.id || '',
          scrollWorked: actualScroll > 500,
          actualScroll,
        };
      }, largest);
    }

    await page.close();
    await browser.close();

    return NextResponse.json({
      url: normalizedUrl,
      docHeight,
      scrollInfo,
      scrollTests,
      fixedElements,
      sliderInfo,
      bodyScrollTest,
      scrollContainers,
      containerScrollTest,
    }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (browser) await browser.close().catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
