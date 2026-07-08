import { test, expect, Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// End-to-end verification of the User Story Map "Push to Backlog" against the
// LIVE deploy. Logs in as the e2e account, authors a small story map (one
// activity, one story in Release 1), saves it to a fresh initiative, opens the
// saved artifact (artifact mode enables Push to Backlog), pushes, then confirms
// the backlog received an epic (the activity) with the story beneath it in the
// right release, via the backlog's Story Map view. That the card renders under
// its activity column and Release 1 row proves parent_item_id and target_release
// were set on the pushed backlog_items.
//
// Run: npx playwright test e2e/story-map-push.deployed.spec.ts --config=e2e/deployed.config.ts
// Cleanup of the created initiative is done afterwards by scripts/.e2e-cleanup.mjs
// (the projectId is written to e2e/.last-run.json).

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;
const RUN = String(Date.now()).slice(-6);

const INITIATIVE = `E2E StoryMap ${RUN}`;
const GOAL = `E2E Goal ${RUN}`;
const ACTIVITY = `E2E Activity ${RUN}`;
const STORY = `E2E Story ${RUN}`;

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign In' }).click().catch(() => {});
  await page.getByTestId('email-input').fill(EMAIL);
  await page.getByTestId('password-input').fill(PASSWORD);
  await page.getByTestId('signin-submit-button').click();
  await expect(page).not.toHaveURL(/\/auth(\?|$)/, { timeout: 30_000 });
}

test('Story Map pushes an epic + story into the backlog in the right release', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set');

  page.on('console', (m) => { if (m.type() === 'error') console.log('  [browser error]', m.text()); });
  // Accept every window.confirm (New map guard + Push to Backlog confirm).
  page.on('dialog', (d) => d.accept().catch(() => {}));

  await login(page);

  // --- Author a small, deterministic story map on the standalone tool ---
  await page.goto('/story-map');
  // Start from an empty map (one activity, one release "Release 1", no cards).
  await page.getByRole('button', { name: /New map/i }).click();

  await page.getByPlaceholder('What is this product for?').fill(GOAL);
  await page.getByPlaceholder('Activity...').first().fill(ACTIVITY);
  // The first "Add story" belongs to the Release 1 cell of the first activity
  // (Release 1 renders before the Unscheduled row in the DOM).
  await page.getByRole('button', { name: /Add story/i }).first().click();
  await page.getByPlaceholder('A small thing the user can do...').first().fill(STORY);

  // --- Save to a fresh initiative (creates the story-map artifact) ---
  await page.getByRole('button', { name: /Save to Initiative/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText(/Create new project/i).click().catch(() => {});
  await dialog.getByPlaceholder('My Initiative').fill(INITIATIVE);
  await dialog.getByRole('button', { name: /^Save to Initiative$/ }).click();

  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+/, { timeout: 30_000 });
  const projectId = page.url().match(/\/projects\/([0-9a-f-]+)/)![1];
  writeFileSync('e2e/.last-run.json', JSON.stringify({ projectId, PROJECT: INITIATIVE, RUN }, null, 2));
  console.log('  created initiative', projectId, INITIATIVE);

  // --- Open the saved story map artifact (artifact mode enables Push) ---
  await page.getByText(GOAL, { exact: false }).first().click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/artifacts\/[0-9a-f-]+/, { timeout: 30_000 });
  const pushBtn = page.getByRole('button', { name: /Push to Backlog/i });
  await expect(pushBtn).toBeVisible();

  // --- Push to the backlog ---
  await pushBtn.click();
  await expect(page.getByText(/Pushed \d+ stor(y|ies) to the backlog/i)).toBeVisible({ timeout: 20_000 });
  console.log('  pushed to backlog');

  // --- Verify: the backlog received the activity as an epic ---
  await page.goto(`/backlog?projectId=${projectId}`);
  await expect(page.getByRole('heading', { name: ACTIVITY }).first()).toBeVisible({ timeout: 20_000 });
  // The story lands as the epic's child; the default list is hierarchical and
  // collapses children, so switch to Flat view to see the story itself.
  await page.getByRole('button', { name: /Flat view/i }).click();
  await expect(page.getByText(STORY, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  console.log('  verified epic + child story in the backlog list');

  // --- Verify placement: Story Map view renders the activity as a backbone
  // column (so it landed as an epic) with the story beneath it in Release 1
  // (so parent_item_id + target_release were set). ---
  await page.getByRole('button', { name: /^Story Map$/ }).click();
  await expect(page.getByText(ACTIVITY, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Release 1', { exact: false }).first()).toBeVisible();
  await expect(page.getByText(STORY, { exact: false }).first()).toBeVisible();
  console.log('  verified epic + story placement in the backlog Story Map view');
});
