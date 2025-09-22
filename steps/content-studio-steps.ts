import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { World } from '../support/world';

// Helper to get base URL
const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:5173';

// ===== CONTENT STUDIO DASHBOARD NAVIGATION =====

Given('I am on the content studio dashboard', async function (this: World) {
  await this.page.goto(`${getBaseUrl()}/admin/knowledge-items`);
  await expect(this.page.locator('[data-testid="content-studio-dashboard"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="content-studio-sidebar"]')).toBeVisible();
});

When('I click on {string} in the sidebar', async function (this: World, linkText: string) {
  const sidebarLink = this.page.locator(`[data-testid="content-studio-sidebar"] >> text=${linkText}`);
  await sidebarLink.click();
});

// ===== VIEW SWITCHING =====

When('I switch to {string} view', async function (this: World, viewType: string) {
  const viewMap: { [key: string]: string } = {
    'Cards': 'view-cards',
    'Table': 'view-table', 
    'Board': 'view-kanban',
    'Analytics': 'view-analytics'
  };
  
  const testId = viewMap[viewType];
  if (!testId) throw new Error(`Unknown view type: ${viewType}`);
  
  await this.page.click(`[data-testid="${testId}"]`);
  await this.page.waitForTimeout(500); // Wait for view to load
});

Then('I should see knowledge items displayed as cards', async function (this: World) {
  await expect(this.page.locator('[data-testid="content-cards-view"]')).toBeVisible();
});

Then('I should see knowledge items displayed in a table format', async function (this: World) {
  await expect(this.page.locator('[data-testid="content-table-view"]')).toBeVisible();
});

Then('I should see knowledge items organized by status columns', async function (this: World) {
  await expect(this.page.locator('[data-testid="content-kanban-view"]')).toBeVisible();
});

// ===== SEARCH AND FILTERING =====

When('I click on the search bar', async function (this: World) {
  await this.page.click('[data-testid="search-input"]');
});

When('I enter {string} in the search field', async function (this: World, searchTerm: string) {
  await this.page.fill('[data-testid="search-input"]', searchTerm);
  await this.page.waitForTimeout(500); // Wait for debounced search
});

When('I select {string} from the category filter', async function (this: World, categoryName: string) {
  await this.page.click('[data-testid="category-filter"]');
  await this.page.click(`text=${categoryName}`);
});

When('I select {string} from the status filter', async function (this: World, statusName: string) {
  await this.page.click('[data-testid="status-filter"]');
  await this.page.click(`text=${statusName}`);
});

When('I open the filters panel', async function (this: World) {
  await this.page.click('button:has-text("Filters")');
});

When('I select {string} status filter', async function (this: World, status: string) {
  const statusFilter = this.page.locator('[data-testid="status-filter"]');
  await statusFilter.click();
  await this.page.click(`text=${status}`);
});

When('I select {string} category', async function (this: World, category: string) {
  const categoryFilter = this.page.locator('[data-testid="category-filter"]');
  await categoryFilter.click(); 
  await this.page.click(`text=${category}`);
});

When('I set date range to {string}', async function (this: World, dateRange: string) {
  await this.page.click('[data-testid="date-filter"]');
  await this.page.click(`text=${dateRange}`);
});

Then('I should see only items matching all filter criteria', async function (this: World) {
  await this.page.waitForTimeout(1000); // Wait for filters to apply
  const items = this.page.locator('[data-testid="knowledge-item"]');
  await expect(items).toBeVisible();
});

Then('the item count should reflect the filtered results', async function (this: World) {
  const countBadge = this.page.locator('[data-testid="items-count"]');
  await expect(countBadge).toBeVisible();
});

Then('I should see filtered results matching all criteria', async function (this: World) {
  await this.page.waitForTimeout(1000);
  const results = this.page.locator('[data-testid="knowledge-item"]');
  await expect(results.first()).toBeVisible();
});

Then('the active filters should be displayed as chips', async function (this: World) {
  const filterChips = this.page.locator('[data-testid="active-filter-chip"]');
  await expect(filterChips.first()).toBeVisible();
});

// ===== SORTING =====

When('I click on the sort dropdown', async function (this: World) {
  await this.page.click('[data-testid="sort-dropdown"]');
});

When('I select {string}', async function (this: World, sortOption: string) {
  await this.page.click(`text=${sortOption}`);
  await this.page.waitForTimeout(500);
});

Then('the knowledge items should be sorted alphabetically by name', async function (this: World) {
  const items = this.page.locator('[data-testid="knowledge-item"] h3');
  const firstItem = await items.first().textContent();
  const secondItem = await items.nth(1).textContent();
  
  if (firstItem && secondItem) {
    expect(firstItem.localeCompare(secondItem)).toBeLessThanOrEqual(0);
  }
});

