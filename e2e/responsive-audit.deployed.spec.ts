import { test, expect, Page } from '@playwright/test';

// Read-only responsive audit against the LIVE deploy: loads each screen at a
// phone width and measures horizontal overflow (documentElement scrollWidth vs
// clientWidth). Anything over the tolerance means the layout does not adapt and
// the page scrolls sideways. Prints a per-route report and fails listing the
// offenders, so it doubles as a regression guard as screens get fixed.
//
// Run: npx playwright test e2e/responsive-audit.deployed.spec.ts --config=e2e/deployed.config.ts

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;

const WIDTH = 390; // iPhone-ish
const TOLERANCE = 4;

const PUBLIC_ROUTES = [
  '/', '/events', '/coaching', '/about', '/contact', '/testimonials',
  '/blog', '/exams', '/knowledge-base', '/canvases',
  '/pathways', '/simulator-preview', '/flow-game',
];

const AUTHED_ROUTES = [
  '/dashboard', '/impact-map', '/bmc-generator', '/user-story-canvas',
  '/personas', '/journey-map', '/coach', '/probes', '/benefits',
  '/ways-of-working', '/backlog',
];

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign In' }).click().catch(() => {});
  await page.getByTestId('email-input').fill(EMAIL);
  await page.getByTestId('password-input').fill(PASSWORD);
  await page.getByTestId('signin-submit-button').click();
  await expect(page).not.toHaveURL(/\/auth(\?|$)/, { timeout: 30_000 });
}

async function overflowOf(page: Page, route: string): Promise<number> {
  await page.goto(route, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(600); // let async content settle
  return page.evaluate(() => {
    const el = document.documentElement;
    return Math.max(0, el.scrollWidth - el.clientWidth);
  });
}

test('screens adapt to a phone width without horizontal overflow', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set');
  test.setTimeout(180_000);
  await page.setViewportSize({ width: WIDTH, height: 844 });

  const results: { route: string; overflow: number; authed: boolean }[] = [];

  for (const route of PUBLIC_ROUTES) {
    results.push({ route, overflow: await overflowOf(page, route), authed: false });
  }
  await login(page);
  for (const route of AUTHED_ROUTES) {
    results.push({ route, overflow: await overflowOf(page, route), authed: true });
  }

  // Screens known to overflow, being fixed in batches. Remove a route once fixed;
  // the test then guards it against regressing. A NEW overflow (not listed) fails.
  const KNOWN_OFFENDERS = new Set(['/backlog', '/user-story-canvas', '/', '/benefits']);

  const offenders = results.filter((r) => r.overflow > TOLERANCE).sort((a, b) => b.overflow - a.overflow);
  const clean = results.filter((r) => r.overflow <= TOLERANCE);
  const regressions = offenders.filter((r) => !KNOWN_OFFENDERS.has(r.route));

  console.log(`\n=== Responsive audit @ ${WIDTH}px (overflow in px) ===`);
  for (const r of results.sort((a, b) => b.overflow - a.overflow)) {
    const tag = r.overflow <= TOLERANCE ? 'ok      ' : KNOWN_OFFENDERS.has(r.route) ? 'KNOWN   ' : 'NEW     ';
    console.log(`  ${tag} ${String(r.overflow).padStart(4)}  ${r.route}${r.authed ? '' : '  (public)'}`);
  }
  console.log(`\n${clean.length}/${results.length} clean, ${offenders.length} overflow (${regressions.length} new).`);

  expect(regressions, `NEW screens overflow horizontally at ${WIDTH}px:\n${regressions.map((o) => `  ${o.route} (+${o.overflow}px)`).join('\n')}`).toEqual([]);
});
