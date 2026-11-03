import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const EMAIL = process.env.LIVE_EMAIL ?? 'user@example.com';
const PASSWORD = process.env.LIVE_PASSWORD ?? 'philomena123';

/** Signs in through the sign-in page, solving the captcha the test keys let through. */
export async function signIn(page: Page) {
  await page.goto('/sessions/new');
  await page.waitForSelector('iframe[src*="hcaptcha"]');
  await page.fill('#sign-in-email', EMAIL);
  await page.fill('#sign-in-password', PASSWORD);
  await page.locator('iframe[src*="hcaptcha"]').first().contentFrame().locator('#checkbox').click();
  await expect(page.locator('form.developer-setting button[type=submit]')).toBeEnabled();
  await page.click('form.developer-setting button[type=submit]');
  await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
}
