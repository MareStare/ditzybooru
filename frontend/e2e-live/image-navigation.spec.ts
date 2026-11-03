import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/*
 * Previous, next and random on the image page, checked against the site's own
 * answer: Philomena's `/images/:id/navigate` says which image comes beside
 * another, and ours must name the same one.
 */

const UPSTREAM = process.env.LIVE_UPSTREAM;
const IMAGE = Number(process.env.LIVE_NAVIGATION_IMAGE ?? '3');

test.skip(
  process.env.LIVE_BASE_URL === undefined || UPSTREAM === undefined,
  'needs LIVE_BASE_URL and LIVE_UPSTREAM, see playwright.live.config.ts',
);

/** Where the site sends a reader asking for the image beside this one, or `null` for "nowhere else". */
async function upstreamNeighbour(request: APIRequestContext, rel: 'prev' | 'next', query: string) {
  const response = await request.get(`${UPSTREAM}/images/${IMAGE}/navigate`, {
    params: { rel, ...(query === '' ? {} : { q: query }) },
    maxRedirects: 0,
  });
  const location = response.headers().location ?? '';
  const id = Number(/\/images\/(\d+)/.exec(location)?.[1]);

  return id === IMAGE ? null : id;
}

for (const query of ['', 'safe']) {
  test(`previous and next name the images the site puts beside this one (${query === '' ? 'all images' : query})`, async ({
    page,
    request,
  }) => {
    await page.goto(`/images/${IMAGE}${query === '' ? '' : `?q=${query}`}`);
    const previous = await upstreamNeighbour(request, 'prev', query);
    const next = await upstreamNeighbour(request, 'next', query);
    const link = (rel: string) => page.locator(`.image-page__navigation a[rel="${rel}"]`);

    for (const [rel, expected] of [
      ['prev', previous],
      ['next', next],
    ] as const) {
      if (expected === null) {
        await expect(link(rel)).toHaveCount(0);
      } else {
        await expect(link(rel)).toHaveAttribute('href', new RegExp(`^/images/${expected}(\\?|$)`));
      }
    }
    // The search the reader came from is still the scope on the next page.
    if (query !== '' && next !== null) {
      await link('next').click();
      await expect(page).toHaveURL(new RegExp(`/images/${next}\\?q=${query}`));
    }
  });
}

test('random goes to an image', async ({ page }) => {
  await page.goto(`/images/${IMAGE}`);
  await page.getByRole('button', { name: 'Random' }).click();
  await expect(page).toHaveURL(/\/images\/\d+/);
  await expect(page.locator('.image-page__media')).toBeVisible();
});
