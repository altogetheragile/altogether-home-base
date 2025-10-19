import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

Given('I have a user story {string}', async function (this: World, storyTitle: string) {
  await this.page!.goto('/canvas/test-project-id');
  await this.page!.waitForLoadState('networkidle');
  
  // Verify story exists
  const story = this.page!.locator(`[data-testid="story-card"]:has-text("${storyTitle}")`);
  await expect(story).toBeVisible();
});

Given('I am viewing the story details', async function (this: World) {
  const storyCard = this.page!.locator('[data-testid="story-card"]').first();
  await storyCard.click();
});

Given('I have opened the story editor', async function (this: World) {
  await this.page!.locator('[data-testid="edit-story-button"]').first().click();
  await this.page!.waitForSelector('[data-testid="story-editor"]');
});

Given('I have multiple stories with different scores', async function (this: World) {
  // Assume test data exists with various scores
  await this.page!.goto('/canvas/test-project-id');
  const storyCount = await this.page!.locator('[data-testid="story-card"]').count();
  expect(storyCount).toBeGreaterThan(2);
});

Given('a story has confidence_level of {int}', async function (this: World, level: number) {
  // Set up story with specific confidence level via test data or API
  await this.page!.goto('/canvas/test-project-id');
  const story = this.page!.locator(`[data-testid="story-card"][data-confidence="${level}"]`).first();
  await expect(story).toBeVisible();
});

Given('I have a story with incomplete DoR', async function (this: World) {
  await this.page!.goto('/canvas/test-project-id');
  const story = this.page!.locator('[data-testid="story-card"][data-readiness-incomplete="true"]').first();
  await expect(story).toBeVisible();
  await story.click();
});

Given('I have a story {string}', async function (this: World, status: string) {
  await this.page!.goto('/canvas/test-project-id');
  const story = this.page!.locator(`[data-testid="story-card"][data-status="${status.toLowerCase().replace(' ', '_')}"]`).first();
  await expect(story).toBeVisible();
  await story.click();
});

Given('the story has {int} DoD items', async function (this: World, count: number) {
  const items = await this.page!.locator('[data-testid="dod-item"]').count();
  expect(items).toBe(count);
});

Given('I am editing a story', async function (this: World) {
  await this.page!.goto('/canvas/test-project-id');
  await this.page!.locator('[data-testid="story-card"]').first().click();
  await this.page!.locator('[data-testid="edit-story-button"]').click();
});

Given('I have selected {int} user stories', async function (this: World, count: number) {
  await this.page!.goto('/canvas/test-project-id');
  
  for (let i = 0; i < count; i++) {
    await this.page!.locator('[data-testid="story-checkbox"]').nth(i).check();
  }
  
  const checkedCount = await this.page!.locator('[data-testid="story-checkbox"]:checked').count();
  expect(checkedCount).toBe(count);
});

When('I open the metadata panel', async function (this: World) {
  await this.page!.locator('[data-testid="metadata-panel-trigger"]').click();
  await this.page!.waitForSelector('[data-testid="metadata-panel"]');
});

When('I select the {string} tab', async function (this: World, tabName: string) {
  await this.page!.locator(`[data-testid="metadata-tab-${tabName.toLowerCase()}"]`).click();
});

When('I check the first DoR item', async function (this: World) {
  await this.page!.locator('[data-testid="dor-checkbox"]').first().check();
});

When('I update the user_persona to {string}', async function (this: World, persona: string) {
  await this.page!.locator('[data-testid="user-persona-input"]').fill(persona);
});

When('I update the business_value_score to {int}', async function (this: World, score: number) {
  await this.page!.locator('[data-testid="business-value-score-input"]').fill(score.toString());
});

When('I update the technical_complexity_score to {int}', async function (this: World, score: number) {
  await this.page!.locator('[data-testid="technical-complexity-score-input"]').fill(score.toString());
});

When('I click {string}', async function (this: World, buttonText: string) {
  await this.page!.locator(`button:has-text("${buttonText}")`).click();
});

When('I view the impact vs effort matrix', async function (this: World) {
  await this.page!.goto('/canvas/test-project-id/matrix');
  await this.page!.waitForLoadState('networkidle');
});

When('I check all DoR items', async function (this: World) {
  const checkboxes = this.page!.locator('[data-testid="dor-checkbox"]');
  const count = await checkboxes.count();
  
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).check();
  }
});

When('I complete {string}', async function (this: World, itemText: string) {
  const item = this.page!.locator(`[data-testid="dod-item"]:has-text("${itemText}")`);
  await item.locator('[data-testid="dod-checkbox"]').check();
});

When('I complete all remaining DoD items', async function (this: World) {
  const uncheckedBoxes = this.page!.locator('[data-testid="dod-checkbox"]:not(:checked)');
  const count = await uncheckedBoxes.count();
  
  for (let i = 0; i < count; i++) {
    await uncheckedBoxes.nth(i).check();
  }
});

