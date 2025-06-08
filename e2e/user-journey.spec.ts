
import { test, expect } from '@playwright/test'

test.describe('Main User Journey', () => {
  test('should allow user to browse events and view details', async ({ page }) => {
    await page.goto('/')
    
    // Check homepage loads
    await expect(page.getByText('Transform Your Leadership')).toBeVisible()
    
    // Navigate to events
    await page.getByRole('link', { name: 'Events' }).click()
    await expect(page).toHaveURL('/events')
    
    // Check events page loads
    await expect(page.getByText('Upcoming Events')).toBeVisible()
    
    // Click on first event if available
    const firstEventCard = page.locator('[data-testid="event-card"]').first()
    if (await firstEventCard.count() > 0) {
      await firstEventCard.getByText('View Details').click()
      
      // Should be on event detail page
      await expect(page.url()).toContain('/events/')
    }
  })

  test('should redirect unauthenticated users to auth page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth')
  })

  test('should show sign in form', async ({ page }) => {
    await page.goto('/auth')
    
    // Check auth form elements
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
})
