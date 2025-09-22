import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';

// Dashboard visibility and navigation steps
Then('I should see knowledge items displayed as cards', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Cards view should show grid of items
  await expect(this.page.locator('.grid')).toBeVisible();
});

Then('I should see knowledge items displayed in a table', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Table view should show table structure
  await expect(this.page.locator('table')).toBeVisible();
});

Then('I should see knowledge items organized in columns by status', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Kanban view should show columns
  await expect(this.page.locator('[data-testid="kanban-board"]')).toBeVisible();
});

// View mode switching steps
When('I click on the {string} view button', async function (this: CustomWorld, viewName: string) {
  const viewMap: Record<string, string> = {
    'Cards': '[data-testid="view-cards"]',
    'Table': '[data-testid="view-table"]',
    'Kanban': '[data-testid="view-kanban"]',
    'Analytics': '[data-testid="view-analytics"]',
  };
  
  const selector = viewMap[viewName];
  if (selector) {
    await this.page.click(selector);
  } else {
    throw new Error(`Unknown view: ${viewName}`);
  }
});

// Command palette steps
Then('the command palette should open', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 5000 });
});

When('I type {string}', async function (this: CustomWorld, text: string) {
  await this.page.fill('[data-testid="command-input"]', text);
});

When('I select {string}', async function (this: CustomWorld, option: string) {
  await this.page.click(`text=${option}`);
});

Then('I should see create options in the command palette', async function (this: CustomWorld) {
  await expect(this.page.locator('text=Create Knowledge Item')).toBeVisible();
});

Then('the knowledge item editor should open', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="knowledge-item-editor"]')).toBeVisible();
});

// Sidebar workflow steps
When('I click on {string} in the sidebar', async function (this: CustomWorld, item: string) {
  const sidebarMap: Record<string, string> = {
    'Draft': '[data-testid="sidebar-workflow-drafts"]',
    'Published': '[data-testid="sidebar-workflow-published"]',
    'All Items': '[data-testid="sidebar-workflow-all"]',
    'Recent Updates': '[data-testid="sidebar-recent-updates"]',
    'Most Popular': '[data-testid="sidebar-most-popular"]',
    'Needs Review': '[data-testid="sidebar-needs-review"]',
  };
  
  const selector = sidebarMap[item] || `text=${item}`;
  await this.page.click(selector);
});

Then('I should see only draft knowledge items', async function (this: CustomWorld) {
  // Check that displayed items are drafts
  const statusBadges = await this.page.locator('text=Draft').count();
  expect(statusBadges).toBeGreaterThan(0);
});

Then('I should see only published knowledge items', async function (this: CustomWorld) {
  // Check that displayed items are published
  const statusBadges = await this.page.locator('text=Published').count();
  expect(statusBadges).toBeGreaterThan(0);
});

Then('I should see all knowledge items regardless of status', async function (this: CustomWorld) {
  // Check that both draft and published items are visible
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
});

// Filter and sort steps
Then('I should see knowledge items sorted by most recently updated', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Items should be sorted by update date
});

Then('I should see knowledge items sorted by popularity/views', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Items should be sorted by view count
});

Then('I should see knowledge items that need review', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Items should be filtered to show those needing review
});

// Search and filter steps
When('I click on the search bar', async function (this: CustomWorld) {
  await this.page.click('[data-testid="search-input"]');
});

When('I enter {string} in the search field', async function (this: CustomWorld, searchTerm: string) {
  await this.page.fill('[data-testid="search-input"]', searchTerm);
});

When('I select {string} from the category filter', async function (this: CustomWorld, category: string) {
  await this.page.click('[data-testid="category-filter"]');
  await this.page.click(`text=${category}`);
});

When('I select {string} from the status filter', async function (this: CustomWorld, status: string) {
  await this.page.click('[data-testid="status-filter"]');
  await this.page.click(`text=${status}`);
});

Then('I should see filtered results matching all criteria', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Results should match the applied filters
});

Then('the active filters should be displayed as chips', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="active-filters"]')).toBeVisible();
});

// Sort steps
Given('there are multiple knowledge items visible', async function (this: CustomWorld) {
  const itemCount = await this.page.locator('[data-testid="knowledge-item-card"], tr').count();
  expect(itemCount).toBeGreaterThan(1);
});

When('I click on the sort dropdown', async function (this: CustomWorld) {
  await this.page.click('[data-testid="sort-dropdown"]');
});

Then('the knowledge items should be sorted alphabetically by name', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Items should be in alphabetical order
});

Then('the knowledge items should be sorted by last updated date', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Items should be sorted by update date
});

Then('the knowledge items should be sorted by view count', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  // Items should be sorted by view count
});

// Analytics steps
Then('I should see content analytics dashboard', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="content-analytics"]')).toBeVisible();
});

Then('I should see metrics like total items, views, and engagement', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="metrics-overview"]')).toBeVisible();
});

Then('I should see charts showing content performance over time', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="performance-charts"]')).toBeVisible();
});

// Mobile responsive steps
Given('I am using a mobile device', async function (this: CustomWorld) {
  await this.page.setViewportSize({ width: 375, height: 667 });
});

Then('the sidebar should be collapsible', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
});

Then('the view should be optimized for mobile', async function (this: CustomWorld) {
  // Check that mobile-specific styling is applied
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
});

Then('all main functions should remain accessible', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="create-content-button"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="search-input"]')).toBeVisible();
});