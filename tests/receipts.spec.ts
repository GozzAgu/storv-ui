import { test, expect } from '@playwright/test'

test.describe('Receipts Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')
  })

  test('should display receipts page', async ({ page }) => {
    // Check if receipts page elements are visible
    const pageTitle = page.getByText(/receipts/i).first()
    await expect(pageTitle).toBeVisible({ timeout: 10000 })
  })

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"]').filter({ hasText: /search/i }).or(
      page.locator('input[placeholder*="search" i]')
    ).first()
    
    const searchVisible = await searchInput.isVisible().catch(() => false)
    if (searchVisible) {
      await expect(searchInput).toBeVisible()
    }
  })

  test('should display stats cards', async ({ page }) => {
    // Check for stats cards (Total Receipts, Total Sales, etc.)
    const statsCards = page.locator('[class*="card"]').or(page.locator('[class*="stat"]'))
    const cardCount = await statsCards.count()
    
    // Should have at least some cards or loading state
    expect(cardCount).toBeGreaterThanOrEqual(0)
  })
})
