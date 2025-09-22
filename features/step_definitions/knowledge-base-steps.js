import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';
import { KnowledgeBasePage } from '../pages/knowledge-base-page';
import { KnowledgeItemEditorPage } from '../pages/knowledge-item-editor-page';

// Dashboard and Layout Steps
Then('I should see the content studio dashboard', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
});

Then('I should see the navigation sidebar', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
});

Then('I should see knowledge items listed', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="knowledge-items-container"]')).toBeVisible();
  
  // Wait for items to load
  await this.page.waitForSelector('[data-testid="knowledge-item-card"], [data-testid="knowledge-item-row"]', { timeout: 10000 });
});

// View Mode Steps
When('I click on the {string} view button', async function (this: CustomWorld, viewType: string) {
  const knowledgeBasePage = new KnowledgeBasePage(this.page);
  await knowledgeBasePage.switchView(viewType.toLowerCase() as 'cards' | 'table' | 'kanban' | 'analytics');
});

Then('I should see knowledge items displayed as cards', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="knowledge-items-cards"]')).toBeVisible();
});

Then('I should see knowledge items displayed in a table', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="knowledge-items-table"]')).toBeVisible();
});

Then('I should see knowledge items organized in columns by status', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="knowledge-items-kanban"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="kanban-column-draft"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="kanban-column-published"]')).toBeVisible();
});

// Command Palette Steps
Then('the command palette should open', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="command-palette"]')).toBeVisible();
});

When('I type {string}', async function (this: CustomWorld, text: string) {
  await this.page.keyboard.type(text);
});

Then('I should see create options in the command palette', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="command-palette"] text=create')).toBeVisible();
});

When('I select {string}', async function (this: CustomWorld, option: string) {
  await this.page.locator(`text=${option}`).click();
});

// CRUD Operations
When('I click the {string} button', async function (this: CustomWorld, buttonText: string) {
  await this.page.locator(`button:has-text("${buttonText}")`).click();
});

When('I fill in the basic information:', async function (this: CustomWorld, dataTable) {
  const knowledgeBasePage = new KnowledgeBasePage(this.page);
  const data = dataTable.rowsHash();
  
  await knowledgeBasePage.fillBasicInformation(data);
});

When('I add content to the knowledge item', async function (this: CustomWorld) {
  const knowledgeBasePage = new KnowledgeBasePage(this.page);
  await knowledgeBasePage.addContent('This is test content for the knowledge item.');
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.locator(`button:has-text("${buttonText}")`).click();
});

Then('I should see a success message', async function (this: CustomWorld) {
  await expect(this.page.locator('.toast, [data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
});

Then('the knowledge item should appear in the list', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="knowledge-item-card"]:has-text("Test Knowledge Item")')).toBeVisible();
});

// Search and Filter Steps
When('I enter {string} in the search field', async function (this: CustomWorld, searchTerm: string) {
  const knowledgeBasePage = new KnowledgeBasePage(this.page);
  await knowledgeBasePage.search(searchTerm);
});

Then('I should see only knowledge items containing {string}', async function (this: CustomWorld, searchTerm: string) {
  const results = this.page.locator('[data-testid="knowledge-item-card"], [data-testid="knowledge-item-row"]');
  await expect(results.first()).toBeVisible();
  
  // Verify all visible results contain the search term
  const count = await results.count();
  for (let i = 0; i < count; i++) {
    await expect(results.nth(i)).toContainText(searchTerm, { ignoreCase: true });
  }
});

// Editor Steps
Given('I open the knowledge item editor', async function (this: CustomWorld) {
  await this.page.goto('/admin/knowledge-items/create');
  await this.page.waitForLoadState('networkidle');
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

When('I am on the {string} step', async function (this: CustomWorld, stepName: string) {
  await expect(this.page.locator(`[data-testid="step-${stepName.toLowerCase().replace(/\s+/g, '-')}"]`)).toBeVisible();
});

Then('I should see fields for name, description, and summary', async function (this: CustomWorld) {
  await expect(this.page.locator('input[name="name"]')).toBeVisible();
  await expect(this.page.locator('textarea[name="description"]')).toBeVisible();
  await expect(this.page.locator('textarea[name="summary"]')).toBeVisible();
});

// Test Data Setup Steps
Given('there is a knowledge item named {string}', async function (this: CustomWorld, itemName: string) {
  // This would typically involve setting up test data
  // For now, we'll assume the item exists or create it via API
  console.log(`Setting up test data for knowledge item: ${itemName}`);
});

Given('there are multiple knowledge items in the system', async function (this: CustomWorld) {
  // Setup multiple test items
  console.log('Setting up multiple knowledge items for testing');
});

// Validation Steps
Then('I should see validation error messages', async function (this: CustomWorld) {
  await expect(this.page.locator('.error-message, [data-testid="validation-error"]')).toBeVisible();
});

Then('the knowledge item should not be created', async function (this: CustomWorld) {
  // Verify we're still on the creation page and no success message appeared
  await expect(this.page).toHaveURL(/create/);
  await expect(this.page.locator('.toast')).not.toBeVisible();
});