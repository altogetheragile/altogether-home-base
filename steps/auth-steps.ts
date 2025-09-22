import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { World } from '../support/world';

// Helper to get base URL
const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:5173';

Given('I am logged in as an admin user', async function (this: World) {
  await this.page.goto(`${getBaseUrl()}/auth`);
  
  // Use test admin credentials
  await this.page.fill('[data-testid="email-input"]', 'admin@test.com');
  await this.page.fill('[data-testid="password-input"]', 'adminpassword');
  await this.page.click('[data-testid="login-button"]');
  
  // Wait for redirect to dashboard
  await this.page.waitForURL('/admin/**');
  
  // Verify admin access
  await expect(this.page.locator('[data-testid="admin-nav"]')).toBeVisible();
});

Given('I am on the login page', async function (this: World) {
  await this.page.goto(`${getBaseUrl()}/auth`);
  await expect(this.page.locator('h1')).toHaveText(/sign in/i);
});

When('I enter valid admin credentials', async function (this: World) {
  await this.page.fill('[data-testid="email-input"]', 'admin@test.com');
  await this.page.fill('[data-testid="password-input"]', 'adminpassword');
});

When('I click the login button', async function (this: World) {
  await this.page.click('[data-testid="login-button"]');
});

Then('I should be redirected to the admin dashboard', async function (this: World) {
  await this.page.waitForURL('/admin/**');
  await expect(this.page).toHaveURL(/\/admin/);
});

Then('I should see the admin navigation menu', async function (this: World) {
  await expect(this.page.locator('[data-testid="admin-nav"]')).toBeVisible();
});

Given('I am not logged in', async function (this: World) {
  // Clear any existing session
  await this.page.context().clearCookies();
  await this.page.goto(`${getBaseUrl()}/`);
});

When('I try to access the admin knowledge base page directly', async function (this: World) {
  await this.page.goto(`${getBaseUrl()}/admin/knowledge-items`);
});

Then('I should be redirected to the login page', async function (this: World) {
  await this.page.waitForURL('**/auth**');
  await expect(this.page).toHaveURL(/\/auth/);
});

Then('I should see {string}', async function (this: World, expectedMessage: string) {
  await expect(this.page.locator('text=' + expectedMessage)).toBeVisible();
});