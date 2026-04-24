// Ad-hoc visual verification harness — NOT part of src/lib/playwright scanner pipeline.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || path.resolve('verification-screenshots/before');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile:  { width: 375,  height: 667 },
};

const TARGETS = [
  { slug: 'landing', url: '/', wait: 1500, fullPage: true, scroll: true },
  { slug: 'scan-connecting', url: '/scan/00000000-0000-0000-0000-000000000000', wait: 3000, fullPage: false, scroll: false },
  { slug: 'scan-connecting-full', url: '/scan/00000000-0000-0000-0000-000000000000', wait: 3000, fullPage: true, scroll: true },
];

const browser = await chromium.launch();
try {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    for (const t of TARGETS) {
      const url = BASE + t.url;
      console.log(`[${vpName}] ${t.slug} ← ${url}`);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(t.wait);
        if (t.scroll) {
          // Force-scroll through so GSAP ScrollTrigger fires
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
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log('done');
