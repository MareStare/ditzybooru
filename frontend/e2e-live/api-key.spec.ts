import { expect, test } from '@playwright/test';

import { signIn } from './sign-in';

/*
 * Signed in by cookie, the visitor's API key is saved without their typing it,
 * and it is the key the site itself shows them.
 */

const UPSTREAM = process.env.LIVE_UPSTREAM;

test.skip(
  process.env.LIVE_BASE_URL === undefined || UPSTREAM === undefined,
  'needs LIVE_BASE_URL and LIVE_UPSTREAM, see playwright.live.config.ts',
);

test("signing in saves the account's own API key, and signing out forgets it", async ({ page, context, request }) => {
  await signIn(page);
  await page.goto('/');
  const saved = () => page.evaluate(() => localStorage.getItem('ditzy-api-key'));

  // The key the site shows on the account page, read with the browser's own cookies.
  const cookies = (await context.cookies())
    .filter(cookie => cookie.name === '_philomena_key' || cookie.name === '_ses')
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
  const account = await (await request.get(`${UPSTREAM}/registrations/edit`, { headers: { cookie: cookies } })).text();
  const expected = /id="api-key"[^>]*>\s*<code>\s*([^<\s]+)/.exec(account)?.[1];
  expect(expected).toBeTruthy();

  await expect.poll(saved).toBe(expected);

  // A key that works: the site's own API accepts it for this account.
  const check = await request.get(`${UPSTREAM}/api/v1/json/filters/user`, { params: { key: expected ?? '' } });
  expect(check.ok()).toBe(true);

  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect.poll(saved).toBeNull();
});
