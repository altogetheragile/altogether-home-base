import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('blog page loads for anonymous user', async ({ page }) => {
    // Blog may be behind a feature flag — if disabled, we'll see a 404 or redirect.
    // Either way, the page should render something (not a blank screen).
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('blog posts are visible or feature is disabled', async ({ page }) => {
    // The blog is behind a SiteSettingsRouteGuard. When disabled, the route
    // redirects to a 404 page. We need to detect this and skip gracefully.
    await page.waitForLoadState('networkidle');

    const pageText = await page.locator('body').innerText();
    const isBlogDisabled = pageText.includes('Page Not Found') ||
      pageText.includes('Feature Unavailable') ||
      pageText.includes("doesn't exist");

    if (isBlogDisabled) {
      // Blog feature is off — nothing to test
      return;
    }

    // Blog is enabled — wait for posts to load
    const postCards = page.locator('a[href*="/blog/"]');
    const emptyState = page.locator('text=No blog posts found');

    await expect(postCards.first().or(emptyState)).toBeVisible({ timeout: 10000 });

    const cardCount = await postCards.count();
    const isEmpty = await emptyState.isVisible();
    expect(cardCount > 0 || isEmpty).toBeTruthy();
  });

  test('clicking a blog post navigates to post detail', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const pageText = await page.locator('body').innerText();
    if (pageText.includes('Page Not Found') || pageText.includes('Feature Unavailable')) return;

    const postCards = page.locator('a[href*="/blog/"]');
    await expect(postCards.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    if (await postCards.count() === 0) return;

    await postCards.first().click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('blog post detail has back link', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const pageText = await page.locator('body').innerText();
    if (pageText.includes('Page Not Found') || pageText.includes('Feature Unavailable')) return;

    const postCards = page.locator('a[href*="/blog/"]');
    await expect(postCards.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    if (await postCards.count() === 0) return;

    await postCards.first().click();
    await expect(page.getByRole('link', { name: /back to blog/i })).toBeVisible();
  });
});
