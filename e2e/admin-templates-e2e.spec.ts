
import { test, expect } from '@playwright/test'

test.describe('Admin Templates E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and assume we're logged in as admin
    await page.goto('/')
    
    // Mock authentication state for admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { 
          id: 'admin-user-id', 
          email: 'admin@example.com',
          role: 'admin'
        }
      }))
    })
  })

  test('admin can create a new template', async ({ page }) => {
    // Navigate to admin templates page
    await page.goto('/admin/templates')
    
    // Wait for page to load
    await expect(page.getByText('Event Templates')).toBeVisible()
    
    // Click Add Template button
    await page.getByRole('button', { name: 'Add Template' }).click()
    
    // Fill out the form
    await page.getByLabel('Template Title').fill('Test Template E2E')
    await page.getByLabel('Description').fill('This is a test template created via E2E')
    await page.getByLabel('Duration (days)').fill('3')
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Template' }).click()
    
    // Verify template was created (this would require actual backend integration)
    await expect(page.getByText('Test Template E2E')).toBeVisible()
  })

  test('admin can edit an existing template', async ({ page }) => {
    await page.goto('/admin/templates')
    
    // Wait for templates to load
    await expect(page.getByText('Event Templates')).toBeVisible()
    
    // Click edit button on first template (assuming one exists)
    await page.locator('[data-testid="template-card"]').first().getByRole('button').first().click()
    
    // Modify the template
    await page.getByLabel('Template Title').fill('Updated Template Title')
    
    // Submit the changes
    await page.getByRole('button', { name: 'Update Template' }).click()
    
    // Verify the update
    await expect(page.getByText('Updated Template Title')).toBeVisible()
  })

  test('admin can create event from template', async ({ page }) => {
    await page.goto('/admin/templates')
    
    // Wait for templates to load
    await expect(page.getByText('Event Templates')).toBeVisible()
    
    // Click "Create Event from Template" button
    await page.getByText('Create Event from Template').first().click()
    
    // Should navigate to event creation page with template pre-filled
    await expect(page.url()).toContain('/admin/events/new')
    await expect(page.getByText('Create Event from')).toBeVisible()
  })

  test('non-admin user cannot access templates page', async ({ page }) => {
    // Mock non-admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-user-token',
        user: { 
          id: 'regular-user-id', 
          email: 'user@example.com',
          role: 'user'
        }
      }))
    })
    
    await page.goto('/admin/templates')
    
    // Should be redirected or see access denied
    await expect(page.getByText('Access Denied')).toBeVisible()
  })

  test('template search and filter functionality works', async ({ page }) => {
    await page.goto('/admin/templates')
    
    // Wait for templates to load
    await expect(page.getByText('Event Templates')).toBeVisible()
    
    // Use search functionality
    await page.getByPlaceholder(/search/i).fill('Agile')
    
    // Should filter results
    await expect(page.getByText('Agile')).toBeVisible()
    
    // Clear search
    await page.getByRole('button', { name: /clear/i }).click()
    
    // Should show all templates again
    await expect(page.getByText('Event Templates')).toBeVisible()
  })
})
