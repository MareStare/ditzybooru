import { expect } from '@playwright/test';

import { test } from './fixtures';

test('home', async ({ page, open }) => {
  await open('/');
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test.describe('signed out', () => {
  test.use({ signedIn: false });

  test('home', async ({ page, open }) => {
    await open('/');
    await expect(page).toHaveScreenshot('home-signed-out.png', { fullPage: true });
  });
});

test('search results', async ({ page, open }) => {
  await open('/search?q=*&page=1');
  await expect(page).toHaveScreenshot('search-results.png', { fullPage: true });
});

test('display settings', async ({ page, open }) => {
  await open('/settings/display');
  await expect(page).toHaveScreenshot('settings-display.png', { fullPage: true });
});

test('developer settings', async ({ page, open }) => {
  await open('/settings/developer');
  await expect(page).toHaveScreenshot('settings-developer.png', { fullPage: true });
});
