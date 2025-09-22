import { Page, Locator } from '@playwright/test';

export class KnowledgeBaseDashboardPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly filtersPanel: Locator;
  readonly filtersToggle: Locator;
  readonly itemsTable: Locator;
  readonly cardsContainer: Locator;
  readonly boardContainer: Locator;
  readonly bulkOperationsPanel: Locator;
  readonly analyticsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('h1');
    this.createButton = page.locator('[data-testid="create-new-item"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.filtersPanel = page.locator('[data-testid="filters-panel"]');
    this.filtersToggle = page.locator('[data-testid="filters-toggle"]');
    this.itemsTable = page.locator('[data-testid="items-table"]');
    this.cardsContainer = page.locator('[data-testid="cards-container"]');
    this.boardContainer = page.locator('[data-testid="board-container"]');
    this.bulkOperationsPanel = page.locator('[data-testid="bulk-operations-panel"]');
    this.analyticsSection = page.locator('[data-testid="analytics-section"]');
  }

  async goto() {
    await this.page.goto('/admin/knowledge-items');
  }

  async searchForItem(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
  }

  async openFilters() {
    const isVisible = await this.filtersPanel.isVisible();
    if (!isVisible) {
      await this.filtersToggle.click();
    }
  }

  async selectView(view: 'table' | 'cards' | 'board') {
    await this.page.click(`[data-testid="${view}-view-button"]`);
  }

  async selectItems(count: number = 3) {
    const checkboxes = this.page.locator('[data-testid="item-selection-checkbox"]');
    const availableCount = await checkboxes.count();
    const selectCount = Math.min(count, availableCount);

    for (let i = 0; i < selectCount; i++) {
      await checkboxes.nth(i).check();
    }
  }

  async performBulkOperation(operation: string, options?: any) {
    await this.page.click('[data-testid="bulk-operations-dropdown"]');
    await this.page.click(`text=${operation}`);

    if (options) {
      // Handle specific operation options
      if (operation === 'Change Category' && options.category) {
        await this.page.click('[data-testid="category-select"]');
        await this.page.click(`text=${options.category}`);
        await this.page.click('[data-testid="apply-category-change"]');
      }
    }
  }

  async getItemCount(): Promise<number> {
    const items = this.page.locator('[data-testid="knowledge-item"]');
    return await items.count();
  }

  async editItem(itemName: string) {
    const row = this.page.locator(`tr:has-text("${itemName}")`);
    await row.locator('[data-testid="edit-button"]').click();
  }

  async deleteItem(itemName: string) {
    const row = this.page.locator(`tr:has-text("${itemName}")`);
    await row.locator('[data-testid="delete-button"]').click();
    await this.page.click('[data-testid="confirm-delete"]');
  }

  async applyFilters(filters: {
    status?: string;
    category?: string;
    dateRange?: string;
  }) {
    await this.openFilters();

    if (filters.status) {
      await this.page.click('[data-testid="status-filter"]');
      await this.page.click(`[data-testid="status-${filters.status.toLowerCase()}"]`);
    }

    if (filters.category) {
      await this.page.click('[data-testid="category-filter-dropdown"]');
      await this.page.click(`text=${filters.category}`);
    }

    if (filters.dateRange) {
      await this.page.click('[data-testid="date-range-preset"]');
      await this.page.click(`text=${filters.dateRange}`);
    }
  }

  async getAnalyticsData() {
    await this.page.click('[data-testid="analytics-tab"]');
    
    const totalItems = await this.page.locator('[data-testid="total-items-count"]').textContent();
    const publishedCount = await this.page.locator('[data-testid="published-count"]').textContent();
    const draftCount = await this.page.locator('[data-testid="draft-count"]').textContent();

    return {
      total: parseInt(totalItems || '0'),
      published: parseInt(publishedCount || '0'),
      draft: parseInt(draftCount || '0')
    };
  }
}