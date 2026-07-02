import { test, expect, Page } from '@playwright/test';

// Read-only smoke against the LIVE deploy: logs in as the e2e admin account,
// visits every admin page whose table was migrated onto the shared DataTable
// (PRs #13-#15), and asserts the table renders without a client crash. It does
// NOT create, edit, or delete anything — it only navigates, reads, and performs
// non-mutating interactions (clicking a sort header, typing in search).
//
// Run: npx playwright test e2e/admin-tables.deployed.spec.ts --config=e2e/deployed.config.ts

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign In' }).click().catch(() => {});
  await page.getByTestId('email-input').fill(EMAIL);
  await page.getByTestId('password-input').fill(PASSWORD);
  await page.getByTestId('signin-submit-button').click();
  await expect(page).not.toHaveURL(/\/auth(\?|$)/, { timeout: 30_000 });
}

// route -> a heading substring we expect on that admin page
const PAGES: { route: string; heading: RegExp }[] = [
  { route: '/admin/logs/audit', heading: /Audit Logs/i },
  { route: '/admin/exams', heading: /Question Bank/i },
  { route: '/admin/instructors', heading: /Instructors/i },
  { route: '/admin/users', heading: /Users/i },
  { route: '/admin/contacts', heading: /Leads/i },
  { route: '/admin/feedback', heading: /Feedback/i },
  { route: '/admin/seo', heading: /SEO/i },
  { route: '/admin/events', heading: /Events/i },
  { route: '/admin/activity-domains', heading: /Domains of Interest/i },
  { route: '/admin/knowledge/taxonomy', heading: /Taxonomy/i },
  // NOTE: /admin/knowledge/items renders a card view, not a table. The migrated
  // KnowledgeItemsTable component is currently unused (imported by nothing), so
  // it is not reachable in the live UI and is intentionally excluded here.
];

test('admin DataTable pages render on the live deploy', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set');

  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await login(page);

  // Confirm the account actually has admin access before asserting on tables.
  // The gate renders an "Access Required / You need admin privileges" panel on
  // admin subroutes (the /admin index may redirect), so probe a real subroute.
  await page.goto('/admin/logs/audit');
  // Wait for either the admin gate OR the page heading to settle before deciding.
  const denied = await page
    .getByText(/access required|admin privileges/i)
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(denied, 'E2E account lacks the admin role on the live site — cannot verify admin tables');

  const results: string[] = [];
  for (const { route, heading } of PAGES) {
    await page.goto(route);
    // Heading confirms the page mounted (not a redirect / access-denied).
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 20_000 });
    // The DataTable always renders a <table> (with a header row) even when empty.
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 20_000 });
    const headerCells = await table.locator('thead th').count();
    expect(headerCells, `${route} should have a table header`).toBeGreaterThan(0);
    const bodyRows = await table.locator('tbody tr').count();
    results.push(`${route}: ${headerCells} cols, ${bodyRows} rows`);
  }

  // Non-mutating interaction on one table: sort + search must not crash.
  await page.goto('/admin/exams');
  await page.locator('thead th button', { hasText: /Title/i }).first().click().catch(() => {});
  const search = page.getByPlaceholder(/search exams/i);
  if (await search.isVisible().catch(() => false)) await search.fill('scrum');

  console.log('Admin table render results:\n  ' + results.join('\n  '));
  expect(errors, `no uncaught client errors:\n${errors.join('\n')}`).toEqual([]);
});
