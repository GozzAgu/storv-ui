import { test, expect } from '@playwright/test'

/**
 * Pagination appears when total items exceed items-per-page (often 100).
 * This spec validates accessibility + wiring when the control is on screen.
 */
test.describe('Pagination (E2E)', () => {
 test('pagination bar has accessible controls when visible', async ({ page }) => {
 await page.goto('/dashboard/receipts')
 await page.waitForLoadState('networkidle')

 const emailInput = page.locator('input[type="email"]').first()
 if (await emailInput.isVisible()) {
 test.skip()
 }

 const root = page.locator('[data-testid="pagination"]').first()
 const count = await root.count()
 if (count === 0) {
 test.skip()
 }

 await expect(root).toBeVisible()
 await expect(root.getByRole('button', { name: 'Previous page' })).toBeVisible()
 await expect(root.getByRole('button', { name: 'Next page' })).toBeVisible()
 await expect(root.locator('[data-testid="pagination-summary"]')).toBeVisible()
 })
})
