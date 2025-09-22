import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';
import { KnowledgeBasePage } from '../pages/knowledge-base-page';

// Content management specific steps
When('I fill in the basic information', async function (this: CustomWorld) {
  const editorPage = new KnowledgeItemEditorPage(this.page);
  await editorPage.fillBasicInformation({
    name: 'Test Knowledge Item',
    description: 'Test description for BDD testing'
  });
});

When('I add content to the knowledge item', async function (this: CustomWorld) {
  const editorPage = new KnowledgeItemEditorPage(this.page);
  await editorPage.fillRichTextEditor('This is test content for the knowledge item.');
});

Then('I should see a success message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="success-message"], .toast, text=Success')).toBeVisible({ timeout: 10000 });
});

Then('the knowledge item should appear in the list', async function (this: CustomWorld) {
  const knowledgePage = new KnowledgeBasePage(this.page);
  await knowledgePage.openContentStudioDashboard();
  
  // Should see the created item
  await expect(this.page.locator('text=Test Knowledge Item')).toBeVisible();
});

When('I click the {string} button', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

Then('I should see only knowledge items containing {string}', async function (this: CustomWorld, searchTerm: string) {
  // Wait for search results
  await this.page.waitForLoadState('networkidle');
  
  // All visible items should contain the search term
  const itemTexts = await this.page.locator('[data-testid="knowledge-item-card"] h4, tbody tr td:first-child').allTextContents();
  const visibleItems = itemTexts.filter(text => text.trim().length > 0);
  
  for (const itemText of visibleItems) {
    expect(itemText.toLowerCase()).toContain(searchTerm.toLowerCase());
  }
});

// Validation steps
Then('I should see validation error messages', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="validation-errors"], .error-message')).toBeVisible();
});

Then('the knowledge item should not be created', async function (this: CustomWorld) {
  // Should still be on the editor page, not redirected
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

// Additional CRUD operations
Given('I have created a knowledge item', async function (this: CustomWorld) {
  const editorPage = new KnowledgeItemEditorPage(this.page);
  await editorPage.openNewItemEditor();
  await editorPage.fillBasicInformation({
    name: 'BDD Test Item',
    description: 'Created for BDD testing purposes'
  });
  await editorPage.saveDraft();
});

When('I edit the knowledge item', async function (this: CustomWorld) {
  await this.page.click('text=BDD Test Item');
  const editorPage = new KnowledgeItemEditorPage(this.page);
  await editorPage.fillBasicInformation({
    name: 'Updated BDD Test Item',
    description: 'Updated description'
  });
});

When('I delete the knowledge item', async function (this: CustomWorld) {
  // Find and click delete button
  const deleteButton = this.page.locator('[data-testid="delete-item"], button:has-text("Delete")').first();
  await deleteButton.click();
  
  // Confirm deletion
  await this.page.click('button:has-text("Confirm")');
});

Then('the knowledge item should be updated', async function (this: CustomWorld) {
  await expect(this.page.locator('text=Updated BDD Test Item')).toBeVisible();
});

Then('the knowledge item should be removed from the list', async function (this: CustomWorld) {
  await expect(this.page.locator('text=BDD Test Item')).not.toBeVisible({ timeout: 5000 });
});

// Bulk operations
Given('I have selected multiple knowledge items', async function (this: CustomWorld) {
  const knowledgePage = new KnowledgeBasePage(this.page);
  await knowledgePage.selectMultipleItems(['Test Item 1', 'Test Item 2']);
});

When('I perform bulk {string} operation', async function (this: CustomWorld, operation: string) {
  const knowledgePage = new KnowledgeBasePage(this.page);
  await knowledgePage.performBulkAction(operation.toLowerCase());
});

Then('all selected items should be {string}', async function (this: CustomWorld, status: string) {
  // Check that items have the expected status
  await expect(this.page.locator(`text=${status}`)).toHaveCount({ min: 1 });
});