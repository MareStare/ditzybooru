import { defineConfig, devices } from '@playwright/test';

/**
 * Tests that drive the real pipeline: our frontend, our backend and a running
 * Philomena. They need all three up, and the Philomena on hCaptcha's test keys
 * so a sign-in can be automated. Nothing starts them: set `LIVE_BASE_URL` to
 * where our frontend answers (a hostname that is not `localhost`, for
 * hCaptcha) and `LIVE_UPSTREAM` to the Philomena it reads from. Kept apart from
 * `playwright.config.ts`, which records screenshots from a mock build.
 */
export default defineConfig({
  testDir: 'e2e-live',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.LIVE_BASE_URL,
    ...devices['Desktop Chrome'],
    viewport: { width: 1100, height: 1000 },
  },
});