When('I try to set business_value_score to {int}', async function (this: World, score: number) {
  await this.page!.locator('[data-testid="business-value-score-input"]').fill(score.toString());
});

When('I try to set confidence_level to {int}', async function (this: World, level: number) {
  await this.page!.locator('[data-testid="confidence-level-input"]').fill(level.toString());
});

When('I try to set estimated_effort_hours to {int}', async function (this: World, hours: number) {
  await this.page!.locator('[data-testid="estimated-effort-input"]').fill(hours.toString());
});

When('I set user_persona to {string}', async function (this: World, persona: string) {
  await this.page!.locator('[data-testid="bulk-user-persona-input"]').fill(persona);
});

When('I set business_objective to {string}', async function (this: World, objective: string) {
  await this.page!.locator('[data-testid="bulk-business-objective-input"]').fill(objective);
});

Then('I should see a metadata panel with {int} tabs', async function (this: World, tabCount: number) {
  const tabs = await this.page!.locator('[data-testid^="metadata-tab-"]').count();
  expect(tabs).toBe(tabCount);
});

Then('the tabs should be {string}, {string}, {string}, {string}', async function (
  this: World,
  tab1: string,
  tab2: string,
  tab3: string,
  tab4: string
) {
  await expect(this.page!.locator(`text="${tab1}"`)).toBeVisible();
  await expect(this.page!.locator(`text="${tab2}"`)).toBeVisible();
  await expect(this.page!.locator(`text="${tab3}"`)).toBeVisible();
  await expect(this.page!.locator(`text="${tab4}"`)).toBeVisible();
});

Then('I should see the user_persona', async function (this: World) {
  const persona = this.page!.locator('[data-testid="user-persona-display"]');
  await expect(persona).toBeVisible();
});

Then('I should see the business_objective', async function (this: World) {
  const objective = this.page!.locator('[data-testid="business-objective-display"]');
  await expect(objective).toBeVisible();
});

Then('I should see the user_value', async function (this: World) {
  const value = this.page!.locator('[data-testid="user-value-display"]');
  await expect(value).toBeVisible();
});

Then('I should see the confidence_level badge', async function (this: World) {
  const badge = this.page!.locator('[data-testid="confidence-level-badge"]');
  await expect(badge).toBeVisible();
});

Then('I should see the estimated_effort_hours', async function (this: World) {
  const effort = this.page!.locator('[data-testid="estimated-effort-display"]');
  await expect(effort).toBeVisible();
});

Then('the readiness score should update', async function (this: World) {
  // Wait for score to recalculate
  await this.page!.waitForTimeout(500);
  const score = this.page!.locator('[data-testid="readiness-score"]');
  const scoreText = await score.textContent();
  expect(parseInt(scoreText!)).toBeGreaterThan(0);
});

Then('the story card should reflect the new readiness percentage', async function (this: World) {
  const cardScore = this.page!.locator('[data-testid="story-card-readiness"]').first();
  await expect(cardScore).toBeVisible();
});

Then('the story should be updated with new metadata', async function (this: World) {
  // Wait for save operation
  await this.page!.waitForSelector('[data-testid="save-success-toast"]', { timeout: 5000 });
});

Then('the metadata panel should show the updated values', async function (this: World) {
  await this.page!.locator('[data-testid="metadata-panel-trigger"]').click();
  // Values should be updated
  const persona = await this.page!.locator('[data-testid="user-persona-display"]').textContent();
  expect(persona).toBeTruthy();
});

Then('the readiness score should be {int}%', async function (this: World, percentage: number) {
  const score = await this.page!.locator('[data-testid="readiness-score"]').textContent();
  expect(parseInt(score!)).toBe(percentage);
});

Then('the completion score should be {int}%', async function (this: World, percentage: number) {
  const score = await this.page!.locator('[data-testid="completion-score"]').textContent();
  expect(parseInt(score!)).toBe(percentage);
});

Then('the story status should update to {string}', async function (this: World, status: string) {
  const statusBadge = this.page!.locator('[data-testid="story-status-badge"]');
  await expect(statusBadge).toContainText(status);
});

Then('a success toast should appear', async function (this: World) {
  const toast = this.page!.locator('[data-testid="success-toast"]');
  await expect(toast).toBeVisible({ timeout: 5000 });
});

Then('I should see a validation error {string}', async function (this: World, errorMessage: string) {
  const error = this.page!.locator(`text="${errorMessage}"`);
  await expect(error).toBeVisible();
});

Then('all {int} stories should have the updated metadata', async function (this: World, count: number) {
  // Wait for bulk update to complete
  await this.page!.waitForSelector('[data-testid="bulk-update-success"]', { timeout: 10000 });
});

Then('a success toast should confirm {string}', async function (this: World, message: string) {
  const toast = this.page!.locator(`[data-testid="success-toast"]:has-text("${message}")`);
  await expect(toast).toBeVisible({ timeout: 5000 });
});
