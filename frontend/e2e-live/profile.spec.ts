import { expect, test } from '@playwright/test';

/*
 * The profile page, checked against the site's own JSON for the same user:
 * the id our page links to and the name it shows must be the site's.
 */

const UPSTREAM = process.env.LIVE_UPSTREAM;
const USER_ID = Number(process.env.LIVE_PROFILE_ID ?? '4');

test.skip(
  process.env.LIVE_BASE_URL === undefined || UPSTREAM === undefined,
  'needs LIVE_BASE_URL and LIVE_UPSTREAM, see playwright.live.config.ts',
);

test("the profile page is the site's user", async ({ page, request }) => {
  const response = await request.get(`${UPSTREAM}/api/v1/json/profiles/${USER_ID}`);
  expect(response.ok()).toBe(true);
  const { user } = (await response.json()) as { user: { name: string; slug: string } };

  await page.goto(`/profiles/${encodeURIComponent(user.slug)}`);
  await expect(page.getByRole('heading', { level: 1, name: user.name })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Uploads' })).toHaveAttribute(
    'href',
    `/search?q=${encodeURIComponent(`uploader_id:${USER_ID}`)}`,
  );
  await expect(page.getByText('Statistics (last 90 days)')).toBeVisible();
});
