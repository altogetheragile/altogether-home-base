import { test, expect, Page } from '@playwright/test';

// End-to-end check of Flow Game "save and resume" against the live database.
// Logs in as the e2e account, starts a game, saves it, reloads (losing the
// in-memory game), resumes it from the saved-games list, then deletes the save.
// The delete is both the last assertion and the cleanup, so it leaves no residue.
//
// Run against prod:  npx playwright test e2e/flow-game-save.deployed.spec.ts --config=e2e/deployed.config.ts
// Run against local: E2E_BASE_URL=http://localhost:5199 npx playwright test e2e/flow-game-save.deployed.spec.ts --config=e2e/deployed.config.ts

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;
const RUN = String(Date.now()).slice(-6);
const NAME = `E2E Save ${RUN}`;

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign In' }).click().catch(() => {});
  await page.getByTestId('email-input').fill(EMAIL);
  await page.getByTestId('password-input').fill(PASSWORD);
  await page.getByTestId('signin-submit-button').click();
  await expect(page).not.toHaveURL(/\/auth(\?|$)/, { timeout: 30_000 });
}

test('Flow Game: save, resume after reload, then delete', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set');
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [browser error]', m.text()); });

  await login(page);

  // --- Start a game and save it ---
  await page.goto('/flow-game');
  await page.getByRole('button', { name: /^Start Round 1$/ }).click();
  await expect(page.getByRole('heading', { name: /Round 1 - Day 1/ })).toBeVisible();

  await page.getByRole('button', { name: /^Save$/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder(/Workshop demo/i).fill(NAME);
  await dialog.getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByText(/Game saved/i)).toBeVisible({ timeout: 20_000 });
  console.log('  saved game', NAME);

  // --- Reload (loses the in-memory game), then resume from the saved list ---
  await page.goto('/flow-game');
  await expect(page.getByRole('heading', { name: /Kanban Flow Simulation/ })).toBeVisible();
  await page.getByRole('button', { name: /Resume a saved game/i }).click();
  const savesDialog = page.getByRole('dialog');
  await expect(savesDialog.getByText(NAME)).toBeVisible({ timeout: 20_000 });
  await savesDialog.getByRole('button', { name: /Resume/i }).first().click();
  await expect(page.getByRole('heading', { name: /Round 1 - Day 1/ })).toBeVisible({ timeout: 20_000 });
  console.log('  resumed game from save');

  // --- Delete the save (last assertion + cleanup) ---
  await page.goto('/flow-game');
  await page.getByRole('button', { name: /Resume a saved game/i }).click();
  const d2 = page.getByRole('dialog');
  await expect(d2.getByText(NAME)).toBeVisible({ timeout: 20_000 });
  await d2.getByRole('button', { name: `Delete ${NAME}` }).click();
  await expect(page.getByText(/Saved game deleted/i)).toBeVisible({ timeout: 20_000 });
  await expect(d2.getByText(NAME)).toHaveCount(0);
  console.log('  deleted save');
});
