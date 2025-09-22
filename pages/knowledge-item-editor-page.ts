import { Page, Locator } from '@playwright/test';

export class KnowledgeItemEditorPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly categorySelect: Locator;
  readonly richTextEditor: Locator;
  readonly tagsInput: Locator;
  readonly statusSelect: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly nextStepButton: Locator;
  readonly previousStepButton: Locator;
  readonly livePreviewPanel: Locator;
  readonly templateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('[data-testid="title-input"]');
    this.descriptionTextarea = page.locator('[data-testid="description-textarea"]');
    this.categorySelect = page.locator('[data-testid="category-select"]');
    this.richTextEditor = page.locator('[data-testid="rich-text-editor"]');
    this.tagsInput = page.locator('[data-testid="tags-input"]');
    this.statusSelect = page.locator('[data-testid="status-select"]');
    this.saveButton = page.locator('[data-testid="save-button"]');
    this.publishButton = page.locator('[data-testid="publish-button"]');
    this.nextStepButton = page.locator('[data-testid="next-step-button"]');
    this.previousStepButton = page.locator('[data-testid="previous-step-button"]');
    this.livePreviewPanel = page.locator('[data-testid="live-preview-panel"]');
    this.templateButton = page.locator('[data-testid="use-template-button"]');
  }

  async goto() {
    await this.page.goto('/admin/create-knowledge-item');
  }

  async gotoEdit(itemId: string) {
    await this.page.goto(`/admin/edit-knowledge-item/${itemId}`);
  }

  async fillBasicInformation(data: {
    title?: string;
    description?: string;
    category?: string;
  }) {
    if (data.title) {
      await this.titleInput.fill(data.title);
    }
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }
    if (data.category) {
      await this.categorySelect.click();
      await this.page.click(`text=${data.category}`);
    }
  }

  async addRichContent(content: string) {
    const editor = this.richTextEditor.locator('.ProseMirror');
    await editor.fill(content);
  }

  async addFormattedContent(options: {
    heading?: string;
    bulletList?: string[];
    link?: { text: string; url: string };
    bold?: boolean;
    italic?: boolean;
  }) {
    const editor = this.richTextEditor.locator('.ProseMirror');
    
    if (options.heading) {
      await editor.type(options.heading);
      await editor.press('Control+a');
      await this.page.click('[data-testid="heading-button"]');
      await editor.press('End');
      await editor.press('Enter');
    }

    if (options.bulletList) {
      await this.page.click('[data-testid="bullet-list-button"]');
      for (const item of options.bulletList) {
        await editor.type(item);
        await editor.press('Enter');
      }
    }

    if (options.link) {
      await editor.type(options.link.text);
      await editor.press('Shift+Control+Left');
      await this.page.click('[data-testid="link-button"]');
      await this.page.fill('[data-testid="link-url-input"]', options.link.url);
      await this.page.click('[data-testid="apply-link-button"]');
    }

    if (options.bold) {
      await editor.press('Control+a');
      await this.page.click('[data-testid="bold-button"]');
    }

    if (options.italic) {
      await editor.press('Control+a');
      await this.page.click('[data-testid="italic-button"]');
    }
  }

  async addTags(tags: string[]) {
    for (const tag of tags) {
      await this.tagsInput.fill(tag);
      await this.tagsInput.press('Enter');
    }
  }

  async navigateToStep(step: 'basic' | 'content' | 'classification' | 'publication') {
    await this.page.click(`[data-testid="${step}-step-tab"]`);
  }

  async nextStep() {
    await this.nextStepButton.click();
  }

  async previousStep() {
    await this.previousStepButton.click();
  }

  async setStatus(status: 'draft' | 'published') {
    await this.statusSelect.click();
    await this.page.click(`text=${status}`);
  }

  async save() {
    await this.saveButton.click();
  }

  async publish() {
    await this.publishButton.click();
  }

  async useTemplate(templateName: string) {
    await this.templateButton.click();
    await this.page.click(`text=${templateName}`);
    await this.page.click('[data-testid="select-template-button"]');
  }

  async uploadImage(imagePath: string) {
    await this.page.click('[data-testid="image-upload-button"]');
    await this.page.setInputFiles('[data-testid="file-input"]', imagePath);
    await this.page.click('[data-testid="upload-confirm-button"]');
  }

  async getPreviewContent(): Promise<string> {
    return await this.livePreviewPanel.textContent() || '';
  }

  async waitForSaveSuccess() {
    await this.page.waitForSelector('text=saved successfully', { timeout: 10000 });
  }

  async waitForPublishSuccess() {
    await this.page.waitForSelector('text=published successfully', { timeout: 10000 });
  }
}