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

  test('nav is consistent across pages', async ({ page, isMobile }) => {
    async function getNavLinks() {
      await page.waitForLoadState('networkidle');
      if (isMobile) {
        const menuButton = page.locator('.aa-nav-hamburger button').first();
        if (await menuButton.isVisible()) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      // Collect all visible links from the nav
      const links = await page.locator('nav').evaluateAll(navs => {
        const allLinks: string[] = [];
        for (const nav of navs) {
          for (const a of nav.querySelectorAll('a[href]')) {
            const href = a.getAttribute('href');
            const visible = (a as HTMLElement).offsetParent !== null || (a as HTMLElement).offsetHeight > 0;
            if (href && href.startsWith('/') && visible) {
              allLinks.push(href);
            }
          }
        }
        return [...new Set(allLinks)].sort();
      });
      return links;
    }

    await page.goto('/');
    const homeNavLinks = await getNavLinks();

    await page.goto('/coaching');
    const coachingNavLinks = await getNavLinks();

    expect(homeNavLinks.length).toBeGreaterThan(0);
    expect(homeNavLinks).toEqual(coachingNavLinks);
  });
});
