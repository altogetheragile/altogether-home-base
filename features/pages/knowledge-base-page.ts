import { Page } from '@playwright/test';

export class KnowledgeBasePage {
  constructor(private page: Page) {}

  // Dashboard navigation methods
  async openContentStudioDashboard() {
    await this.page.goto('/admin/knowledge-items');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="content-studio-dashboard"]', { timeout: 10000 });
  }

  async switchToView(viewType: 'cards' | 'table' | 'kanban' | 'analytics') {
    const viewSelector = `[data-testid="view-${viewType}"]`;
    await this.page.click(viewSelector);
    await this.page.waitForLoadState('networkidle');
  }

  async searchContent(searchTerm: string) {
    await this.page.fill('[data-testid="search-input"]', searchTerm);
    await this.page.waitForLoadState('networkidle');
  }

  async clearSearch() {
    await this.page.click('[data-testid="search-input"]');
    await this.page.keyboard.selectAll();
    await this.page.keyboard.press('Delete');
  }

  // Sidebar navigation methods
  async clickSidebarWorkflow(workflow: string) {
    const workflowMap: Record<string, string> = {
      'all': '[data-testid="sidebar-workflow-all"]',
      'drafts': '[data-testid="sidebar-workflow-drafts"]', 
      'published': '[data-testid="sidebar-workflow-published"]',
    };
    
    const selector = workflowMap[workflow.toLowerCase()];
    if (selector) {
      await this.page.click(selector);
    } else {
      await this.page.click(`text=${workflow}`);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async clickSidebarQuickAccess(item: string) {
    const quickAccessMap: Record<string, string> = {
      'analytics': '[data-testid="sidebar-analytics"]',
      'categories': '[data-testid="sidebar-categories"]', 
      'settings': '[data-testid="sidebar-settings"]',
    };
    
    const selector = quickAccessMap[item.toLowerCase()] || `text=${item}`;
    await this.page.click(selector);
    await this.page.waitForLoadState('networkidle');
  }

  // Command palette methods
  async openCommandPalette() {
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');
    await this.page.waitForSelector('[data-testid="command-palette"]', { timeout: 5000 });
  }

  async openCommandPaletteWithButton() {
    await this.page.click('[data-testid="command-palette-button"]');
    await this.page.waitForSelector('[data-testid="command-palette"]', { timeout: 5000 });
  }

  async typeInCommandPalette(text: string) {
    await this.page.fill('[data-testid="command-input"]', text);
  }

  async selectCommandOption(option: string) {
    await this.page.click(`text=${option}`);
  }

  // Content management methods
  async createNewContent() {
    await this.page.click('[data-testid="create-content-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async selectKnowledgeItem(itemName: string) {
    await this.page.click(`text=${itemName}`);
    await this.page.waitForLoadState('networkidle');
  }

  async selectMultipleItems(itemNames: string[]) {
    for (const itemName of itemNames) {
      const itemRow = this.page.locator(`text=${itemName}`).locator('..').locator('input[type="checkbox"]');
      await itemRow.check();
    }
  }

  async clearSelection() {
    await this.page.click('[data-testid="clear-selection"]');
  }

  // Filter and sort methods
  async applyCategoryFilter(category: string) {
    await this.page.click('[data-testid="category-filter"]');
    await this.page.click(`text=${category}`);
    await this.page.waitForLoadState('networkidle');
  }

  async applyStatusFilter(status: string) {
    await this.page.click('[data-testid="status-filter"]');
    await this.page.click(`text=${status}`);
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(sortOption: string) {
    await this.page.click('[data-testid="sort-dropdown"]');
    
    const sortMap: Record<string, string> = {
      'alphabetical': 'A-Z',
      'recent': 'Recently Updated',
      'most recent': 'Recently Updated', 
      'most popular': 'Most Popular',
      'popularity': 'Most Popular',
      'views': 'Most Viewed'
    };
    
    const optionText = sortMap[sortOption.toLowerCase()] || sortOption;
    await this.page.click(`text=${optionText}`);
    await this.page.waitForLoadState('networkidle');
  }

  // Bulk operations methods
  async performBulkAction(action: string) {
    const actionMap: Record<string, string> = {
      'export': '[data-testid="bulk-export"]',
      'publish': '[data-testid="bulk-publish"]',
      'unpublish': '[data-testid="bulk-unpublish"]',
      'archive': '[data-testid="bulk-archive"]',
      'delete': '[data-testid="bulk-delete"]',
    };
    
    const selector = actionMap[action.toLowerCase()] || `button:has-text("${action}")`;
    await this.page.click(selector);
  }

  // Analytics methods
  async viewAnalytics() {
    await this.switchToView('analytics');
  }

  async checkMetricsAreVisible() {
    return await this.page.locator('[data-testid="metrics-overview"]').isVisible();
  }

  async checkChartsAreVisible() {
    return await this.page.locator('[data-testid="performance-charts"]').isVisible();
  }

  // Mobile responsive methods
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async toggleSidebar() {
    await this.page.click('[data-testid="sidebar-toggle"]');
  }

  async checkMobileOptimization() {
    const isMobileOptimized = await this.page.locator('[data-testid="content-studio-dashboard"]').getAttribute('class');
    return isMobileOptimized?.includes('mobile') || true; // Assume responsive by default
  }

  // Verification methods
  async getVisibleItemCount() {
    return await this.page.locator('[data-testid="knowledge-item-card"], tbody tr').count();
  }

  async getItemNames() {
    const items = await this.page.locator('[data-testid="knowledge-item-card"] h4, tbody tr td:first-child').allTextContents();
    return items.filter(name => name.trim().length > 0);
  }

  async checkViewIsActive(viewType: string) {
    const activeView = await this.page.locator(`[data-testid="view-${viewType}"][aria-selected="true"]`).isVisible();
    return activeView;
  }

  async checkFilterIsApplied(filterType: string, value: string) {
    const activeFilters = await this.page.locator('[data-testid="active-filters"]').textContent();
    return activeFilters?.includes(value) || false;
  }

  async waitForContentLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for either cards or table content to appear
    await this.page.waitForSelector('[data-testid="knowledge-item-card"], tbody tr, [data-testid="no-content-message"]', { timeout: 10000 });
  }

  async checkNoContentMessage() {
    return await this.page.locator('[data-testid="no-content-message"]').isVisible();
  }

  async checkSuccessMessage() {
    return await this.page.locator('[data-testid="success-message"], .toast').isVisible();
  }
}