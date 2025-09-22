import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    // Fill in email
    await this.page.fill('input[type="email"], input[name="email"]', email);
    
    // Fill in password
    await this.page.fill('input[type="password"], input[name="password"]', password);
    
    // Click sign in button
    await this.page.click('button:has-text("Sign In")');
    
    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle');
  }

  async signUp(email: string, password: string, confirmPassword?: string) {
    // Switch to sign up mode if available
    await this.page.click('text=Sign Up').catch(() => {});
    
    // Fill in email
    await this.page.fill('input[type="email"], input[name="email"]', email);
    
    // Fill in password
    await this.page.fill('input[type="password"], input[name="password"]', password);
    
    // Fill in confirm password if field exists
    if (confirmPassword) {
      await this.page.fill('input[name="confirmPassword"]', confirmPassword);
    }
    
    // Click sign up button
    await this.page.click('button:has-text("Sign Up")');
    
    // Wait for navigation or confirmation
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    // Look for logout button or menu
    await this.page.click('[data-testid="user-menu"], [data-testid="user-avatar"]');
    await this.page.click('text=Logout, text=Sign Out');
    
    // Wait for navigation to login page
    await this.page.waitForURL('/auth');
  }

  async forgotPassword(email: string) {
    // Click forgot password link
    await this.page.click('text=Forgot Password');
    
    // Fill in email
    await this.page.fill('input[type="email"]', email);
    
    // Submit request
    await this.page.click('button:has-text("Reset Password")');
  }
}