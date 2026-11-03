import { expect, test } from '@playwright/test';
import type { APIRequestContext, BrowserContext } from '@playwright/test';

import { signIn } from './sign-in';

/*
 * Voting, faving and hiding on the image page, checked against the site
 * itself and not only against what the page shows: after every click, the
 * counters and the visitor's record are read straight from Philomena.
 */

const UPSTREAM = process.env.LIVE_UPSTREAM;
const IMAGE = Number(process.env.LIVE_IMAGE ?? '1');

test.skip(
  process.env.LIVE_BASE_URL === undefined || UPSTREAM === undefined,
  'needs LIVE_BASE_URL and LIVE_UPSTREAM, see playwright.live.config.ts',
);

interface Counters {
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
}

/** The image's counters as Philomena's own API has them. */
async function upstreamCounters(request: APIRequestContext): Promise<Counters> {
  const response = await request.get(`${UPSTREAM}/api/v1/json/images/${IMAGE}`);
  expect(response.ok()).toBe(true);
  const { image } = (await response.json()) as { image: Counters };

  return { score: image.score, upvotes: image.upvotes, downvotes: image.downvotes, faves: image.faves };
}

/** What the visitor has done to the image, as Philomena's own page records it for them. */
async function upstreamActivity(request: APIRequestContext, context: BrowserContext) {
  const cookies = (await context.cookies())
    .filter(cookie => cookie.name === '_philomena_key' || cookie.name === '_ses')
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
  const response = await request.get(`${UPSTREAM}/images/${IMAGE}`, { headers: { cookie: cookies } });
  const html = await response.text();
  const raw = /class="js-datastore"[^>]*data-interactions="([^"]*)"/.exec(html)?.[1] ?? '[]';
  const interactions = JSON.parse(raw.replace(/&quot;/g, '"')) as Array<{
    interaction_type: string;
    value: string | null;
  }>;
  const voted = interactions.find(entry => entry.interaction_type === 'voted');

  return {
    voted: voted?.value ?? null,
    faved: interactions.some(entry => entry.interaction_type === 'faved'),
    hidden: interactions.some(entry => entry.interaction_type === 'hidden'),
  };
}

test('the buttons change the site, and the page tells the truth about it', async ({ page, context, request }) => {
  await signIn(page);
  await page.goto(`/images/${IMAGE}`);
  const button = (label: string) => page.locator(`.image-page__interactions button[aria-label="${label}"]`);
  // The site has said what we did before; until then the buttons know nothing.
  await expect(page.locator('.image-page__interactions[data-ready="true"]')).toBeVisible();
  await expect(button('Upvote')).toBeEnabled();

  // Start from nothing, whatever an earlier run left behind.
  for (const [label, undo] of [
    ['Upvote', 'Upvote'],
    ['Downvote', 'Downvote'],
    ['Fave', 'Fave'],
    ['Hide', 'Hide'],
  ] as const) {
    if ((await button(label).getAttribute('aria-pressed')) === 'true') {
      await button(undo).click();
      await expect(button(label)).toHaveAttribute('aria-pressed', 'false');
    }
  }
  const before = await upstreamCounters(request);
  expect(await upstreamActivity(request, context)).toEqual({ voted: null, faved: false, hidden: false });

  // Upvote: the site's score goes up by one, and it records an upvote for us.
  await button('Upvote').click();
  await expect(button('Upvote')).toHaveAttribute('aria-pressed', 'true');
  const upvoted = await upstreamCounters(request);
  expect(upvoted.upvotes).toBe(before.upvotes + 1);
  expect(upvoted.score).toBe(before.score + 1);
  expect(await upstreamActivity(request, context)).toMatchObject({ voted: 'up' });
  await expect(page.locator('.image-page__score')).toHaveText(String(upvoted.score));

  // Coming back to the page is a new page load: what we did must still show, and the score must be the site's.
  await page.goto('/rules');
  await page.goto(`/images/${IMAGE}`);
  await expect(page.locator('.image-page__interactions[data-ready="true"]')).toBeVisible();
  await expect(button('Upvote')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.image-page__score')).toHaveText(String(upvoted.score));

  // Downvote replaces it.
  await button('Downvote').click();
  await expect(button('Downvote')).toHaveAttribute('aria-pressed', 'true');
  const downvoted = await upstreamCounters(request);
  expect(downvoted.upvotes).toBe(before.upvotes);
  expect(downvoted.downvotes).toBe(before.downvotes + 1);
  expect(await upstreamActivity(request, context)).toMatchObject({ voted: 'down' });
  await expect(button('Upvote')).toHaveAttribute('aria-pressed', 'false');

  // Taking it back leaves the site as it was.
  await button('Downvote').click();
  await expect(button('Downvote')).toHaveAttribute('aria-pressed', 'false');
  expect(await upstreamCounters(request)).toEqual(before);
  expect(await upstreamActivity(request, context)).toMatchObject({ voted: null });

  // A fave is the site's own count, and counts as an upvote on its side.
  await button('Fave').click();
  await expect(button('Fave')).toHaveAttribute('aria-pressed', 'true');
  const faved = await upstreamCounters(request);
  expect(faved.faves).toBe(before.faves + 1);
  expect(await upstreamActivity(request, context)).toMatchObject({ faved: true });

  // What the page shows after a fresh load is what the site says, not the page's memory.
  await page.reload();
  await expect(button('Fave')).toHaveAttribute('aria-pressed', 'true');

  await button('Hide').click();
  await expect(button('Hide')).toHaveAttribute('aria-pressed', 'true');
  expect(await upstreamActivity(request, context)).toMatchObject({ hidden: true });

  // Clean up: unhide, unfave, take the upvote the fave brought.
  await button('Hide').click();
  await expect(button('Hide')).toHaveAttribute('aria-pressed', 'false');
  await button('Fave').click();
  await expect(button('Fave')).toHaveAttribute('aria-pressed', 'false');
  expect((await upstreamCounters(request)).faves).toBe(before.faves);
  if ((await button('Upvote').getAttribute('aria-pressed')) === 'true') {
    await button('Upvote').click();
    await expect(button('Upvote')).toHaveAttribute('aria-pressed', 'false');
  }
  expect(await upstreamCounters(request)).toEqual(before);
  expect(await upstreamActivity(request, context)).toEqual({ voted: null, faved: false, hidden: false });
});
