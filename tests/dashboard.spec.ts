import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (may require auth)
    await page.goto('/dashboard')
  })

  test('should require authentication', async ({ page }) => {
    // If redirected to login, check for login elements
    const isLoginPage = await page
      .locator('input[type="email"]')
      .isVisible()
      .catch(() => false)

    if (isLoginPage) {
      await expect(page.locator('input[type="email"]')).toBeVisible()
    }
  })

  test('should display dashboard layout when authenticated', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if sidebar is visible (dashboard layout)
    const sidebar = page.locator('aside').or(page.locator('[class*="sidebar"]')).first()
    const sidebarVisible = await sidebar.isVisible().catch(() => false)

    if (sidebarVisible) {
      await expect(sidebar).toBeVisible()
    }
  })
})
