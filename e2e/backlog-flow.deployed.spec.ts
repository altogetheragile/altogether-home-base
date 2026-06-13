import { test, expect, Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// End-to-end test of "Multiple product backlogs per project" against the LIVE
// deploy. Logs in as the e2e account, builds an Impact Map in a fresh project,
// saves it, sends deliverables to a new product backlog, verifies the backlog
// shows as a project card with the items, and verifies per-backlog dedup.
//
// Run: npx playwright test e2e/backlog-flow.deployed.spec.ts --config=e2e/deployed.config.ts
// Cleanup of the created project is done afterwards by scripts/.e2e-cleanup.mjs
// (the projectId is written to e2e/.last-run.json).

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;
const RUN = String(Date.now()).slice(-6);

const PROJECT = `E2E Backlog ${RUN}`;
const GOAL = `E2E goal ${RUN}`;
const ACTOR = `E2E actor ${RUN}`;
const IMPACT = `E2E impact ${RUN}`;
const DELIV_A = `E2E deliverable A ${RUN}`;
const DELIV_B = `E2E deliverable B ${RUN}`;
const BACKLOG = `E2E Backlog A ${RUN}`;

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign In' }).click().catch(() => {});
  await page.getByTestId('email-input').fill(EMAIL);
  await page.getByTestId('password-input').fill(PASSWORD);
  await page.getByTestId('signin-submit-button').click();
  // Land somewhere authenticated (home or dashboard); just leave /auth.
  await expect(page).not.toHaveURL(/\/auth(\?|$)/, { timeout: 30_000 });
}

test('Impact Map deliverables flow into a chosen product backlog', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set');

  // Surface client errors in the test log.
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [browser error]', m.text()); });

  await login(page);

  // --- Create a fresh project (New Project lives under the My Projects tab) ---
  await page.goto('/dashboard');
  await page.getByRole('tab', { name: /My Projects/i }).click();
  await page.getByRole('button', { name: /New Project/i }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Project Name/i).fill(PROJECT);
  await dialog.getByRole('button', { name: /^Create Project$/ }).click();
  // The dashboard lists the new project as a card; open it via its View Project button.
  const projectCard = page.getByRole('heading', { name: PROJECT })
    .locator('xpath=ancestor::div[.//button[normalize-space()="View Project"]][1]');
  await projectCard.getByRole('button', { name: 'View Project' }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+/, { timeout: 30_000 });
  const projectId = page.url().match(/\/projects\/([0-9a-f-]+)/)![1];
  writeFileSync('e2e/.last-run.json', JSON.stringify({ projectId, PROJECT, RUN }, null, 2));
  console.log('  created project', projectId, PROJECT);

  // --- Open the Impact Map tool for this project ---
  await page.goto(`/impact-map?projectId=${projectId}`);
  // Start from an empty map so node placeholders are unambiguous.
  await page.getByRole('button', { name: /^Clear$/ }).click();

  // Goal (placeholder is the long help text).
  await page.getByPlaceholder(/A measurable business objective/i).fill(GOAL);
  // Actor -> Impact -> two Deliverables.
  await page.getByRole('button', { name: /Add actor \(Who\)/i }).click();
  await page.getByPlaceholder('Who can help or hinder the goal?').fill(ACTOR);
  await page.getByRole('button', { name: /Add impact \(How\)/i }).click();
  await page.getByPlaceholder('How should their behaviour change?').fill(IMPACT);
  await page.getByRole('button', { name: /Add deliverable \(What\)/i }).click();
  await page.getByRole('button', { name: /Add deliverable \(What\)/i }).click();
  const delivInputs = page.getByPlaceholder('What could we do to support that?');
  await expect(delivInputs).toHaveCount(2);
  await delivInputs.nth(0).fill(DELIV_A);
  await delivInputs.nth(1).fill(DELIV_B);

  // --- Save to Project (dialog preselects this project) ---
  await page.getByRole('button', { name: 'Save to Project' }).click();
  await dialog.getByRole('button', { name: 'Save to Project' }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}`), { timeout: 30_000 });

  // --- Open the saved Impact Map artifact (artifact mode enables Send to Backlog) ---
  await page.getByText(GOAL, { exact: false }).first().click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/artifacts\/[0-9a-f-]+/, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: /Send all to Backlog/i })).toBeVisible();

  // --- Send all deliverables to a NEW backlog ---
  await page.getByRole('button', { name: /Send all to Backlog/i }).click();
  await expect(dialog.getByText('Send to which backlog?')).toBeVisible();
  await dialog.getByText('Create a new backlog').click();
  await dialog.getByPlaceholder(/New backlog name/i).fill(BACKLOG);
  await dialog.getByRole('button', { name: /^Send \d+ items?$/ }).click();
  // Success toast (sonner).
  await expect(page.getByText(/Sent \d+ new item/i)).toBeVisible({ timeout: 20_000 });
  console.log('  sent deliverables to new backlog', BACKLOG);

  // --- The new backlog shows as a card on the project page ---
  await page.goto(`/projects/${projectId}`);
  await expect(page.getByText(BACKLOG, { exact: false }).first()).toBeVisible({ timeout: 20_000 });

  // --- The backlog contains our two deliverables ---
  await page.getByText(BACKLOG, { exact: false }).first().click();
  await expect(page.getByText(DELIV_A, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(DELIV_B, { exact: false }).first()).toBeVisible();
  console.log('  verified both deliverables present in backlog');

  // --- Dedup: re-send the same map to the same backlog -> nothing new ---
  await page.goto(`/projects/${projectId}`);
  await page.getByText(GOAL, { exact: false }).first().click();
  await expect(page).toHaveURL(/\/artifacts\/[0-9a-f-]+/, { timeout: 30_000 });
  await page.getByRole('button', { name: /Send all to Backlog/i }).click();
  await expect(dialog.getByText('Send to which backlog?')).toBeVisible();
  // The existing backlog is preselected (first radio); just confirm.
  await dialog.getByRole('button', { name: /^Send \d+ items?$/ }).click();
  await expect(page.getByText(/already in the backlog|already there/i)).toBeVisible({ timeout: 20_000 });
  console.log('  dedup confirmed: re-send added nothing');
});
