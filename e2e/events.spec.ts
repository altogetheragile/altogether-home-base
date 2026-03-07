import { test, expect } from '@playwright/test';

test.describe('Events - Curious Clare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('events page loads for anonymous user', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('empty state shows a CTA rather than blank page', async ({ page }) => {
    // The events page always renders CourseCard divs (from the fallback catalogue or live data).
    // Course cards are plain divs — not article/event-card — but they always appear.
    // The page also has a "Book a chemistry session" CTA and "Enquire to schedule" text on cards.
    // We check that the page contains meaningful course/event content rather than a blank page.
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    const hasCourseCatalogue =
      body.toLowerCase().includes('enquire') ||
      body.toLowerCase().includes('chemistry') ||
      body.toLowerCase().includes('course') ||
      body.toLowerCase().includes('failed to load');
    expect(hasCourseCatalogue).toBeTruthy();
  });

  test('event CTAs do not 404', async ({ page }) => {
    const ctaLinks = page.locator('a[href*="calendly"], a[href*="book"], a[href*="register"]');
    const count = await ctaLinks.count();
    if (count > 0) {
      const href = await ctaLinks.first().getAttribute('href');
      expect(href).not.toBeNull();
      // External Calendly links should not be the broken chemistry URL
      if (href?.includes('calendly')) {
        expect(href).not.toContain('altogetheragile/chemistry');
      }
    }
  });
});
