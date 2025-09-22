import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

// Helper to get base URL
const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:5173';

// ===== KNOWLEDGE ITEM EDITOR NAVIGATION =====

Given('I open the knowledge item editor', async function (this: World) {
  await this.page.goto(`${getBaseUrl()}/admin/knowledge-items/create`);
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

Given('I am on the knowledge item creation page', async function (this: World) {
  await this.page.goto(`${getBaseUrl()}/admin/knowledge-items/create`);
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

Given('I am editing a knowledge item', async function (this: World) {
  // Assume we're on an edit page or in editor mode
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

Given('I have filled out a knowledge item in the editor', async function (this: World) {
  // Fill basic information
  await this.page.fill('[data-testid="title-input"]', 'Test Knowledge Item');
  await this.page.fill('[data-testid="description-input"]', 'Test description content');
  
  // Add some content
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('This is test content for the knowledge item.');
});

Given('I have a complete knowledge item in the editor', async function (this: World) {
  // Fill all required fields
  await this.page.fill('[data-testid="title-input"]', 'Complete Knowledge Item');
  await this.page.fill('[data-testid="description-input"]', 'Complete description');
  
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('Complete content with all required information.');
  
  // Select category if required
  await this.page.click('[data-testid="category-select"]');
  await this.page.click('text=Agile Frameworks');
});

// ===== EDITOR STEP NAVIGATION =====

When('I am on the {string} step', async function (this: World, stepName: string) {
  const stepMap: { [key: string]: string } = {
    'Basic Information': 'basic-info-step',
    'Content': 'content-step',
    'Classification': 'classification-step',
    'Use Cases': 'use-cases-step',
    'Publication': 'publication-step'
  };
  
  const testId = stepMap[stepName];
  if (testId) {
    await expect(this.page.locator(`[data-testid="${testId}"]`)).toBeVisible();
  }
});

When('I click {string} to go to {string} step', async function (this: World, buttonText: string, stepName: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
  await this.page.waitForTimeout(500);
});

When('I proceed to the content step', async function (this: World) {
  await this.page.click('[data-testid="next-step-button"]');
});

When('I proceed to the classification step', async function (this: World) {
  await this.page.click('[data-testid="next-step-button"]');
});

When('I proceed to the publication step', async function (this: World) {
  await this.page.click('[data-testid="next-step-button"]');
});

// ===== FORM FIELDS AND VALIDATION =====

When('I fill in the basic information step:', async function (this: World, dataTable) {
  const data = dataTable.hashes()[0];
  
  if (data.Title) {
    await this.page.fill('[data-testid="title-input"]', data.Title);
  }
  if (data.Description) {
    await this.page.fill('[data-testid="description-input"]', data.Description);
  }
});

When('I try to proceed without entering a name', async function (this: World) {
  // Leave name field empty and try to proceed
  await this.page.click('[data-testid="next-step-button"]');
});

When('I enter a name {string}', async function (this: World, name: string) {
  await this.page.fill('[data-testid="title-input"]', name);
});

When('I enter a description {string}', async function (this: World, description: string) {
  await this.page.fill('[data-testid="description-input"]', description);
});

Then('I should see fields for name, description, and summary', async function (this: World) {
  await expect(this.page.locator('[data-testid="title-input"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="description-input"]')).toBeVisible();
});

Then('I should see a validation error for the name field', async function (this: World) {
  await expect(this.page.locator('[data-testid="name-error"]')).toBeVisible();
});

Then('I should not be able to proceed to the next step', async function (this: World) {
  const nextButton = this.page.locator('[data-testid="next-step-button"]');
  await expect(nextButton).toBeDisabled();
});

Then('I should be able to proceed to the next step', async function (this: World) {
  const nextButton = this.page.locator('[data-testid="next-step-button"]');
  await expect(nextButton).toBeEnabled();
});

// ===== RICH TEXT EDITOR =====

When('I add rich text content with formatting', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('# Main Heading\n\nThis is **bold text** and this is *italic text*.\n\n- List item 1\n- List item 2');
});

When('I add formatted text with headings and lists', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('# Heading 1\n\n## Heading 2\n\n- Bullet point 1\n- Bullet point 2\n\n1. Numbered item 1\n2. Numbered item 2');
});

When('I insert an image into the content', async function (this: World) {
  await this.page.click('[data-testid="insert-image-button"]');
  await this.page.setInputFiles('[data-testid="image-upload"]', 'test-data/test-image.jpg');
});

When('I add a link to external resource', async function (this: World) {
  await this.page.click('[data-testid="insert-link-button"]');
  await this.page.fill('[data-testid="link-url-input"]', 'https://example.com');
  await this.page.fill('[data-testid="link-text-input"]', 'Example Link');
  await this.page.click('[data-testid="insert-link-confirm"]');
});

Then('I should see the rich text editor for content', async function (this: World) {
  await expect(this.page.locator('[data-testid="rich-text-editor"]')).toBeVisible();
});

Then('the content should be properly formatted in the preview', async function (this: World) {
  const preview = this.page.locator('[data-testid="live-preview"]');
  await expect(preview).toBeVisible();
});

Then('all formatting should be preserved', async function (this: World) {
  const preview = this.page.locator('[data-testid="live-preview"]');
  await expect(preview.locator('h1')).toBeVisible(); // Check heading
  await expect(preview.locator('strong')).toBeVisible(); // Check bold
  await expect(preview.locator('ul')).toBeVisible(); // Check list
});

// ===== CLASSIFICATION =====

When('I select category {string}', async function (this: World, category: string) {
  await this.page.click('[data-testid="category-select"]');
  await this.page.click(`text=${category}`);
});

When('I select {string} as the category', async function (this: World, category: string) {
  await this.page.click('[data-testid="category-select"]');
  await this.page.click(`text=${category}`);
});

When('I select {string} as the level', async function (this: World, level: string) {
  await this.page.click('[data-testid="level-select"]');
  await this.page.click(`text=${level}`);
});

When('I add tags {string}', async function (this: World, tags: string) {
  const tagsList = tags.split(',').map(tag => tag.trim());
  for (const tag of tagsList) {
    await this.page.fill('[data-testid="tags-input"]', tag);
    await this.page.press('[data-testid="tags-input"]', 'Enter');
  }
});

When('I select {string} as the planning focus', async function (this: World, planningFocus: string) {
  await this.page.click('[data-testid="planning-focus-select"]');
  await this.page.click(`text=${planningFocus}`);
});

Then('I should see category and tag selection fields', async function (this: World) {
  await expect(this.page.locator('[data-testid="category-select"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="tags-input"]')).toBeVisible();
});

Then('all classification data should be saved with the item', async function (this: World) {
  // This would be verified by checking the saved data or success message
  await expect(this.page.locator('[data-testid="classification-saved"]')).toBeVisible();
});

// ===== USE CASES =====

Given('I complete previous steps', async function (this: World) {
  // Navigate through previous steps quickly
  await this.page.fill('[data-testid="title-input"]', 'Test Item');
  await this.page.fill('[data-testid="description-input"]', 'Test description');
  await this.page.click('[data-testid="next-step-button"]');
  
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('Test content');
  await this.page.click('[data-testid="next-step-button"]');
  
  await this.page.click('[data-testid="category-select"]');
  await this.page.click('text=Agile Frameworks');
  await this.page.click('[data-testid="next-step-button"]');
});

Given('I complete the basic information step', async function (this: World) {
  await this.page.fill('[data-testid="title-input"]', 'Test Knowledge Item');
  await this.page.fill('[data-testid="description-input"]', 'Test description');
  await this.page.click('[data-testid="next-step-button"]');
});

Given('I complete the basic information and content steps', async function (this: World) {
  await this.page.fill('[data-testid="title-input"]', 'Test Knowledge Item');
  await this.page.fill('[data-testid="description-input"]', 'Test description');
  await this.page.click('[data-testid="next-step-button"]');
  
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('Test content with formatting');
  await this.page.click('[data-testid="next-step-button"]');
});

When('I fill in the use case details:', async function (this: World, dataTable) {
  const data = dataTable.hashes()[0];
  
  if (data.Title) {
    await this.page.fill('[data-testid="use-case-title-input"]', data.Title);
  }
  if (data.Description) {
    await this.page.fill('[data-testid="use-case-description-input"]', data.Description);
  }
  if (data.Context) {
    await this.page.fill('[data-testid="use-case-context-input"]', data.Context);
  }
  if (data.Outcome) {
    await this.page.fill('[data-testid="use-case-outcome-input"]', data.Outcome);
  }
  
  await this.page.click('[data-testid="save-use-case-button"]');
});

Then('I should see use case management interface', async function (this: World) {
  await expect(this.page.locator('[data-testid="use-cases-section"]')).toBeVisible();
});

Then('the use case should be added to the list', async function (this: World) {
  await expect(this.page.locator('[data-testid="use-case-item"]')).toBeVisible();
});

Then('I should be able to add more use cases', async function (this: World) {
  await expect(this.page.locator('button:has-text("Add Use Case")')).toBeVisible();
});

// ===== TEMPLATES =====

When('I click on {string}', async function (this: World, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

When('I select {string}', async function (this: World, templateName: string) {
  await this.page.click(`text=${templateName}`);
});

Then('the knowledge item should be populated with template content', async function (this: World) {
  await expect(this.page.locator('[data-testid="template-applied"]')).toBeVisible();
});

Then('I should see template-specific fields', async function (this: World) {
  await expect(this.page.locator('[data-testid="template-fields"]')).toBeVisible();
});

Then('I should be able to customize the template content', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await expect(editor).toBeEditable();
});

// ===== SAVING AND PUBLISHING =====

When('I set the status to {string}', async function (this: World, status: string) {
  await this.page.click('[data-testid="status-select"]');
  await this.page.click(`text=${status}`);
});

When('I make changes to the content', async function (this: World) {
  const editor = this.page.locator('[data-testid="rich-text-editor"]');
  await editor.fill('Updated content with new information');
});

When('I wait for a few seconds', async function (this: World) {
  await this.page.waitForTimeout(3000);
});

When('I try to publish without completing required fields', async function (this: World) {
  // Leave required fields empty and try to publish
  await this.page.click('[data-testid="publish-button"]');
});

Then('the item should be saved with draft status', async function (this: World) {
  await expect(this.page.locator('text=Saved as draft')).toBeVisible();
});

Then('the item should be saved with published status', async function (this: World) {
  await expect(this.page.locator('text=Published successfully')).toBeVisible();
});

Then('it should appear in the public knowledge base', async function (this: World) {
  // Navigate to public knowledge base to verify
  await this.page.goto(`${getBaseUrl()}/knowledge`);
  await expect(this.page.locator('text=Complete Knowledge Item')).toBeVisible();
});

Then('I should see a success message', async function (this: World) {
  await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
});

Then('I should be able to continue editing later', async function (this: World) {
  await expect(this.page.locator('[data-testid="continue-editing"]')).toBeVisible();
});

Then('the changes should be automatically saved as draft', async function (this: World) {
  await expect(this.page.locator('text=Auto-saved')).toBeVisible();
});

Then('I should see an {string} indicator', async function (this: World, indicatorText: string) {
  await expect(this.page.locator(`text=${indicatorText}`)).toBeVisible();
});

Then('I should see validation errors highlighting missing fields', async function (this: World) {
  await expect(this.page.locator('[data-testid="validation-error"]')).toBeVisible();
});

Then('the publish action should be prevented', async function (this: World) {
  const publishButton = this.page.locator('[data-testid="publish-button"]');
  await expect(publishButton).toBeDisabled();
});

Then('I should see guidance on what needs to be completed', async function (this: World) {
  await expect(this.page.locator('[data-testid="completion-guidance"]')).toBeVisible();
});

// ===== PREVIEW FUNCTIONALITY =====

When('I click the {string} button', async function (this: World, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

Then('I should see how the item will appear to end users', async function (this: World) {
  await expect(this.page.locator('[data-testid="preview-mode"]')).toBeVisible();
});

Then('all formatting and content should display correctly', async function (this: World) {
  const preview = this.page.locator('[data-testid="preview-content"]');
  await expect(preview).toBeVisible();
});

Then('I should be able to return to editing mode', async function (this: World) {
  await expect(this.page.locator('button:has-text("Edit")')).toBeVisible();
});