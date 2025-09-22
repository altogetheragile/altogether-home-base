import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';
import { AdminLayoutPage } from '../pages/admin-layout-page';

Given('I am on the knowledge base admin page', async function (this: CustomWorld) {
  await this.page.goto('/admin/knowledge-items');
  await this.page.waitForLoadState('networkidle');
  
  // Verify we're on the correct page
  await expect(this.page).toHaveURL(/\/admin\/knowledge-items/);
});

Given('I am on the content studio dashboard', async function (this: CustomWorld) {
  await this.page.goto('/admin/knowledge-items'); 
  await this.page.waitForLoadState('networkidle');
  
  // Wait for the dashboard to load
  await this.page.waitForSelector('[data-testid="content-studio-dashboard"]', { timeout: 10000 });
});

When('I visit the knowledge base admin page', async function (this: CustomWorld) {
  await this.page.goto('/admin/knowledge-items');
  await this.page.waitForLoadState('networkidle');
});

When('I navigate to {string}', async function (this: CustomWorld, pageName: string) {
  const adminLayout = new AdminLayoutPage(this.page);
  await adminLayout.navigateToPage(pageName);
});

Then('I should be on the {string} page', async function (this: CustomWorld, pageName: string) {
  const expectedPaths: Record<string, string> = {
    'knowledge base admin': '/admin/knowledge-items',
    'dashboard': '/admin',
    'events': '/admin/events',
    'templates': '/admin/templates',
  };
  
  const expectedPath = expectedPaths[pageName.toLowerCase()];
  if (expectedPath) {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }
});

When('I press {string}', async function (this: CustomWorld, keys: string) {
  // Handle keyboard shortcuts
  const keyMapping: Record<string, string> = {
    'Ctrl+K': 'Control+KeyK',
    'Cmd+K': 'Meta+KeyK',
    'Escape': 'Escape',
    'Enter': 'Enter',
  };
  
  const keyToPress = keyMapping[keys] || keys;
  await this.page.keyboard.press(keyToPress);
});