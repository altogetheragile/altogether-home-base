import { test, expect, Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Verifies the Pattern Builder save/export work added in 0c31c3f7, against the
// live deploy. To stay deterministic (not dependent on the AI adviser returning
// steps), we inject a known pattern via the same sessionStorage stash the
// "Sign In to Save" button writes, then exercise restore + save + view.

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;
const RUN = String(Date.now()).slice(-6);
const RESUME_KEY = 'pattern:resume';
const BUILDER = '/knowledge-base/pattern-builder';

const SCENARIO = `E2E pattern scenario ${RUN}`;
const DIAGNOSIS = `E2E diagnosis ${RUN}`;
const stash = JSON.stringify({
  scenario: SCENARIO,
  result: {
    diagnosis: DIAGNOSIS,
    primaryHorizon: 'Discovery',
    steps: [{ order: 1, horizon: 'Discovery', isa: null, artifactId: `e2e-artifact-${RUN}`, techniqueIds: [], rationale: `E2E rationale ${RUN}` }],
    cautions: [`E2E caution ${RUN}`],
  },
});

async function login(page: Page) {
  await page.getByRole('tab', { name: 'Sign In' }).click().catch(() => {});
  await page.getByTestId('email-input').fill(EMAIL);
  await page.getByTestId('password-input').fill(PASSWORD);
  await page.getByTestId('signin-submit-button').click();
}

test('logged out: a built pattern offers Export and Sign In to Save', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'creds not set');
  // Establish origin, inject the stash, then load the builder so restore runs on mount.
  await page.goto(BUILDER);
  await page.evaluate(([k, v]) => sessionStorage.setItem(k, v), [RESUME_KEY, stash]);
  await page.reload();
  await expect(page.getByText(DIAGNOSIS)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Export Markdown' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In to Save' })).toBeVisible();
  // Logged out: there is no "Save to Project".
  await expect(page.getByRole('button', { name: 'Save to Project' })).toHaveCount(0);
});

test('login round-trip restores the pattern and saves it to a project', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'creds not set');

  // Simulate what "Sign In to Save" does: stash the work + return path, then sign in.
  await page.goto('/');
  await page.evaluate(([k, v, rt]) => {
    sessionStorage.setItem(k, v);
    sessionStorage.setItem('auth:returnTo', rt);
  }, [RESUME_KEY, stash, `${BUILDER}?resume=1`]);

  await page.goto('/auth');
  await login(page);

  // Back on the builder, the stash is restored.
  await expect(page).toHaveURL(new RegExp('/knowledge-base/pattern-builder'), { timeout: 30_000 });
  await expect(page.getByText(DIAGNOSIS)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('textarea').first()).toHaveValue(SCENARIO);

  // Now logged in: Save to Project into a brand new project.
  await page.getByRole('button', { name: 'Save to Project' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Save to Project' })).toBeVisible();
  await dialog.getByLabel(/Create new project/i).click();
  await dialog.getByLabel(/Project Name/i).fill(`E2E Pattern ${RUN}`);
  await dialog.getByRole('button', { name: 'Save to Project' }).click();

  // Lands on the saved artifact, which renders the pattern read-only.
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/artifacts\/[0-9a-f-]+/, { timeout: 30_000 });
  await expect(page.getByText(DIAGNOSIS)).toBeVisible({ timeout: 20_000 });
  const projectId = page.url().match(/\/projects\/([0-9a-f-]+)/)![1];
  writeFileSync('e2e/.pattern-run.json', JSON.stringify({ projectId, RUN }, null, 2));
  console.log('  saved pattern into project', projectId);
});