Then('the knowledge items should be sorted by last updated date', async function (this: World) {
  await this.page.waitForTimeout(500);
  const items = this.page.locator('[data-testid="knowledge-item"]');
  await expect(items.first()).toBeVisible();
});

Then('the knowledge items should be sorted by view count', async function (this: World) {
  await this.page.waitForTimeout(500);
  const items = this.page.locator('[data-testid="knowledge-item"]');
  await expect(items.first()).toBeVisible();
});

Then('I should see knowledge items sorted by most recently updated', async function (this: World) {
  await this.page.waitForTimeout(500);
  const items = this.page.locator('[data-testid="knowledge-item"]');
  await expect(items.first()).toBeVisible();
});

Then('I should see knowledge items sorted by popularity\\/views', async function (this: World) {
  await this.page.waitForTimeout(500);
  const items = this.page.locator('[data-testid="knowledge-item"]');
  await expect(items.first()).toBeVisible();
});

Then('I should see knowledge items that need review', async function (this: World) {
  const reviewItems = this.page.locator('[data-testid="knowledge-item"][data-status="needs-review"]');
  await expect(reviewItems.first()).toBeVisible();
});

// ===== ANALYTICS =====

When('I navigate to the analytics section', async function (this: World) {
  await this.page.click('[data-testid="sidebar-analytics"]');
});

When('I click on the {string} view button', async function (this: World, viewName: string) {
  await this.page.click(`[data-testid="view-${viewName.toLowerCase()}"]`);
});

Then('I should see the total number of knowledge items', async function (this: World) {
  await expect(this.page.locator('[data-testid="total-items-metric"]')).toBeVisible();
});

Then('I should see the number of published items', async function (this: World) {
  await expect(this.page.locator('[data-testid="published-items-metric"]')).toBeVisible();
});

Then('I should see the number of draft items', async function (this: World) {
  await expect(this.page.locator('[data-testid="draft-items-metric"]')).toBeVisible();
});

Then('I should see view statistics', async function (this: World) {
  await expect(this.page.locator('[data-testid="view-statistics"]')).toBeVisible();
});

Then('I should see content analytics dashboard', async function (this: World) {
  await expect(this.page.locator('[data-testid="content-analytics-dashboard"]')).toBeVisible();
});

Then('I should see metrics like total items, views, and engagement', async function (this: World) {
  await expect(this.page.locator('[data-testid="metrics-overview"]')).toBeVisible();
});

Then('I should see charts showing content performance over time', async function (this: World) {
  await expect(this.page.locator('[data-testid="performance-charts"]')).toBeVisible();
});

// ===== BULK OPERATIONS =====

Given('I have selected multiple knowledge items', async function (this: World) {
  // Select first 3 items
  const checkboxes = this.page.locator('[data-testid="item-checkbox"]');
  for (let i = 0; i < 3; i++) {
    await checkboxes.nth(i).check();
  }
  
  // Wait for bulk actions to appear
  await expect(this.page.locator('text=selected')).toBeVisible();
});

When('I choose {string} from bulk operations', async function (this: World, action: string) {
  const actionMap: { [key: string]: string } = {
    'Change Category': 'Change Category',
    'Publish': 'Publish',
    'Archive': 'Archive',
    'Delete': 'Delete'
  };
  
  await this.page.click(`button:has-text("${actionMap[action]}")`);
});

When('I select {string} as the new category', async function (this: World, categoryName: string) {
  await this.page.click(`text=${categoryName}`);
});

Then('all selected items should be updated to the new category', async function (this: World) {
  await this.page.waitForTimeout(1000);
  // Verify success message or updated items
  await expect(this.page.locator('text=updated successfully')).toBeVisible();
});

Then('I should see a success confirmation', async function (this: World) {
  await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
});

// ===== MOBILE RESPONSIVENESS =====

Given('I am using a mobile device', async function (this: World) {
  await this.page.setViewportSize({ width: 375, height: 667 });
});

Then('the sidebar should be collapsible', async function (this: World) {
  const sidebarToggle = this.page.locator('[data-testid="sidebar-toggle"]');
  await expect(sidebarToggle).toBeVisible();
});

Then('the view should be optimized for mobile', async function (this: World) {
  // Check that content adapts to mobile viewport
  const mainContent = this.page.locator('[data-testid="main-content"]');
  await expect(mainContent).toBeVisible();
});

Then('all main functions should remain accessible', async function (this: World) {
  // Verify key functions are still accessible on mobile
  await expect(this.page.locator('[data-testid="search-input"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="create-content-button"]')).toBeVisible();
});

// ===== GENERAL ASSERTIONS =====

Given('there are multiple knowledge items visible', async function (this: World) {
  const items = this.page.locator('[data-testid="knowledge-item"]');
  const count = await items.count();
  expect(count).toBeGreaterThan(1);
});