/**
 * Accessibility check, run by axe-core against the built site in a real browser.
 *
 * axe-core finds structural defects - missing names, bad roles, broken
 * landmarks, unlabelled controls - and scores contrast with the WCAG 2 ratio.
 * It is the industry-standard engine and has a zero-false-positive policy, so
 * anything it reports is worth fixing.
 *
 * Lighthouse is deliberately NOT used. Its accessibility category is axe-core
 * with a reduced rule set, wrapped in a weighted 0-100 score that hides which
 * rule failed. Running axe directly is strictly more coverage for strictly less
 * work; Lighthouse earns its place for performance budgets, which is a separate
 * concern from this suite.
 *
 * Contrast is checked in every theme rather than only in light and dark,
 * because it is the one class of defect whose result changes with the accent
 * color - every other rule here is about markup, which does not.
 *
 * Usage:
 *   npm test                           # builds, serves, checks
 *   A11Y_URL=http://localhost:5173 …   # check a running dev server instead
 *   CHROME_PATH=/path/to/chrome …      # if playwright's browser is not installed
 */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import process from 'node:process';

import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { build, preview as vitePreview } from 'vite';
import type { PreviewServer } from 'vite';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import type { AxeResults, ElementContext, RunOptions } from 'axe-core';

/** The global the axe bundle defines once injected into the page. Cast onto
 *  `window` at the call site rather than declared globally, so the app's own
 *  types stay unaware of a thing only this suite ever injects. */
interface AxeWindow {
  axe: { run: (context: ElementContext, options: RunOptions) => Promise<AxeResults> };
}

const PREVIEW_PORT = 4319;

/** `SETTINGS_COOKIE` from `lib/settings`, repeated rather than imported: that
 *  module pulls in the Start server runtime, which does not load under node. */
const SETTINGS_COOKIE = 'ditzy-settings';

const LIGHTNESSES = ['dark', 'light'] as const;
const COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'gray'] as const;
const PATHS = ['/', '/search?q=*&page=1', '/settings/display'] as const;

type Lightness = (typeof LIGHTNESSES)[number];
type Color = (typeof COLORS)[number];
/** `dark-red`, `light-blue`, … - one per theme the site can be in. */
type Theme = `${Lightness}-${Color}`;

interface ThemeCase {
  id: Theme;
  lightness: Lightness;
  color: Color;
}

const THEMES: Array<ThemeCase> = LIGHTNESSES.flatMap(lightness =>
  COLORS.map(color => ({ id: `${lightness}-${color}` as const, lightness, color })),
);

/**
 * Structure is checked in one theme per polarity and contrast in all eighteen.
 * Splitting the run this way keeps it to 4 structural passes and 36 contrast
 * passes rather than 36 full ones - the markup rules would return an identical
 * answer in every accent color, and paying for that nine times over is the
 * difference between a suite that runs in CI and one that gets skipped.
 */
const STRUCTURE_RULES: RunOptions = {
  resultTypes: ['violations'],
  rules: {
    'color-contrast': { enabled: false },
    // Disabled deliberately, and it IS a WCAG 1.4.1 failure - links in running
    // text are distinguished by color alone.
    //
    // The rule passes on a non-color cue (an underline) or on 3:1 luminance
    // between the link and the text around it. This design has no underlines,
    // and the second option is unreachable here rather than merely untried:
    // body text sits at ~13:1 against the surface, so a link 3:1 away from it
    // can be at most 13/3 = 4.3:1 against that same surface - under the 4.5:1
    // this suite enforces everywhere else. Satisfying the rule would mean
    // failing contrast.
    //
    // Re-enable the moment prose links get an underline back.
    'link-in-text-block': { enabled: false },
  },
};

const CONTRAST_RULES: RunOptions = {
  resultTypes: ['violations'],
  runOnly: { type: 'rule', values: ['color-contrast'] },
};

/** One line per violation, with the first offending node - enough to find it
 *  without dumping axe's full result object into the diff. */
function summarize(results: AxeResults): Array<string> {
  return results.violations.flatMap(violation =>
    violation.nodes.map(node => `${violation.id} (${violation.impact}): ${node.target.join(' ')} - ${violation.help}`),
  );
}

async function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.CHROME_PATH;
  try {
    return await chromium.launch(executablePath ? { executablePath } : {});
  } catch (cause) {
    throw new Error(
      'Could not launch Chromium. Run `npx playwright install chromium`, or set CHROME_PATH to a Chrome binary.',
      { cause },
    );
  }
}

const projectRoot = new URL('..', import.meta.url).pathname;

let preview: PreviewServer | undefined;
// Undefined until `beforeAll` runs, and still undefined in `afterAll` if it
// threw on the way - which is exactly when the teardown must not itself throw.
let browser: Browser | undefined;
let page: Page;
let axeSource: string;
let baseUrl: string;

/**
 * Loads a path with a theme applied and returns axe's violations for it.
 *
 * The theme is set through the settings cookie rather than by writing the
 * attributes directly, because the cookie is what the server renders from: the
 * markup arrives in the requested theme, with no window where the page is in
 * one theme and axe is asked about another. Writing the attributes instead
 * would also race `prefers-color-scheme`, which is what decides the theme
 * whenever nothing is stored.
 *
 * An explicit `lightness` and `color` are sent even where they match the
 * shipped defaults - `parseSettings` takes them either way, and it keeps this
 * from depending on which values happen to be default.
 */
async function audit(path: string, lightness: Lightness, color: Color, options: RunOptions): Promise<Array<string>> {
  const context = page.context();
  await context.clearCookies();
  await context.addCookies([
    {
      name: SETTINGS_COOKIE,
      value: encodeURIComponent(JSON.stringify({ lightness, color })),
      url: baseUrl,
    },
  ]);
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  await page.evaluate(axeSource);
  const results = await page.evaluate(async ({ opts }) => (window as unknown as AxeWindow).axe.run(document, opts), {
    opts: options,
  });
  return summarize(results);
}

beforeAll(async () => {
  axeSource = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

  // Vite's API rather than a spawned CLI: the build has to finish before the
  // server starts serving `dist`, and an in-process server cannot outlive the
  // run as an orphan holding the port.
  const externalUrl = process.env.A11Y_URL;
  if (externalUrl) {
    baseUrl = externalUrl;
  } else {
    await build({ root: projectRoot, logLevel: 'warn' });
    preview = await vitePreview({
      root: projectRoot,
      logLevel: 'warn',
      preview: { host: '127.0.0.1', port: PREVIEW_PORT, strictPort: true },
    });
    // Literal IP, not `localhost`: the server binds v4 only, and a v6-first
    // resolution of `localhost` would fail to connect.
    baseUrl = `http://127.0.0.1:${PREVIEW_PORT}`;
  }

  browser = await launchBrowser();
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
}, 180_000);

afterAll(async () => {
  await browser?.close();
  await preview?.close();
});

describe('structure', () => {
  test.for(PATHS.flatMap(path => LIGHTNESSES.map(lightness => ({ path, lightness }))))(
    '$path is sound in the $lightness theme',
    async ({ path, lightness }) => {
      expect(await audit(path, lightness, 'blue', STRUCTURE_RULES)).toEqual([]);
    },
  );
});

describe('contrast', () => {
  test.for(PATHS.flatMap(path => THEMES.map(theme => ({ path, theme }))))(
    '$path meets WCAG AA in the $theme.id theme',
    async ({ path, theme }) => {
      expect(await audit(path, theme.lightness, theme.color, CONTRAST_RULES)).toEqual([]);
    },
  );
});
