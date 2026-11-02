import { defineConfig, devices } from '@playwright/test';

const PORT = 4320;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Screenshot recorder behind `pnpm run e2e`. It keeps a visual history and
 * enforces nothing: `scripts/e2e.sh` always rewrites changed images. Kept apart from the Vitest `a11y`
 * project: that one walks themes for axe, this one stores pixels, and the two
 * want different lifecycles. Port 4320 keeps it clear of the a11y preview.
 *
 * Baselines carry no OS suffix because there is one canonical renderer: the
 * browser from the pinned Playwright image that `scripts/e2e.sh` runs.
 */
export default defineConfig({
  testDir: 'e2e',
  snapshotPathTemplate: 'e2e/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      // No pixel budget: every shot is rendered by the same pinned browser, so
      // there is no noise to absorb, and any difference is worth recording.
      maxDiffPixels: 0,
    },
  },
  use: {
    baseURL: BASE_URL,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: `vite build && vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Reuse a running server, but never one that is not ours to stop.
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
