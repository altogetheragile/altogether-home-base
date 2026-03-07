import { test, expect } from '@playwright/test';

test.describe('Coaching - Curious Clare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coaching');
  });

  test('coaching page loads for anonymous user', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('chemistry session CTA is present', async ({ page }) => {
    // Wait for the page to fully render. The coaching page renders "Book a free chemistry session"
    // in the hero, and "Free chemistry session" as a section heading, both with capital C.
    await page.waitForLoadState('networkidle');
    const ctaText = await page.locator('body').innerText();
    expect(ctaText.toLowerCase()).toContain('chemistry');
  });

  test('chemistry session CTA links to correct Calendly URL', async ({ page }) => {
    const chemistryLink = page.locator('a[href*="calendly"]');
    await expect(chemistryLink.first()).toHaveAttribute('href', 'https://calendly.com/alundaviesbaker/30min');
  });

  test('chemistry session CTA opens in new tab', async ({ page }) => {
    const chemistryLink = page.locator('a[href*="calendly.com/alundaviesbaker"]').first();
    await expect(chemistryLink).toHaveAttribute('target', '_blank');
  });
});
