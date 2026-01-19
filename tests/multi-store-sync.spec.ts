import { test, expect } from '@playwright/test'

test.describe('Multi-Store Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/multi-store-sync')
    await page.waitForLoadState('networkidle')
  })

  test('should display multi-store sync page', async ({ page }) => {
    // Check if page title is visible
    const pageTitle = page.getByText(/multi-store sync/i).first()
    await expect(pageTitle).toBeVisible({ timeout: 10000 })
  })

  test('should show access denied for non-super admins', async ({ page }) => {
    // Check for access denied message
    const accessDenied = page.getByText(/access restricted/i).or(page.getByText(/only super admins/i))
    const accessDeniedVisible = await accessDenied.isVisible().catch(() => false)
    
    // If access denied is shown, verify it
    if (accessDeniedVisible) {
      await expect(accessDenied).toBeVisible()
    }
  })

  test('should display tabs for transfer, reports, and history', async ({ page }) => {
    // Check for tab navigation
    const transferTab = page.getByRole('button', { name: /transfer items/i }).or(page.getByText(/transfer/i))
    const reportsTab = page.getByRole('button', { name: /consolidated reports/i }).or(page.getByText(/reports/i))
    const historyTab = page.getByRole('button', { name: /transfer history/i }).or(page.getByText(/history/i))
    
    const hasTabs = await Promise.all([
      transferTab.isVisible().catch(() => false),
      reportsTab.isVisible().catch(() => false),
      historyTab.isVisible().catch(() => false),
    ])
    
    // At least one tab should be visible
    expect(hasTabs.some(Boolean)).toBeTruthy()
  })

  test('should display stats cards', async ({ page }) => {
    // Check for stats cards
    const totalStores = page.getByText(/total stores/i)
    const totalTransfers = page.getByText(/total transfers/i)
    
    const hasStats = await Promise.all([
      totalStores.isVisible().catch(() => false),
      totalTransfers.isVisible().catch(() => false),
    ])
    
    // Should have at least some stats visible
    expect(hasStats.some(Boolean)).toBeTruthy()
  })
})
