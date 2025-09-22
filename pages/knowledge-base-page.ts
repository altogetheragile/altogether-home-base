import { Page } from '@playwright/test';

export class KnowledgeBasePage {
  constructor(private page: Page) {}

  async switchView(viewType: 'cards' | 'table' | 'kanban' | 'analytics') {
    const viewButtons = {
      cards: '[data-testid="view-cards"]',
      table: '[data-testid="view-table"]', 
      kanban: '[data-testid="view-kanban"]',
      analytics: '[data-testid="view-analytics"]'
    };

    await this.page.click(viewButtons[viewType]);
    await this.page.waitForLoadState('networkidle');
  }

  async search(searchTerm: string) {
    await this.page.fill('[data-testid="search-input"], input[placeholder*="Search"]', searchTerm);
    await this.page.press('[data-testid="search-input"], input[placeholder*="Search"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category: string) {
    await this.page.click('[data-testid="category-filter"]');
    await this.page.click(`text=${category}`);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: 'all' | 'published' | 'draft') {
    await this.page.click('[data-testid="status-filter"]');
    await this.page.click(`text=${status}`);
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(sortOption: 'recent' | 'alphabetical' | 'popularity') {
    await this.page.click('[data-testid="sort-dropdown"]');
    await this.page.click(`text=${sortOption}`);
    await this.page.waitForLoadState('networkidle');
  }

  async createNewItem() {
    await this.page.click('[data-testid="create-new-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async selectItem(itemName: string) {
    await this.page.click(`[data-testid="knowledge-item"]:has-text("${itemName}") input[type="checkbox"]`);
  }

  async bulkDelete() {
    await this.page.click('[data-testid="bulk-actions"]');
    await this.page.click('text=Delete Selected');
    await this.page.click('[data-testid="confirm-delete"]');
    await this.page.waitForLoadState('networkidle');
  }

  async editItem(itemName: string) {
    await this.page.click(`[data-testid="knowledge-item"]:has-text("${itemName}") [data-testid="edit-button"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async fillBasicInformation(data: Record<string, string>) {
    if (data.Name) {
      await this.page.fill('input[name="name"]', data.Name);
    }
    if (data.Description) {
      await this.page.fill('textarea[name="description"]', data.Description);
    }
    if (data.Category) {
      await this.page.click('[data-testid="category-select"]');
      await this.page.click(`text=${data.Category}`);
    }
  }

  async addContent(content: string) {
    // Navigate to content step if not already there
    await this.page.click('text=Content').catch(() => {});
    
    // Fill in rich text editor
    await this.page.fill('[data-testid="content-editor"], .ProseMirror', content);
  }

  async saveAsDraft() {
    await this.page.click('[data-testid="save-draft"]');
    await this.page.waitForLoadState('networkidle');
  }

  async publish() {
    await this.page.click('[data-testid="publish-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async preview() {
    await this.page.click('[data-testid="preview-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async addUseCase(useCaseData: Record<string, string>) {
    await this.page.click('[data-testid="add-use-case"]');
    
    if (useCaseData.Title) {
      await this.page.fill('input[name="title"]', useCaseData.Title);
    }
    if (useCaseData.Description) {
      await this.page.fill('textarea[name="description"]', useCaseData.Description);
    }
    if (useCaseData.Context) {
      await this.page.fill('textarea[name="context"]', useCaseData.Context);
    }
    if (useCaseData.Outcome) {
      await this.page.fill('textarea[name="outcome"]', useCaseData.Outcome);
    }
    
    await this.page.click('[data-testid="save-use-case"]');
  }

  async applyTemplate(templateName: string) {
    await this.page.click('[data-testid="apply-template"]');
    await this.page.click(`text=${templateName}`);
    await this.page.waitForLoadState('networkidle');
  }
}