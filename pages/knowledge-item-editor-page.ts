import { Page } from '@playwright/test';

export class KnowledgeItemEditorPage {
  constructor(private page: Page) {}

  // Navigation methods
  async openNewItemEditor() {
    await this.page.goto('/admin/knowledge/items/new');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="knowledge-item-editor"]', { timeout: 10000 });
  }

  async openExistingItemEditor(itemId: string) {
    await this.page.goto(`/admin/knowledge/items/${itemId}/edit`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="knowledge-item-editor"]', { timeout: 10000 });
  }

  // Step navigation methods
  async goToStep(stepName: string) {
    const stepMap: Record<string, string> = {
      'basic information': '[data-testid="step-basic-info"]',
      'content': '[data-testid="step-content"]',
      'classification': '[data-testid="step-classification"]',
      'use cases': '[data-testid="step-use-cases"]',
      'enhanced': '[data-testid="step-enhanced"]',
      'publication': '[data-testid="step-publication"]',
    };
    
    const selector = stepMap[stepName.toLowerCase()];
    if (selector) {
      await this.page.click(selector);
    } else {
      await this.page.click(`text=${stepName}`);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async clickNext() {
    await this.page.click('button:has-text("Next")');
    await this.page.waitForLoadState('networkidle');
  }

  async clickPrevious() {
    await this.page.click('button:has-text("Previous")');
    await this.page.waitForLoadState('networkidle');
  }

  // Basic Information step methods
  async fillBasicInformation(data: {
    name?: string;
    description?: string;
    summary?: string;
  }) {
    if (data.name) {
      await this.page.fill('[data-testid="field-name"]', data.name);
    }
    if (data.description) {
      await this.page.fill('[data-testid="field-description"]', data.description);
    }
    if (data.summary) {
      await this.page.fill('[data-testid="field-summary"]', data.summary);
    }
  }

  async checkBasicInformationFields() {
    const nameField = await this.page.locator('[data-testid="field-name"]').isVisible();
    const descField = await this.page.locator('[data-testid="field-description"]').isVisible();
    const summaryField = await this.page.locator('[data-testid="field-summary"]').isVisible();
    return nameField && descField && summaryField;
  }

  async checkValidationError(fieldName: string) {
    return await this.page.locator(`[data-testid="${fieldName}-error"]`).isVisible();
  }

  // Content step methods
  async fillRichTextEditor(content: string) {
    const editor = this.page.locator('[data-testid="rich-text-editor"] .ProseMirror');
    await editor.fill(content);
  }

  async addHeading(level: 1 | 2 | 3, text: string) {
    await this.page.click(`[data-testid="toolbar-heading-${level}"]`);
    await this.fillRichTextEditor(`${'#'.repeat(level)} ${text}`);
  }

  async addList(items: string[], ordered: boolean = false) {
    const listType = ordered ? 'ol' : 'ul';
    await this.page.click(`[data-testid="toolbar-${listType}"]`);
    
    const listContent = items.map(item => `${ordered ? '1.' : '-'} ${item}`).join('\n');
    await this.fillRichTextEditor(listContent);
  }

  async insertImage(url: string, alt?: string) {
    await this.page.click('[data-testid="toolbar-image"]');
    await this.page.fill('[data-testid="image-url"]', url);
    if (alt) {
      await this.page.fill('[data-testid="image-alt"]', alt);
    }
    await this.page.click('[data-testid="insert-image"]');
  }

  async insertLink(url: string, text: string) {
    await this.page.click('[data-testid="toolbar-link"]');
    await this.page.fill('[data-testid="link-url"]', url);
    await this.page.fill('[data-testid="link-text"]', text);
    await this.page.click('[data-testid="insert-link"]');
  }

  async checkRichTextEditorVisible() {
    return await this.page.locator('[data-testid="rich-text-editor"]').isVisible();
  }

  // Classification step methods
  async selectCategory(category: string) {
    await this.page.click('[data-testid="category-select"]');
    await this.page.click(`text=${category}`);
  }

  async selectLevel(level: string) {
    await this.page.click('[data-testid="level-select"]');
    await this.page.click(`text=${level}`);
  }

  async selectPlanningFocus(focus: string) {
    await this.page.click('[data-testid="planning-focus-select"]');
    await this.page.click(`text=${focus}`);
  }

  async addTags(tags: string[]) {
    for (const tag of tags) {
      await this.page.fill('[data-testid="tags-input"]', tag);
      await this.page.keyboard.press('Enter');
    }
  }

  async checkClassificationFields() {
    const categoryField = await this.page.locator('[data-testid="category-select"]').isVisible();
    const tagsField = await this.page.locator('[data-testid="tags-input"]').isVisible();
    return categoryField && tagsField;
  }

  // Use Cases step methods
  async addUseCase(data: {
    title: string;
    description: string;
    context?: string;
    outcome?: string;
    type?: 'generic' | 'example';
  }) {
    await this.page.click('[data-testid="add-use-case-button"]');
    
    await this.page.fill('[data-testid="use-case-title"]', data.title);
    await this.page.fill('[data-testid="use-case-description"]', data.description);
    
    if (data.context) {
      await this.page.fill('[data-testid="use-case-context"]', data.context);
    }
    if (data.outcome) {
      await this.page.fill('[data-testid="use-case-outcome"]', data.outcome);
    }
    if (data.type) {
      await this.page.selectOption('[data-testid="use-case-type"]', data.type);
    }
    
    await this.page.click('[data-testid="save-use-case"]');
  }

  async editUseCase(index: number, data: Partial<{
    title: string;
    description: string;
    context: string;
    outcome: string;
  }>) {
    await this.page.click(`[data-testid="edit-use-case-${index}"]`);
    
    if (data.title) {
      await this.page.fill('[data-testid="use-case-title"]', data.title);
    }
    if (data.description) {
      await this.page.fill('[data-testid="use-case-description"]', data.description);
    }
    
    await this.page.click('[data-testid="save-use-case"]');
  }

  async deleteUseCase(index: number) {
    await this.page.click(`[data-testid="delete-use-case-${index}"]`);
    await this.page.click('[data-testid="confirm-delete"]');
  }

  async checkUseCaseManager() {
    return await this.page.locator('[data-testid="use-case-manager"]').isVisible();
  }

  async getUseCaseCount() {
    return await this.page.locator('[data-testid="use-case-item"]').count();
  }

  // Template methods
  async applyTemplate(templateName: string) {
    await this.page.click('[data-testid="apply-template"]');
    await this.page.click(`text=${templateName}`);
    await this.page.click('[data-testid="confirm-apply-template"]');
  }

  async checkTemplateApplied() {
    // Check if template content has been loaded
    const nameField = await this.page.locator('[data-testid="field-name"]').inputValue();
    return nameField.length > 0;
  }

  async checkTemplateFields() {
    return await this.page.locator('[data-testid="template-fields"]').isVisible();
  }

  // Save and publish methods
  async saveDraft() {
    await this.page.click('[data-testid="save-draft"]');
    await this.page.waitForLoadState('networkidle');
  }

  async publish() {
    await this.page.click('[data-testid="publish"]');
    await this.page.waitForLoadState('networkidle');
  }

  async checkSavedAsDraft() {
    return await this.page.locator('text=Draft saved').isVisible({ timeout: 5000 });
  }

  async checkPublished() {
    return await this.page.locator('text=Published successfully').isVisible({ timeout: 5000 });
  }

  // Preview methods
  async openPreview() {
    await this.page.click('[data-testid="preview-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async checkPreview() {
    return await this.page.locator('[data-testid="public-preview"]').isVisible();
  }

  async returnToEditor() {
    await this.page.click('[data-testid="return-to-editor"]');
    await this.page.waitForLoadState('networkidle');
  }

  // Validation methods
  async checkValidationErrors() {
    return await this.page.locator('[data-testid="validation-errors"]').isVisible();
  }

  async checkCompletionGuidance() {
    return await this.page.locator('[data-testid="completion-guidance"]').isVisible();
  }

  async checkPublishPrevented() {
    // Should still be in editor, not redirected
    return await this.page.locator('[data-testid="knowledge-item-editor"]').isVisible();
  }

  // Auto-save methods
  async makeContentChanges() {
    await this.page.fill('[data-testid="field-description"]', `Updated at ${Date.now()}`);
  }

  async waitForAutoSave(seconds: number = 3) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  async checkAutoSaveIndicator() {
    return await this.page.locator('[data-testid="auto-save-indicator"]').isVisible();
  }

  // General utility methods
  async checkEditorLoaded() {
    return await this.page.locator('[data-testid="knowledge-item-editor"]').isVisible();
  }

  async checkSuccessMessage() {
    return await this.page.locator('[data-testid="success-message"]').isVisible();
  }

  async checkCurrentStep(stepName: string) {
    const stepMap: Record<string, string> = {
      'basic information': '[data-testid="step-basic-info"]',
      'content': '[data-testid="step-content"]', 
      'classification': '[data-testid="step-classification"]',
      'use cases': '[data-testid="step-use-cases"]',
    };
    
    const selector = stepMap[stepName.toLowerCase()];
    if (selector) {
      return await this.page.locator(`${selector}[aria-current="step"]`).isVisible();
    }
    return false;
  }

  async checkNextButtonEnabled() {
    const nextButton = this.page.locator('button:has-text("Next")');
    return await nextButton.isEnabled();
  }

  async checkNextButtonDisabled() {
    const nextButton = this.page.locator('button:has-text("Next")');
    return await nextButton.isDisabled();
  }
}