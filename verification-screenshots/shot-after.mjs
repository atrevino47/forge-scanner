// After-fix screenshots: test both normal + reduced-motion. No force-scroll —
// if the reduced-motion fix works, content should be visible without scrolling.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || path.resolve('verification-screenshots/after');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile:  { width: 375,  height: 667 },
};

const TARGETS = [
  { slug: 'landing',         url: '/',                                              wait: 1500, fullPage: true,  scroll: true,  reducedMotion: false },
  { slug: 'landing-reduced', url: '/',                                              wait: 1500, fullPage: true,  scroll: false, reducedMotion: true  },
  { slug: 'scan',            url: '/scan/00000000-0000-0000-0000-000000000000',    wait: 2500, fullPage: true,  scroll: true,  reducedMotion: false },
  { slug: 'scan-reduced',    url: '/scan/00000000-0000-0000-0000-000000000000',    wait: 2500, fullPage: true,  scroll: false, reducedMotion: true  },
];

const browser = await chromium.launch();
try {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const t of TARGETS) {
      const ctx = await browser.newContext({
        viewport: vp,
        deviceScaleFactor: 2,
        reducedMotion: t.reducedMotion ? 'reduce' : 'no-preference',
      });
      const page = await ctx.newPage();
      const url = BASE + t.url;
      console.log(`[${vpName}] ${t.slug} ← ${url} reducedMotion=${t.reducedMotion}`);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(t.wait);
        if (t.scroll) {
          await page.evaluate(async () => {
            const step = 400;
            for (let y = 0; y <= document.body.scrollHeight; y += step) {
              window.scrollTo(0, y);
              await new Promise(r => setTimeout(r, 80));
            }
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 250));
          });
        }
        const file = path.join(OUT, `${t.slug}.${vpName}.png`);
        await page.screenshot({ path: file, fullPage: !!t.fullPage });
        console.log('   → ' + file);
      } catch (e) {
        console.error(`  ! ${t.slug} ${vpName} FAILED:`, e.message);
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
console.log('done');
