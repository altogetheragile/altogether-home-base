import { test, expect } from '@playwright/test';

test.describe('No broken Calendly links', () => {
  const pagesToCheck = ['/', '/events', '/coaching', '/about', '/blog'];

  for (const path of pagesToCheck) {
    test(`${path} has no broken Calendly links`, async ({ page }) => {
      await page.goto(path);
      const calendlyLinks = page.locator('a[href*="calendly"]');
      const count = await calendlyLinks.count();
      for (let i = 0; i < count; i++) {
        const href = await calendlyLinks.nth(i).getAttribute('href');
        expect(href).not.toContain('altogetheragile/chemistry');
        expect(href).toBe('https://calendly.com/alundaviesbaker/30min');
      }
    });
  }
});
