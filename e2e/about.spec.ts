import { test, expect } from '@playwright/test';

test.describe('About - Ready Ravi', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('about page loads for anonymous user', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('experience or credentials are mentioned', async ({ page }) => {
    // Wait for the page content to be fully rendered before reading text.
    // The About page shows credentials like "25+ years experience", "AgilePM",
    // "Lead author", "Advanced Certified Scrum Master", etc.
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    expect(
      body.toLowerCase().includes('year') ||
      body.toLowerCase().includes('experience') ||
      body.toLowerCase().includes('agilepm') ||
      body.toLowerCase().includes('agile') ||
      body.toLowerCase().includes('credential') ||
      body.toLowerCase().includes('certified') ||
      body.toLowerCase().includes('scrum')
    ).toBeTruthy();
  });

  test('no broken images on about page', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute('src');
      if (src && !src.startsWith('data:')) {
        // Check image loaded successfully
        const naturalWidth = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });
});
