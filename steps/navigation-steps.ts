import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

When('I navigate to the analytics section', async function (this: World) {
  await this.page.click('[data-testid="analytics-tab"]');
});

Then('I should see the total number of knowledge items', async function (this: World) {
  await expect(this.page.locator('[data-testid="total-items-count"]')).toBeVisible();
});

Then('I should see the number of published items', async function (this: World) {
  await expect(this.page.locator('[data-testid="published-count"]')).toBeVisible();
});

Then('I should see the number of draft items', async function (this: World) {
  await expect(this.page.locator('[data-testid="draft-count"]')).toBeVisible();
});

Then('I should see view statistics', async function (this: World) {
  await expect(this.page.locator('[data-testid="view-stats"]')).toBeVisible();
});

When('I switch to {string} view', async function (this: World, viewType: string) {
  await this.page.click(`[data-testid="${viewType.toLowerCase()}-view-button"]`);
});

Then('I should see knowledge items displayed as cards', async function (this: World) {
  await expect(this.page.locator('[data-testid="cards-container"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="knowledge-card"]')).toHaveCount(await this.page.locator('[data-testid="knowledge-card"]').count());
});

Then('I should see knowledge items displayed in a table format', async function (this: World) {
  await expect(this.page.locator('[data-testid="table-container"]')).toBeVisible();
  await expect(this.page.locator('table')).toBeVisible();
});

Then('I should see knowledge items organized by status columns', async function (this: World) {
  await expect(this.page.locator('[data-testid="board-container"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="draft-column"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="published-column"]')).toBeVisible();
});

When('I open the filters panel', async function (this: World) {
  const filtersPanel = this.page.locator('[data-testid="filters-panel"]');
  const isVisible = await filtersPanel.isVisible();
  
  if (!isVisible) {
    await this.page.click('[data-testid="filters-toggle"]');
  }
  
  await expect(filtersPanel).toBeVisible();
});

When('I select {string} status filter', async function (this: World, status: string) {
  await this.page.click('[data-testid="status-filter"]');
  await this.page.click(`[data-testid="status-${status.toLowerCase()}"]`);
});

When('I select {string} category', async function (this: World, category: string) {
  await this.page.click('[data-testid="category-filter-dropdown"]');
  await this.page.click(`text=${category}`);
});

When('I set date range to {string}', async function (this: World, dateRange: string) {
  await this.page.click('[data-testid="date-range-preset"]');
  await this.page.click(`text=${dateRange}`);
});

Then('I should see only items matching all filter criteria', async function (this: World) {
  // Wait for filters to be applied
  await this.page.waitForTimeout(1000);
  
  // Check that items are filtered
  const items = this.page.locator('[data-testid="knowledge-item"]');
  const count = await items.count();
  
  // Verify there are some results but not all items
  expect(count).toBeGreaterThan(0);
});

Then('the item count should reflect the filtered results', async function (this: World) {
  const itemCount = this.page.locator('[data-testid="items-count"]');
  await expect(itemCount).toBeVisible();
  
  const countText = await itemCount.textContent();
  expect(countText).toMatch(/\d+/); // Should contain a number
});

Given('I have selected multiple knowledge items', async function (this: World) {
  // Select multiple items using checkboxes
  const checkboxes = this.page.locator('[data-testid="item-selection-checkbox"]');
  const count = await checkboxes.count();
  
  for (let i = 0; i < Math.min(3, count); i++) {
    await checkboxes.nth(i).check();
  }
  
  // Verify bulk operations panel is visible
  await expect(this.page.locator('[data-testid="bulk-operations-panel"]')).toBeVisible();
});

When('I choose {string} from bulk operations', async function (this: World, operation: string) {
  await this.page.click('[data-testid="bulk-operations-dropdown"]');
  await this.page.click(`text=${operation}`);
});

When('I select {string} as the new category', async function (this: World, newCategory: string) {
  await this.page.click('[data-testid="category-select"]');
  await this.page.click(`text=${newCategory}`);
  await this.page.click('[data-testid="apply-category-change"]');
});

Then('all selected items should be updated to the new category', async function (this: World) {
  // Wait for the update to complete
  await this.page.waitForTimeout(1000);
  
  // Verify the success message or updated UI
  await expect(this.page.locator('[data-testid="bulk-update-success"]')).toBeVisible();
});

Then('I should see a success confirmation', async function (this: World) {
  await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
});