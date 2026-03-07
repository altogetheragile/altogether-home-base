import { test, expect } from '@playwright/test';

const pages = ['/', '/events', '/coaching', '/about', '/contact', '/testimonials', '/blog'];

test.describe('Navigation', () => {
  for (const path of pages) {
    test(`${path} loads without 404`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveTitle(/404|not found/i);
      await expect(page.locator('nav')).toBeVisible();
    });
  }

  test('all nav links resolve without 404', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a[href]');
    const hrefs = await navLinks.evaluateAll(links =>
      links.map(l => l.getAttribute('href')).filter(h => h && h.startsWith('/'))
    );
    for (const href of hrefs) {
      const response = await page.goto(href!);
      expect(response?.status()).not.toBe(404);
    }
  });

  test('nav is consistent across pages', async ({ page }) => {
    await page.goto('/');
    const homeNavLinks = await page.locator('nav a[href]').evaluateAll(
      links => links.map(l => l.getAttribute('href')).sort()
    );

    await page.goto('/coaching');
    const coachingNavLinks = await page.locator('nav a[href]').evaluateAll(
      links => links.map(l => l.getAttribute('href')).sort()
    );

    expect(homeNavLinks).toEqual(coachingNavLinks);
  });
});
