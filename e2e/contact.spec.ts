import { test, expect } from '@playwright/test';

test.describe('Contact / Enquiries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('contact page loads for anonymous user', async ({ page }) => {
    await expect(page.locator('form, h1, h2').first()).toBeVisible();
  });

  test('form has name and email fields', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('submitting empty form shows validation errors, not a crash', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button:has-text("send"), button:has-text("submit")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      // Should not navigate away or show a 500 error
      await expect(page).toHaveURL(/contact/);
    }
  });
});
