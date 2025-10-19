import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for User Story Canvas
 */
export class UserStoryCanvasPage {
  readonly page: Page;
  readonly aiGenerateButton: Locator;
  readonly storyLevelSelect: Locator;
  readonly userInputTextarea: Locator;
  readonly generateButton: Locator;
  readonly generatedStoryCard: Locator;
  readonly metadataPanel: Locator;
  readonly editStoryButton: Locator;
  readonly saveButton: Locator;
  readonly bulkEditButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aiGenerateButton = page.locator('button:has-text("Generate with AI")');
    this.storyLevelSelect = page.locator('[data-testid="story-level-select"]');
    this.userInputTextarea = page.locator('[data-testid="user-input-textarea"]');
    this.generateButton = page.locator('button:has-text("Generate")');
    this.generatedStoryCard = page.locator('[data-testid="generated-story"]');
    this.metadataPanel = page.locator('[data-testid="metadata-panel"]');
    this.editStoryButton = page.locator('[data-testid="edit-story-button"]');
    this.saveButton = page.locator('button:has-text("Save")');
    this.bulkEditButton = page.locator('button:has-text("Bulk Edit Metadata")');
  }

  async goto(projectId: string = 'test-project-id') {
    await this.page.goto(`/canvas/${projectId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openAIGenerationDialog() {
    await this.aiGenerateButton.click();
    await this.page.waitForSelector('[data-testid="ai-generation-dialog"]');
  }

  async selectStoryLevel(level: 'epic' | 'feature' | 'story' | 'task') {
    await this.storyLevelSelect.click();
    await this.page.locator(`[data-testid="story-level-option-${level}"]`).click();
  }

  async enterUserInput(input: string) {
    await this.userInputTextarea.fill(input);
  }

  async generateStory(level: string, input: string) {
    await this.openAIGenerationDialog();
    await this.selectStoryLevel(level as any);
    await this.enterUserInput(input);
    await this.generateButton.click();
  }

  async waitForGeneration(timeoutMs: number = 15000) {
    await this.page.waitForSelector('[data-testid="generated-story"]', {
      timeout: timeoutMs,
    });
  }

  async getStoryCards() {
    return this.page.locator('[data-testid="story-card"]');
  }

  async getStoryCardByTitle(title: string) {
    return this.page.locator(`[data-testid="story-card"]:has-text("${title}")`);
  }

  async openStoryMetadata(storyTitle?: string) {
    if (storyTitle) {
      const story = await this.getStoryCardByTitle(storyTitle);
      await story.click();
    } else {
      const firstStory = await this.getStoryCards();
      await firstStory.first().click();
    }
    await this.page.locator('[data-testid="metadata-panel-trigger"]').click();
  }

  async selectMetadataTab(tab: 'overview' | 'details' | 'readiness' | 'technical') {
    await this.page.locator(`[data-testid="metadata-tab-${tab}"]`).click();
  }

  async checkDoRItem(index: number) {
    await this.page.locator('[data-testid="dor-checkbox"]').nth(index).check();
  }

  async checkAllDoRItems() {
    const checkboxes = this.page.locator('[data-testid="dor-checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }
  }

  async checkDoDItem(index: number) {
    await this.page.locator('[data-testid="dod-checkbox"]').nth(index).check();
  }

  async getReadinessScore(): Promise<number> {
    const scoreText = await this.page
      .locator('[data-testid="readiness-score"]')
      .textContent();
    return parseInt(scoreText || '0');
  }

  async getCompletionScore(): Promise<number> {
    const scoreText = await this.page
      .locator('[data-testid="completion-score"]')
      .textContent();
    return parseInt(scoreText || '0');
  }

  async editStory() {
    await this.editStoryButton.first().click();
    await this.page.waitForSelector('[data-testid="story-editor"]');
  }

  async updateUserPersona(persona: string) {
    await this.page.locator('[data-testid="user-persona-input"]').fill(persona);
  }

  async updateBusinessValueScore(score: number) {
    await this.page
      .locator('[data-testid="business-value-score-input"]')
      .fill(score.toString());
  }

  async updateTechnicalComplexityScore(score: number) {
    await this.page
      .locator('[data-testid="technical-complexity-score-input"]')
      .fill(score.toString());
  }

  async saveStory() {
    await this.saveButton.click();
    await this.page.waitForSelector('[data-testid="save-success-toast"]', {
      timeout: 5000,
    });
  }

  async selectStories(count: number) {
    for (let i = 0; i < count; i++) {
      await this.page.locator('[data-testid="story-checkbox"]').nth(i).check();
    }
  }

  async bulkEditMetadata() {
    await this.bulkEditButton.click();
    await this.page.waitForSelector('[data-testid="bulk-edit-dialog"]');
  }

  async applyBulkEdit() {
    await this.page.locator('button:has-text("Apply to Selected")').click();
    await this.page.waitForSelector('[data-testid="bulk-update-success"]', {
      timeout: 10000,
    });
  }

  async getConfidenceLevelBadge() {
    return this.page.locator('[data-testid="confidence-level-badge"]');
  }

  async getErrorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  async getValidationError() {
    return this.page.locator('[data-testid="validation-error"]');
  }

  async isLoadingVisible(): Promise<boolean> {
    return this.page.locator('[data-testid="ai-generation-loader"]').isVisible();
  }
}
