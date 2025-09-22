import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';

// Editor navigation steps
Given('I open the knowledge item editor', async function (this: CustomWorld) {
  await this.page.goto('/admin/knowledge/items/new');
  await this.page.waitForLoadState('networkidle');
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

When('I am on the {string} step', async function (this: CustomWorld, stepName: string) {
  const stepMap: Record<string, string> = {
    'Basic Information': '[data-testid="step-basic-info"]',
    'Content': '[data-testid="step-content"]',
    'Classification': '[data-testid="step-classification"]',
    'Use Cases': '[data-testid="step-use-cases"]',
    'Enhanced': '[data-testid="step-enhanced"]',
    'Publication': '[data-testid="step-publication"]',
  };
  
  const selector = stepMap[stepName];
  if (selector) {
    await expect(this.page.locator(selector)).toBeVisible();
  }
});

Then('I should see fields for name, description, and summary', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="field-name"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="field-description"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="field-summary"]')).toBeVisible();
});

When('I click {string} to go to {string} step', async function (this: CustomWorld, buttonText: string, stepName: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
  
  const stepMap: Record<string, string> = {
    'Content': '[data-testid="step-content"]',
    'Classification': '[data-testid="step-classification"]',
    'Use Cases': '[data-testid="step-use-cases"]',
  };
  
  const selector = stepMap[stepName];
  if (selector) {
    await expect(this.page.locator(selector)).toBeVisible();
  }
});

Then('I should see the rich text editor for content', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="rich-text-editor"]')).toBeVisible();
});

Then('I should see category and tag selection fields', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="category-select"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="tags-input"]')).toBeVisible();
});

Then('I should see use case management interface', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="use-case-manager"]')).toBeVisible();
});

// Validation steps
When('I try to proceed without entering a name', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Next")');
});

Then('I should see a validation error for the name field', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="name-error"]')).toBeVisible();
});

Then('I should not be able to proceed to the next step', async function (this: CustomWorld) {
  // Should still be on the same step
  await expect(this.page.locator('[data-testid="step-basic-info"]')).toBeVisible();
});

When('I enter a name {string}', async function (this: CustomWorld, name: string) {
  await this.page.fill('[data-testid="field-name"]', name);
});

When('I enter a description {string}', async function (this: CustomWorld, description: string) {
  await this.page.fill('[data-testid="field-description"]', description);
});

Then('I should be able to proceed to the next step', async function (this: CustomWorld) {
  const nextButton = this.page.locator('button:has-text("Next")');
  await expect(nextButton).toBeEnabled();
});

// Content editing steps
Given('I complete the basic information step', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="field-name"]', 'Test Knowledge Item');
  await this.page.fill('[data-testid="field-description"]', 'Test description');
  await this.page.click('button:has-text("Next")');
});

Given('I complete the basic information and content steps', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="field-name"]', 'Test Knowledge Item');
  await this.page.fill('[data-testid="field-description"]', 'Test description');
  await this.page.click('button:has-text("Next")');
  
  // Add content
  await this.page.fill('[data-testid="rich-text-editor"] .ProseMirror', 'Test content');
  await this.page.click('button:has-text("Next")');
});

When('I add formatted text with headings and lists', async function (this: CustomWorld) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.fill('# Heading 1\n\n## Heading 2\n\n- List item 1\n- List item 2');
});

When('I insert an image into the content', async function (this: CustomWorld) {
  await this.page.click('[data-testid="toolbar-image"]');
  // Handle image insertion dialog
  await this.page.fill('[data-testid="image-url"]', 'https://example.com/image.jpg');
  await this.page.click('[data-testid="insert-image"]');
});

When('I add a link to external resource', async function (this: CustomWorld) {
  await this.page.click('[data-testid="toolbar-link"]');
  await this.page.fill('[data-testid="link-url"]', 'https://example.com');
  await this.page.fill('[data-testid="link-text"]', 'Example Link');
  await this.page.click('[data-testid="insert-link"]');
});

Then('the content should be properly formatted in the preview', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-preview"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="content-preview"] h1')).toBeVisible();
});

Then('all formatting should be preserved', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-preview"] ul')).toBeVisible();
  await expect(this.page.locator('[data-testid="content-preview"] a')).toBeVisible();
});

// Classification steps
When('I select {string} as the category', async function (this: CustomWorld, category: string) {
  await this.page.click('[data-testid="category-select"]');
  await this.page.click(`text=${category}`);
});

When('I select {string} as the level', async function (this: CustomWorld, level: string) {
  await this.page.click('[data-testid="level-select"]');
  await this.page.click(`text=${level}`);
});

When('I add tags {string}', async function (this: CustomWorld, tags: string) {
  const tagArray = tags.split(', ');
  for (const tag of tagArray) {
    await this.page.fill('[data-testid="tags-input"]', tag);
    await this.page.keyboard.press('Enter');
  }
});

