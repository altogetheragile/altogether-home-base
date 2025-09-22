import { Given } from '@cucumber/cucumber';
import { CustomWorld } from '../features/support/world';
import { LoginPage } from '../pages/login-page';

Given('I am logged in as an admin user', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  
  // Navigate to login page
  await this.page.goto('/auth');
  
  // Perform login with admin credentials
  await loginPage.login('admin@test.com', 'password123');
  
  // Wait for redirect to indicate successful login
  await this.page.waitForURL('/', { timeout: 10000 });
  
  // Verify we're logged in by checking for user-specific elements
  await this.page.waitForSelector('[data-testid="user-avatar"]', { timeout: 5000 });
});

Given('I am not logged in', async function (this: CustomWorld) {
  // Clear any existing authentication
  await this.context.clearCookies();
  await this.context.clearPermissions();
  
  // Navigate to home page to ensure we're not logged in
  await this.page.goto('/');
  
  // Verify we see login/signup options
  await this.page.waitForSelector('text=Sign In', { timeout: 5000 });
});