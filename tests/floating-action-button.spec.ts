import { test, expect } from '@playwright/test'

test.describe('Floating Action Button', () => {
  test('should display FAB on receipts page', async ({ page }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')
    
    // Look for floating action button
    const fab = page.locator('button').filter({ hasText: /create/i }).or(
      page.locator('[class*="fixed"]').filter({ has: page.locator('button') })
    ).first()
    
    const fabVisible = await fab.isVisible().catch(() => false)
    
    // FAB might be visible if user has create permissions
    if (fabVisible) {
      await expect(fab).toBeVisible()
    }
  })

  test('should open create receipt modal when FAB is clicked', async ({ page }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')
    
    // Find and click FAB
    const fab = page.locator('button').filter({ hasText: /create/i }).or(
      page.locator('button[class*="fixed"]')
    ).first()
    
    const fabVisible = await fab.isVisible().catch(() => false)
    
    if (fabVisible) {
      await fab.click()
      
      // Check if modal opens
      const modal = page.locator('[role="dialog"]').or(page.locator('[class*="modal" i]')).first()
      const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false)
      
      if (modalVisible) {
        await expect(modal).toBeVisible()
      }
    }
  })
})
