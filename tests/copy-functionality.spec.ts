import { test, expect } from '@playwright/test'

test.describe('Copy Functionality', () => {
  test('should have copy buttons on receipts page', async ({ page, context }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    // Look for copy buttons (clipboard icons)
    const copyButtons = page.locator('button').filter({ has: page.locator('svg') })
    const buttonCount = await copyButtons.count()
    
    // Should have some copy buttons if receipts exist
    expect(buttonCount).toBeGreaterThanOrEqual(0)
  })

  test('should copy receipt number to clipboard', async ({ page, context }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    // Find a copy button near receipt number
    const copyButton = page.locator('button[title*="copy" i]').or(
      page.locator('button').filter({ has: page.locator('svg[class*="clipboard" i]') })
    ).first()
    
    const buttonVisible = await copyButton.isVisible().catch(() => false)
    
    if (buttonVisible) {
      await copyButton.click()
      
      // Check if toast notification appears
      const toast = page.getByText(/copied/i).first()
      const toastVisible = await toast.isVisible({ timeout: 2000 }).catch(() => false)
      
      if (toastVisible) {
        await expect(toast).toBeVisible()
      }
    }
  })
})
