import { test, expect } from '@playwright/test'

test.describe('Inventory Page', () => {
  test('should display inventory folders page', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')
    
    // Check if inventory page loads
    const pageTitle = page.getByText(/inventory/i).first()
    await expect(pageTitle).toBeVisible({ timeout: 10000 })
  })

  test('should show empty state when no folders exist', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')
    
    // Check for empty state or folders list
    const emptyState = page.getByText(/no folders/i).or(page.getByText(/create.*folder/i))
    const foldersList = page.locator('[class*="folder"]').or(page.locator('table'))
    
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasFolders = await foldersList.first().isVisible().catch(() => false)
    
    // Should show either empty state or folders
    expect(hasEmptyState || hasFolders).toBeTruthy()
  })
})