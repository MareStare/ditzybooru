import { expect } from '@playwright/test';

import { test } from './fixtures';

test.use({ theme: { lightness: 'light', color: 'blue' } });

test('home, light', async ({ page, open }) => {
  await open('/');
  await expect(page).toHaveScreenshot('home-light.png', { fullPage: true });
});
