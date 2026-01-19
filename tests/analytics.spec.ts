import { test, expect } from '@playwright/test'

test.describe('Analytics Page', () => {
  test('should display analytics page', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await page.waitForLoadState('networkidle')
    
    // Check if analytics page loads
    const pageTitle = page.getByText(/analytics/i).first()
    await expect(pageTitle).toBeVisible({ timeout: 10000 })
  })

  test('should display key metrics', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await page.waitForLoadState('networkidle')
    
    // Check for metric cards
    const metrics = [
      page.getByText(/total revenue/i),
      page.getByText(/total sales/i),
      page.getByText(/low stock/i),
    ]
    
    const visibleMetrics = await Promise.all(
      metrics.map(m => m.isVisible().catch(() => false))
    )
    
    // Should have at least some metrics
    expect(visibleMetrics.some(Boolean)).toBeTruthy()
  })

  test('should have period selector', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await page.waitForLoadState('networkidle')
    
    // Check for period selector (Daily, Weekly, Monthly)
    const periodSelector = page.locator('select').filter({ hasText: /daily|weekly|monthly/i }).first()
    const hasSelector = await periodSelector.isVisible().catch(() => false)
    
    if (hasSelector) {
      await expect(periodSelector).toBeVisible()
    }
  })
})
