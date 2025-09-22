import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';

// Common UI interaction steps
When('I click on {string}', async function (this: CustomWorld, elementText: string) {
  await this.page.locator(`text=${elementText}`).click();
});

When('I click the button {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.locator(`button:has-text("${buttonText}")`).click();
});

When('I fill in {string} with {string}', async function (this: CustomWorld, fieldName: string, value: string) {
  await this.page.fill(`input[name="${fieldName}"], textarea[name="${fieldName}"]`, value);
});

When('I select {string} from {string}', async function (this: CustomWorld, option: string, fieldName: string) {
  await this.page.selectOption(`select[name="${fieldName}"]`, option);
});

When('I check the {string} checkbox', async function (this: CustomWorld, checkboxName: string) {
  await this.page.check(`input[name="${checkboxName}"]`);
});

When('I uncheck the {string} checkbox', async function (this: CustomWorld, checkboxName: string) {
  await this.page.uncheck(`input[name="${checkboxName}"]`);
});

// Common assertion steps
Then('I should see {string}', async function (this: CustomWorld, text: string) {
  await expect(this.page.locator(`text=${text}`)).toBeVisible();
});

Then('I should not see {string}', async function (this: CustomWorld, text: string) {
  await expect(this.page.locator(`text=${text}`)).not.toBeVisible();
});

Then('I should see the {string} field', async function (this: CustomWorld, fieldName: string) {
  await expect(this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`)).toBeVisible();
});

Then('the {string} field should be required', async function (this: CustomWorld, fieldName: string) {
  await expect(this.page.locator(`input[name="${fieldName}"][required], textarea[name="${fieldName}"][required]`)).toBeVisible();
});

Then('I should see a loading spinner', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="loading-spinner"], .spinner, .loading')).toBeVisible();
});

Then('I should not see a loading spinner', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="loading-spinner"], .spinner, .loading')).not.toBeVisible();
});

// Modal and dialog steps
Then('I should see a modal', async function (this: CustomWorld) {
  await expect(this.page.locator('[role="dialog"], .modal')).toBeVisible();
});

Then('I should not see a modal', async function (this: CustomWorld) {
  await expect(this.page.locator('[role="dialog"], .modal')).not.toBeVisible();
});

When('I close the modal', async function (this: CustomWorld) {
  await this.page.keyboard.press('Escape');
  // Or click close button if escape doesn't work
  await this.page.locator('[data-testid="close-modal"], .modal-close').click().catch(() => {});
});

// Form steps
When('I submit the form', async function (this: CustomWorld) {
  await this.page.locator('form button[type="submit"]').click();
});

When('I reset the form', async function (this: CustomWorld) {
  await this.page.locator('form button[type="reset"]').click();
});

// Navigation steps
When('I go back', async function (this: CustomWorld) {
  await this.page.goBack();
});

When('I refresh the page', async function (this: CustomWorld) {
  await this.page.reload();
});

// Waiting steps
When('I wait for {int} seconds', async function (this: CustomWorld, seconds: number) {
  await this.page.waitForTimeout(seconds * 1000);
});

When('I wait for the page to load', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
});

// Data table helpers
When('I fill in the form with:', async function (this: CustomWorld, dataTable) {
  const data = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(data)) {
    await this.page.fill(`input[name="${field}"], textarea[name="${field}"]`, value as string);
  }
});

// Responsive design steps
Given('I am using a mobile device', async function (this: CustomWorld) {
  await this.page.setViewportSize({ width: 375, height: 667 });
});

Given('I am using a tablet device', async function (this: CustomWorld) {
  await this.page.setViewportSize({ width: 768, height: 1024 });
});

Given('I am using a desktop device', async function (this: CustomWorld) {
  await this.page.setViewportSize({ width: 1280, height: 720 });
});

// Error handling steps
Then('I should see an error message', async function (this: CustomWorld) {
  await expect(this.page.locator('.error, [data-testid="error-message"], .alert-error')).toBeVisible();
});

Then('I should see an error message containing {string}', async function (this: CustomWorld, errorText: string) {
  await expect(this.page.locator(`.error:has-text("${errorText}"), [data-testid="error-message"]:has-text("${errorText}")`)).toBeVisible();
});