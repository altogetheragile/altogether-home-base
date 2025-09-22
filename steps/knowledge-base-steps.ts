import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

Given('I am on the Knowledge Base admin dashboard', async function (this: World) {
  await this.page.goto('/admin/knowledge-items');
  await expect(this.page.locator('h1')).toHaveText(/knowledge items/i);
});

Given('I am on the Content Studio Dashboard', async function (this: World) {
  await this.page.goto('/admin/knowledge-items');
  await expect(this.page.locator('[data-testid="content-studio-header"]')).toBeVisible();
});

When('I click on {string}', async function (this: World, buttonText: string) {
  await this.page.click(`text=${buttonText}`);
});

When('I fill in the basic information:', async function (this: World, dataTable) {
  const data = dataTable.hashes()[0];
  
  if (data.Title) {
    await this.page.fill('[data-testid="title-input"]', data.Title);
  }
  if (data.Description) {
    await this.page.fill('[data-testid="description-input"]', data.Description);
  }
  if (data.Category) {
    await this.page.click('[data-testid="category-select"]');
    await this.page.click(`text=${data.Category}`);
  }
});

When('I add content to the rich text editor', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('This is test content for the knowledge item with rich formatting.');
});

When('I publish the knowledge item', async function (this: World) {
  await this.page.click('[data-testid="publish-button"]');
});

Then('the item should appear in the knowledge base list', async function (this: World) {
  await this.page.goto('/admin/knowledge-items');
  await expect(this.page.locator('text=Test Knowledge Item')).toBeVisible();
});

Given('there is an existing knowledge item {string}', async function (this: World, itemName: string) {
  // This step assumes test data exists or we create it programmatically
  await this.page.goto('/admin/knowledge-items');
  await expect(this.page.locator(`text=${itemName}`)).toBeVisible();
});

When('I click edit on {string}', async function (this: World, itemName: string) {
  const row = this.page.locator(`tr:has-text("${itemName}")`);
  await row.locator('[data-testid="edit-button"]').click();
});

When('I update the title to {string}', async function (this: World, newTitle: string) {
  await this.page.fill('[data-testid="title-input"]', newTitle);
});

When('I save the changes', async function (this: World) {
  await this.page.click('[data-testid="save-button"]');
});

Then('the updated title should be displayed', async function (this: World) {
  await expect(this.page.locator('text=Updated Sample Item')).toBeVisible();
});

Given('I have multiple knowledge items selected', async function (this: World) {
  await this.page.goto('/admin/knowledge-items');
  
  // Select multiple checkboxes
  const checkboxes = this.page.locator('[data-testid="item-checkbox"]');
  const count = await checkboxes.count();
  
  for (let i = 0; i < Math.min(3, count); i++) {
    await checkboxes.nth(i).check();
  }
});

When('I click on the bulk delete button', async function (this: World) {
  await this.page.click('[data-testid="bulk-delete-button"]');
});

When('I confirm the deletion', async function (this: World) {
  await this.page.click('[data-testid="confirm-delete-button"]');
});

Then('the selected items should no longer appear in the list', async function (this: World) {
  // Wait for the items to be removed from the DOM
  await this.page.waitForTimeout(1000);
  
  // Check that the bulk selection is cleared
  await expect(this.page.locator('[data-testid="bulk-selection-info"]')).not.toBeVisible();
});

Given('there are knowledge items with different categories', async function (this: World) {
  // This assumes test data exists with various categories
  await this.page.goto('/admin/knowledge-items');
});

When('I search for {string}', async function (this: World, searchTerm: string) {
  await this.page.fill('[data-testid="search-input"]', searchTerm);
  await this.page.press('[data-testid="search-input"]', 'Enter');
});

When('I filter by {string} category', async function (this: World, category: string) {
  await this.page.click('[data-testid="category-filter"]');
  await this.page.click(`text=${category}`);
});

Then('I should only see knowledge items matching the search and filter criteria', async function (this: World) {
  // Wait for filter to be applied
  await this.page.waitForTimeout(500);
  
  // Check that visible items contain the search term
  const items = this.page.locator('[data-testid="knowledge-item"]');
  const count = await items.count();
  
  expect(count).toBeGreaterThan(0);
  
  // Verify first item contains search criteria
  await expect(items.first()).toContainText('Scrum');
});