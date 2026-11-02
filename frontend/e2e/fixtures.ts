import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

/** `SETTINGS_COOKIE` from `lib/settings`, repeated rather than imported: that
 *  module pulls in the Start server runtime, which does not load under node. */
const SETTINGS_COOKIE = 'ditzy-settings';

interface Fixtures {
  /** Whether the mock data comes with a signed-in user. */
  signedIn: boolean;
  /** Sets the theme (and pins the mock data source) before the first load. */
  theme: { lightness: 'dark' | 'light'; color: string };
  /** Loads a path and waits until the page can be screenshotted stably. */
  open: (path: string) => Promise<void>;
}

/** FNV-1a, so one image id always gets the same color. */
function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) {
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  }
  return value >>> 0;
}

/**
 * A flat stand-in for a content image. Real art is user-generated and credited
 * to its artist, so none of it may land in a stored screenshot: the colour and
 * label come from the URL alone, which keeps the output stable between runs.
 */
function placeholder(url: URL): string {
  // `/img/<date>/<id>/<size>.<ext>` - every size of one image shares a color.
  const key = url.pathname.split('/').slice(0, -1).join('/');
  const id = key.split('/').pop() ?? '?';
  const hue = hash(key) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
<rect width="320" height="240" fill="hsl(${hue} 35% 40%)"/>
<text x="160" y="124" fill="#fff" font-family="sans-serif" font-size="28" text-anchor="middle">${id}</text>
</svg>`;
}

async function isolateNetwork(page: Page, origin: string, blocked: Array<string>): Promise<void> {
  await page.route(
    url => url.origin !== origin,
    route => {
      const request = route.request();
      const type = request.resourceType();
      if (type === 'image' || type === 'media') {
        return route.fulfill({ contentType: 'image/svg+xml', body: placeholder(new URL(request.url())) });
      }
      blocked.push(request.url());
      return route.abort();
    },
  );
}

export const test = base.extend<Fixtures>({
  signedIn: [true, { option: true }],
  theme: [{ lightness: 'dark', color: 'blue' }, { option: true }],

  page: async ({ page, baseURL, theme, signedIn }, run) => {
    const blocked: Array<string> = [];
    const origin = new URL(baseURL ?? '').origin;
    await isolateNetwork(page, origin, blocked);
    // The suite runs the production build, where React reports hydration
    // mismatches as errors (`Minified React error #418`, `#423`, `#425`). Any
    // console error or warning, or an uncaught exception, fails the test.
    const problems: Array<string> = [];
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') {
        problems.push(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', error => {
      problems.push(`uncaught: ${error.message}`);
    });
    // Relative times ("3 hours ago") come from the clock on the page. The mock
    // comments are dated 2026-07-18, so pin "now" a few hours after.
    await page.clock.install({ time: new Date('2026-07-18T12:00:00Z') });
    await page.context().addCookies([
      {
        name: SETTINGS_COOKIE,
        value: encodeURIComponent(JSON.stringify({ ...theme, dataSource: signedIn ? 'mock' : 'mock-anonymous' })),
        url: origin,
      },
    ]);
    await run(page);
    // Anything but an image left the site: either a real leak or a new
    // dependency that makes the screenshots unstable.
    if (blocked.length > 0) {
      throw new Error(`Requests to other origins: ${blocked.join(', ')}`);
    }
    if (problems.length > 0) {
      throw new Error(`The page logged errors or warnings:\n${problems.join('\n')}`);
    }
  },

  open: async ({ page }, run) => {
    await run(async path => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // Lazy images only load once scrolled near, so walk the page first.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForFunction(() => Array.from(document.images).every(image => image.complete));
      // Lets the post-hydration effects run on the pinned clock, so relative
      // times show the pinned "now" and not the server's.
      await page.clock.runFor(1000);
    });
  },
});
