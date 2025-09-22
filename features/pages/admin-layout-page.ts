import { Page } from '@playwright/test';

export class AdminLayoutPage {
  constructor(private page: Page) {}

  async navigateToPage(pageName: string) {
    const navigationMap: Record<string, string> = {
      'knowledge items': '[data-testid="nav-knowledge-items"]',
      'events': '[data-testid="nav-events"]',
      'templates': '[data-testid="nav-templates"]',
      'media': '[data-testid="nav-media"]',
      'analytics': '[data-testid="nav-analytics"]',
      'settings': '[data-testid="nav-settings"]',
    };

    const selector = navigationMap[pageName.toLowerCase()];
    if (selector) {
      await this.page.click(selector);
    } else {
      // Fallback to text-based navigation
      await this.page.click(`text=${pageName}`);
    }
    
    await this.page.waitForLoadState('networkidle');
  }

  async openSidebar() {
    await this.page.click('[data-testid="sidebar-toggle"]');
  }

  async closeSidebar() {
    await this.page.click('[data-testid="sidebar-toggle"]');
  }

  async isLoggedInAsAdmin() {
    // Check for admin-specific elements
    return await this.page.locator('[data-testid="admin-header"]').isVisible();
  }

  async openUserMenu() {
    await this.page.click('[data-testid="user-menu"], [data-testid="user-avatar"]');
  }

  async switchToMode(mode: 'light' | 'dark') {
    await this.openUserMenu();
    await this.page.click(`[data-testid="theme-${mode}"]`);
  }

  async getPageTitle() {
    return await this.page.locator('h1, [data-testid="page-title"]').textContent();
  }

  async getBreadcrumbs() {
    const breadcrumbs = await this.page.locator('[data-testid="breadcrumb"] a').allTextContents();
    return breadcrumbs;
  }
}