When('I select {string} as the planning focus', async function (this: CustomWorld, focus: string) {
  await this.page.click('[data-testid="planning-focus-select"]');
  await this.page.click(`text=${focus}`);
});

Then('all classification data should be saved with the item', async function (this: CustomWorld) {
  // Should show selected classifications in the form
  await expect(this.page.locator('[data-testid="selected-category"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="selected-tags"]')).toBeVisible();
});

// Use cases steps
Given('I complete previous steps', async function (this: CustomWorld) {
  // Complete basic info
  await this.page.fill('[data-testid="field-name"]', 'Test Knowledge Item');
  await this.page.fill('[data-testid="field-description"]', 'Test description');
  await this.page.click('button:has-text("Next")');
  
  // Complete content
  await this.page.fill('[data-testid="rich-text-editor"] .ProseMirror', 'Test content');
  await this.page.click('button:has-text("Next")');
  
  // Complete classification
  await this.page.click('button:has-text("Next")');
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

When('I fill in the use case details:', async function (this: CustomWorld, dataTable) {
  const data = dataTable.hashes()[0];
  
  await this.page.fill('[data-testid="use-case-title"]', data.Title);
  await this.page.fill('[data-testid="use-case-description"]', data.Description);
  await this.page.fill('[data-testid="use-case-context"]', data.Context);
  await this.page.fill('[data-testid="use-case-outcome"]', data.Outcome);
  
  await this.page.click('[data-testid="save-use-case"]');
});

Then('the use case should be added to the list', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="use-case-list"]')).toContainText('Sprint Planning Meeting');
});

Then('I should be able to add more use cases', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="add-use-case-button"]')).toBeEnabled();
});

// Template steps
When('I click on {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

Then('the knowledge item should be populated with template content', async function (this: CustomWorld) {
  // Check that template content has been loaded
  await expect(this.page.locator('[data-testid="field-name"]')).not.toHaveValue('');
});

Then('I should see template-specific fields', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="template-fields"]')).toBeVisible();
});

Then('I should be able to customize the template content', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="field-name"]')).toBeEnabled();
});

// Save and publish steps
Given('I have filled out a knowledge item in the editor', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="field-name"]', 'Complete Test Item');
  await this.page.fill('[data-testid="field-description"]', 'Complete description');
});

Given('I have a complete knowledge item in the editor', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="field-name"]', 'Complete Test Item');
  await this.page.fill('[data-testid="field-description"]', 'Complete description');
  // Add all required fields
});

Then('the item should be saved with draft status', async function (this: CustomWorld) {
  await expect(this.page.locator('text=Draft saved')).toBeVisible();
});

Then('the item should be saved with published status', async function (this: CustomWorld) {
  await expect(this.page.locator('text=Published successfully')).toBeVisible();
});

Then('it should appear in the public knowledge base', async function (this: CustomWorld) {
  // Navigate to public knowledge base and verify item is there
  await this.page.goto('/knowledge');
  await expect(this.page.locator('text=Complete Test Item')).toBeVisible();
});

Then('I should see a success message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
});

Then('I should be able to continue editing later', async function (this: CustomWorld) {
  // Should be able to return to editor
  await expect(this.page.locator('[data-testid="continue-editing"]')).toBeVisible();
});

// Preview steps
Given('I am editing a knowledge item', async function (this: CustomWorld) {
  await this.page.goto('/admin/knowledge/items/new');
  await this.page.fill('[data-testid="field-name"]', 'Preview Test Item');
  await this.page.fill('[data-testid="field-description"]', 'Preview description');
});

When('I click the {string} button', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

Then('I should see how the item will appear to end users', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="public-preview"]')).toBeVisible();
});

Then('all formatting and content should display correctly', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="public-preview"]')).toContainText('Preview Test Item');
});

Then('I should be able to return to editing mode', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="return-to-editor"]')).toBeVisible();
});

// Validation before publishing
When('I try to publish without completing required fields', async function (this: CustomWorld) {
  // Clear required fields
  await this.page.fill('[data-testid="field-name"]', '');
  await this.page.click('button:has-text("Publish")');
});

Then('I should see validation errors highlighting missing fields', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="validation-errors"]')).toBeVisible();
});

Then('the publish action should be prevented', async function (this: CustomWorld) {
  // Should still be in editor, not published
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

Then('I should see guidance on what needs to be completed', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="completion-guidance"]')).toBeVisible();
});

// Auto-save steps
When('I make changes to the content', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="field-description"]', 'Updated description');
});

When('I wait for a few seconds', async function (this: CustomWorld) {
  await this.page.waitForTimeout(3000);
});

Then('the changes should be automatically saved as draft', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();
});

Then('I should see an {string} indicator', async function (this: CustomWorld, indicatorText: string) {
  await expect(this.page.locator(`text=${indicatorText}`)).toBeVisible();
});