import { test, expect, devices } from '@playwright/test';

const mobilePaths = ['/', '/events', '/coaching', '/about', '/contact', '/blog'];

test.describe('Mobile responsiveness (375px)', () => {
  for (const path of mobilePaths) {
    test(`${path} has no horizontal scroll on mobile`, async ({ browser }) => {
      const context = await browser.newContext({ ...devices['iPhone 12'] });
      const page = await context.newPage();
      await page.goto(path);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
      await context.close();
    });
  }
});
