// TEST-ONLY route — captures a screenshot and returns the PNG directly.
// Not for production. Run locally with `bun run dev`.

import { NextRequest, NextResponse } from 'next/server';
import {
  connectBrowser,
  capturePageWithMetadata,
  disconnectBrowser,
} from '@/lib/screenshots/client';
import type { CaptureMode } from '@/lib/screenshots/client';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const mode = (req.nextUrl.searchParams.get('mode') ?? 'full') as CaptureMode;
  const viewport = req.nextUrl.searchParams.get('viewport') === 'mobile' ? 'mobile' : 'desktop';

  if (!url) {
    return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 });
  }

  // Normalize bare domains — add https:// if no protocol
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  let browser;
  try {
    const start = Date.now();
    browser = await connectBrowser();
    const result = await capturePageWithMetadata(browser, normalizedUrl, viewport, mode);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    return new NextResponse(new Uint8Array(result.screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'X-Capture-Time': `${elapsed}s`,
        'X-Page-Title': encodeURIComponent(result.title),
        'X-Final-URL': encodeURIComponent(result.url),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (browser) await disconnectBrowser(browser);
  }
}
