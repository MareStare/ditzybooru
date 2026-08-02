import { defineConfig } from 'vitest/config';

/**
 * Deliberately separate from `vite.config.ts` rather than a `test` block inside
 * it: the suites here drive a real browser against a built site and need none of
 * the app's plugins, and loading the router plugin for a Node test run is a
 * cost with no payoff. Vitest picks this file over `vite.config.ts` when both
 * are present.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Launching Chromium and walking 18 themes is well past the 5s default.
    testTimeout: 30_000,
    hookTimeout: 180_000,
    // One browser, shared by every suite in a file. Running files in parallel
    // would launch one Chromium each and race for the same preview port.
    fileParallelism: false,
    // Vitest's console interception swallows anything logged from a teardown
    // hook, which is where the contrast summary is written — the run is over by
    // the time the reporter would flush it.
    disableConsoleIntercept: true,
  },
});
