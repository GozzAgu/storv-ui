import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/')
    
    // Check if page title is correct
    await expect(page).toHaveTitle(/Storvv/i)
    
    // Check if main heading is visible
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')
    
    // Check if hero section elements are visible
    const heroSection = page.locator('section').first()
    await expect(heroSection).toBeVisible()
  })

  test('should show "Launching Soon" modal when clicking sign in', async ({ page }) => {
    await page.goto('/')
    
    // Find and click sign in button/link
    const signInButton = page.getByRole('link', { name: /sign in/i }).or(page.getByText(/sign in/i)).first()
    if (await signInButton.isVisible()) {
      await signInButton.click()
      
      // Check if modal appears
      const modal = page.locator('[role="dialog"]').or(page.locator('.modal')).first()
      await expect(modal).toBeVisible({ timeout: 5000 })
    }
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check if navigation is visible
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })
})
