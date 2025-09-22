import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../features/support/world';

Given('I am logged in as an admin user', async function (this: CustomWorld) {
  // Navigate to login page if not already authenticated
  await this.page.goto('/auth');
  
  // Wait for page to load
  await this.page.waitForLoadState('networkidle');
  
  // Check if already logged in by looking for admin interface
  const adminElement = await this.page.locator('[data-testid="admin-header"]').isVisible({ timeout: 2000 }).catch(() => false);
  
  if (!adminElement) {
    // Need to log in - look for email input
    const emailInput = this.page.locator('input[type="email"], input[placeholder*="email" i], [data-testid="email-input"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    
    // Fill in admin credentials
    await emailInput.first().fill('admin@test.com');
    
    const passwordInput = this.page.locator('input[type="password"], [data-testid="password-input"]');
    await passwordInput.first().fill('admin123');
    
    // Click login button
    const loginButton = this.page.locator('button:has-text("Sign In"), button:has-text("Login"), [data-testid="login-button"]');
    await loginButton.first().click();
    
    // Wait for login to complete
    await this.page.waitForLoadState('networkidle');
    
    // Verify we're logged in as admin
    await expect(this.page.locator('[data-testid="admin-header"], .admin-layout')).toBeVisible({ timeout: 10000 });
  }
});

When('I log out', async function (this: CustomWorld) {
  // Look for user menu or logout button
  const userMenu = this.page.locator('[data-testid="user-menu"], [data-testid="user-avatar"]');
  
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await this.page.click('button:has-text("Sign Out"), button:has-text("Logout"), [data-testid="logout-button"]');
  } else {
    // Try direct logout button
    await this.page.click('button:has-text("Sign Out"), button:has-text("Logout")');
  }
  
  // Wait for logout to complete
  await this.page.waitForLoadState('networkidle');
});

Then('I should be logged out', async function (this: CustomWorld) {
  // Should be redirected to login page or see login form
  await expect(this.page.locator('input[type="email"], [data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
});

Given('I am not logged in', async function (this: CustomWorld) {
  // Clear any existing authentication
  await this.page.goto('/auth');
  await this.page.waitForLoadState('networkidle');
  
  // If already on login page, we're good
  const loginVisible = await this.page.locator('input[type="email"]').isVisible().catch(() => false);
  
  if (!loginVisible) {
    // Need to logout first
    try {
      const userMenu = this.page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page.click('text=Sign Out');
        await this.page.waitForLoadState('networkidle');
      }
    } catch {
      // Already logged out
    }
  }
});

When('I try to access the admin area', async function (this: CustomWorld) {
  await this.page.goto('/admin');
  await this.page.waitForLoadState('networkidle');
});

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/auth|\/login/);
  await expect(this.page.locator('input[type="email"]')).toBeVisible();
});

Given('I have valid admin credentials', async function (this: CustomWorld) {
  // This is a setup step - credentials are defined in the login step
  // We'll use admin@test.com / admin123 as default test credentials
});

When('I enter valid admin credentials', async function (this: CustomWorld) {
  await this.page.fill('input[type="email"]', 'admin@test.com');
  await this.page.fill('input[type="password"]', 'admin123');
});

When('I enter invalid credentials', async function (this: CustomWorld) {
  await this.page.fill('input[type="email"]', 'invalid@test.com');
  await this.page.fill('input[type="password"]', 'wrongpassword');
});

When('I click the login button', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Sign In"), button:has-text("Login")');
  await this.page.waitForLoadState('networkidle');
});

Then('I should see an error message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="error-message"], .error, text=Invalid')).toBeVisible({ timeout: 5000 });
});

Then('I should be logged in successfully', async function (this: CustomWorld) {
  // Should see admin interface or be redirected to dashboard
  await expect(this.page.locator('[data-testid="admin-header"], .admin-layout')).toBeVisible({ timeout: 10000 });
});

Then('I should have access to admin functions', async function (this: CustomWorld) {
  // Verify admin-specific elements are available
  await expect(this.page.locator('[data-testid="admin-navigation"], text=Admin')).toBeVisible();
});