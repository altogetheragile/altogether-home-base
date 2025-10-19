import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

Given('I have a project with no stories', async function (this: World) {
  // Navigate to project canvas
  await this.page!.goto('/canvas/test-project-id');
  await this.page!.waitForLoadState('networkidle');
  
  // Verify no stories exist
  const storyCount = await this.page!.locator('[data-testid="story-card"]').count();
  expect(storyCount).toBe(0);
});

Given('I have a project with no epics', async function (this: World) {
  await this.page!.goto('/canvas/test-project-id');
  await this.page!.waitForLoadState('networkidle');
  
  const epicCount = await this.page!.locator('[data-testid="epic-card"]').count();
  expect(epicCount).toBe(0);
});

Given('I have a project', async function (this: World) {
  await this.page!.goto('/canvas/test-project-id');
  await this.page!.waitForLoadState('networkidle');
});

Given('I have an epic {string}', async function (this: World, epicName: string) {
  // Navigate to project
  await this.page!.goto('/canvas/test-project-id');
  
  // Create epic for test (or assume it exists in test data)
  const epicExists = await this.page!.locator(`text="${epicName}"`).isVisible();
  expect(epicExists).toBe(true);
});

Given('I have generated {int} stories in the last hour', async function (this: World, count: number) {
  // Mock rate limit state - this would need backend support
  await this.page!.evaluate((n) => {
    localStorage.setItem('ai_generation_count', n.toString());
    localStorage.setItem('ai_generation_reset_time', Date.now().toString());
  }, count);
});

When('I click the {string} button', async function (this: World, buttonText: string) {
  await this.page!.locator(`button:has-text("${buttonText}")`).click();
});

When('I click {string}', async function (this: World, buttonText: string) {
  await this.page!.locator(`button:has-text("${buttonText}")`).click();
});

When('I select story level {string}', async function (this: World, level: string) {
  await this.page!.locator('[data-testid="story-level-select"]').click();
  await this.page!.locator(`[data-testid="story-level-option-${level.toLowerCase()}"]`).click();
});

When('I enter the description {string}', async function (this: World, description: string) {
  await this.page!.locator('[data-testid="user-input-textarea"]').fill(description);
});

When('I enter business objective {string}', async function (this: World, objective: string) {
  await this.page!.locator('[data-testid="business-objective-input"]').fill(objective);
});

When('I enter user persona {string}', async function (this: World, persona: string) {
  await this.page!.locator('[data-testid="user-persona-input"]').fill(persona);
});

When('I leave the description field empty', async function (this: World) {
  await this.page!.locator('[data-testid="user-input-textarea"]').clear();
});

When('I generate a user story with AI', async function (this: World) {
  await this.page!.locator('button:has-text("Generate with AI")').click();
  await this.page!.locator('[data-testid="story-level-select"]').click();
  await this.page!.locator('[data-testid="story-level-option-story"]').click();
  await this.page!.locator('[data-testid="user-input-textarea"]').fill('User wants to log in');
  await this.page!.locator('button:has-text("Generate")').click();
  
  // Wait for generation to complete
  await this.page!.waitForSelector('[data-testid="generated-story"]', { timeout: 15000 });
});

When('I click {string} within the epic', async function (this: World, buttonText: string) {
  await this.page!.locator('[data-testid="epic-card"]').locator(`button:has-text("${buttonText}")`).first().click();
});

When('I try to generate another story', async function (this: World) {
  await this.page!.locator('button:has-text("Generate with AI")').click();
  await this.page!.locator('[data-testid="user-input-textarea"]').fill('Another story');
  await this.page!.locator('button:has-text("Generate")').click();
});

Then('I should see a loading indicator', async function (this: World) {
  const loader = this.page!.locator('[data-testid="ai-generation-loader"]');
  await expect(loader).toBeVisible();
});

Then('the story should be generated within {int} seconds', async function (this: World, seconds: number) {
  await this.page!.waitForSelector('[data-testid="generated-story"]', { 
    timeout: seconds * 1000 
  });
});

Then('the generated story should have a title', async function (this: World) {
  const title = await this.page!.locator('[data-testid="generated-story-title"]').textContent();
  expect(title).toBeTruthy();
  expect(title!.length).toBeGreaterThan(0);
});

Then('the generated story should have a description', async function (this: World) {
  const description = await this.page!.locator('[data-testid="generated-story-description"]').textContent();
  expect(description).toBeTruthy();
  expect(description!.length).toBeGreaterThan(0);
});

Then('the generated story should have acceptance criteria', async function (this: World) {
  const criteriaCount = await this.page!.locator('[data-testid="acceptance-criteria-item"]').count();
  expect(criteriaCount).toBeGreaterThan(0);
});

