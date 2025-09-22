import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

Given('I am on the knowledge item creation page', async function (this: World) {
  await this.page.goto('/admin/create-knowledge-item');
  await expect(this.page.locator('h1')).toHaveText(/create knowledge item/i);
});

When('I fill in the basic information step:', async function (this: World, dataTable) {
  const data = dataTable.hashes()[0];
  
  if (data.Title) {
    await this.page.fill('[data-testid="title-input"]', data.Title);
  }
  if (data.Description) {
    await this.page.fill('[data-testid="description-textarea"]', data.Description);
  }
});

When('I proceed to the content step', async function (this: World) {
  await this.page.click('[data-testid="next-step-button"]');
  await expect(this.page.locator('[data-testid="content-step"]')).toBeVisible();
});

When('I add rich text content with formatting', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.fill('This is a comprehensive guide with formatted content.');
  
  // Add some formatting
  await editor.press('Control+a');
  await this.page.click('[data-testid="bold-button"]');
});

When('I proceed to the classification step', async function (this: World) {
  await this.page.click('[data-testid="next-step-button"]');
  await expect(this.page.locator('[data-testid="classification-step"]')).toBeVisible();
});

When('I select category {string}', async function (this: World, category: string) {
  await this.page.click('[data-testid="category-select"]');
  await this.page.click(`text=${category}`);
});

When('I add tags {string}', async function (this: World, tags: string) {
  const tagInput = this.page.locator('[data-testid="tags-input"]');
  const tagList = tags.split(', ');
  
  for (const tag of tagList) {
    await tagInput.fill(tag);
    await tagInput.press('Enter');
  }
});

When('I proceed to the publication step', async function (this: World) {
  await this.page.click('[data-testid="next-step-button"]');
  await expect(this.page.locator('[data-testid="publication-step"]')).toBeVisible();
});

When('I set the status to {string}', async function (this: World, status: string) {
  await this.page.click('[data-testid="status-select"]');
  await this.page.click(`text=${status}`);
  
  // Save the knowledge item
  await this.page.click('[data-testid="save-knowledge-item"]');
});

Given('I am editing a knowledge item', async function (this: World) {
  // Navigate to edit an existing item or create a new one
  await this.page.goto('/admin/knowledge-items');
  await this.page.click('[data-testid="first-item-edit"]');
  await expect(this.page.locator('[data-testid="rich-text-editor"]')).toBeVisible();
});

When('I add a heading {string}', async function (this: World, headingText: string) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.click();
  await editor.type(headingText);
  
  // Select the text and make it a heading
  await editor.press('Control+a');
  await this.page.click('[data-testid="heading-button"]');
});

When('I add a bulleted list with three items', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.press('Enter');
  await this.page.click('[data-testid="bullet-list-button"]');
  
  await editor.type('First list item');
  await editor.press('Enter');
  await editor.type('Second list item');
  await editor.press('Enter');
  await editor.type('Third list item');
});

When('I insert a link to {string}', async function (this: World, url: string) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.press('Enter');
  await editor.type('Visit our website');
  
  // Select the text for linking
  await editor.press('Shift+Control+Left');
  await this.page.click('[data-testid="link-button"]');
  
  // Fill in the link URL
  await this.page.fill('[data-testid="link-url-input"]', url);
  await this.page.click('[data-testid="apply-link-button"]');
});

When('I upload an image to the content', async function (this: World) {
  await this.page.click('[data-testid="image-upload-button"]');
  
  // Simulate file upload (in a real test, you'd upload an actual file)
  await this.page.setInputFiles('[data-testid="file-input"]', 'test-data/test-image.jpg');
  await this.page.click('[data-testid="upload-confirm-button"]');
});

When('I save the content', async function (this: World) {
  await this.page.click('[data-testid="save-content-button"]');
});

Then('the content should be saved with all formatting preserved', async function (this: World) {
  await expect(this.page.locator('text=Content saved successfully')).toBeVisible();
  
  // Verify formatting is preserved
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await expect(editor.locator('h2')).toHaveText('Main Concept');
  await expect(editor.locator('ul li')).toHaveCount(3);
  await expect(editor.locator('a')).toHaveAttribute('href', 'https://example.com');
});

When('I click {string}', async function (this: World, buttonText: string) {
  await this.page.click(`text=${buttonText}`);
});

When('I select {string}', async function (this: World, templateName: string) {
  await this.page.click(`text=${templateName}`);
  await this.page.click('[data-testid="select-template-button"]');
});

Then('the form should be pre-filled with template content', async function (this: World) {
  // Check that template content is loaded
  await expect(this.page.locator('[data-testid="title-input"]')).not.toHaveValue('');
  await expect(this.page.locator('[data-testid="description-textarea"]')).not.toHaveValue('');
});

Then('I should be able to customize the template content', async function (this: World) {
  // Modify the pre-filled content
  await this.page.fill('[data-testid="title-input"]', 'Customized Template Title');
  
  // Verify the change was applied
  await expect(this.page.locator('[data-testid="title-input"]')).toHaveValue('Customized Template Title');
});

When('I save the item', async function (this: World) {
  await this.page.click('[data-testid="save-final-button"]');
});

Then('it should be created with the template structure', async function (this: World) {
  await expect(this.page.locator('text=Knowledge item created successfully')).toBeVisible();
});

Given('I am editing knowledge item content', async function (this: World) {
  await this.page.goto('/admin/knowledge-items');
  await this.page.click('[data-testid="first-item-edit"]');
  
  // Navigate to content step if needed
  await this.page.click('[data-testid="content-tab"]');
  await expect(this.page.locator('[data-testid="rich-text-editor"]')).toBeVisible();
});

When('I add content to the editor', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.fill('Live preview test content with **bold text**.');
});

Then('I should see the content rendered in the live preview panel', async function (this: World) {
  const preview = this.page.locator('[data-testid="live-preview-panel"]');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('Live preview test content');
});

When('I change the content formatting', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
  await editor.press('Control+a');
  await this.page.click('[data-testid="italic-button"]');
});

Then('the preview should update in real-time', async function (this: World) {
  const preview = this.page.locator('[data-testid="live-preview-panel"]');
  
  // Wait for the preview to update
  await this.page.waitForTimeout(500);
  
  // Check for italic formatting in preview
  await expect(preview.locator('em, i')).toBeVisible();
});