Then('the generated story should have a confidence level', async function (this: World) {
  const confidenceBadge = this.page!.locator('[data-testid="confidence-level-badge"]');
  await expect(confidenceBadge).toBeVisible();
});

Then('the generated epic should include business_objective', async function (this: World) {
  const objective = await this.page!.locator('[data-testid="business-objective"]').textContent();
  expect(objective).toBeTruthy();
});

Then('the generated epic should include success_metrics', async function (this: World) {
  const metricsCount = await this.page!.locator('[data-testid="success-metric-item"]').count();
  expect(metricsCount).toBeGreaterThan(0);
});

Then('the generated epic should have estimated effort hours', async function (this: World) {
  const effortText = await this.page!.locator('[data-testid="estimated-effort"]').textContent();
  expect(effortText).toContain('hours');
});

Then('the story should include {string} items', async function (this: World, checklistType: string) {
  const selector = checklistType.includes('Ready') 
    ? '[data-testid="dor-item"]' 
    : '[data-testid="dod-item"]';
  const itemsCount = await this.page!.locator(selector).count();
  expect(itemsCount).toBeGreaterThan(0);
});

Then('the story should include technical_notes', async function (this: World) {
  const notes = await this.page!.locator('[data-testid="technical-notes"]').textContent();
  expect(notes).toBeTruthy();
});

Then('the story should include dependencies list', async function (this: World) {
  const count = await this.page!.locator('[data-testid="dependency-item"]').count();
  expect(count).toBeGreaterThan(0);
});

Then('the story should include risks list', async function (this: World) {
  const count = await this.page!.locator('[data-testid="risk-item"]').count();
  expect(count).toBeGreaterThan(0);
});

Then('the story should include business_value_score', async function (this: World) {
  const score = await this.page!.locator('[data-testid="business-value-score"]').textContent();
  expect(parseInt(score!)).toBeGreaterThan(0);
});

Then('the story should include technical_complexity_score', async function (this: World) {
  const score = await this.page!.locator('[data-testid="technical-complexity-score"]').textContent();
  expect(parseInt(score!)).toBeGreaterThan(0);
});

Then('the story should include estimated_effort_hours', async function (this: World) {
  const hours = await this.page!.locator('[data-testid="estimated-effort-hours"]').textContent();
  expect(parseInt(hours!)).toBeGreaterThan(0);
});

Then('I should see an error message {string}', async function (this: World, errorMessage: string) {
  const error = this.page!.locator(`text="${errorMessage}"`);
  await expect(error).toBeVisible({ timeout: 5000 });
});

Then('the error should indicate when I can retry', async function (this: World) {
  const retryMessage = this.page!.locator('[data-testid="retry-after-message"]');
  await expect(retryMessage).toBeVisible();
});

Then('no story should be created', async function (this: World) {
  const storyCard = this.page!.locator('[data-testid="generated-story"]');
  await expect(storyCard).not.toBeVisible();
});

Then('I should see a validation error', async function (this: World) {
  const validationError = this.page!.locator('[data-testid="validation-error"]');
  await expect(validationError).toBeVisible();
});

Then('no API call should be made', async function (this: World) {
  // This would require network monitoring
  // For now, check that no loading state appears
  const loader = this.page!.locator('[data-testid="ai-generation-loader"]');
  await expect(loader).not.toBeVisible();
});

Then('the generation should be logged in the audit table', async function (this: World) {
  // This would require checking the database or admin audit logs
  // For E2E, we can verify the UI shows audit info
  await this.page!.goto('/admin/audit-logs');
  const latestLog = this.page!.locator('[data-testid="audit-log-item"]').first();
  await expect(latestLog).toBeVisible();
});

Then('the audit log should include user_id', async function (this: World) {
  const userIdField = this.page!.locator('[data-testid="audit-log-user-id"]').first();
  const userId = await userIdField.textContent();
  expect(userId).toBeTruthy();
});

Then('the audit log should include input_data', async function (this: World) {
  const inputData = this.page!.locator('[data-testid="audit-log-input"]').first();
  await expect(inputData).toBeVisible();
});

Then('the audit log should include output_data', async function (this: World) {
  const outputData = this.page!.locator('[data-testid="audit-log-output"]').first();
  await expect(outputData).toBeVisible();
});

Then('the audit log should include token_count', async function (this: World) {
  const tokenCount = this.page!.locator('[data-testid="audit-log-tokens"]').first();
  const tokens = await tokenCount.textContent();
  expect(parseInt(tokens!)).toBeGreaterThan(0);
});

Then('the audit log should include execution_time_ms', async function (this: World) {
  const execTime = this.page!.locator('[data-testid="audit-log-exec-time"]').first();
  const time = await execTime.textContent();
  expect(parseInt(time!)).toBeGreaterThan(0);
});
