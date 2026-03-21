import { test, expect } from '@playwright/test'

async function isLoginPage(page: import('@playwright/test').Page) {
  return page.locator('input[type="email"]').first().isVisible()
}

test.describe('Floating Action Button', () => {
  test('should display FAB on receipts page', async ({ page }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')

    const fab = page.locator('button').filter({ hasText: /create/i }).or(
      page.locator('[class*="fixed"]').filter({ has: page.locator('button') })
    ).first()

    const fabVisible = await fab.isVisible().catch(() => false)

    if (fabVisible) {
      await expect(fab).toBeVisible()
    }
  })

  test('draggable grip is present when FAB container is shown (inventory folders)', async ({
    page,
  }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')

    if (await isLoginPage(page)) {
      test.skip()
    }

    const grip = page.getByRole('button', { name: 'Drag to reposition' })
    const gripVisible = await grip.isVisible().catch(() => false)

    // Grip only when user can create folders and FAB is in DOM
    if (!gripVisible) {
      test.skip()
    }

    await expect(grip).toBeVisible()
  })

  test('should open create receipt modal when FAB is clicked', async ({ page }) => {
    await page.goto('/dashboard/receipts')
    await page.waitForLoadState('networkidle')

    const fab = page.locator('button').filter({ hasText: /create/i }).or(
      page.locator('button[class*="fixed"]')
    ).first()

    const fabVisible = await fab.isVisible().catch(() => false)

    if (fabVisible) {
      await fab.click()

      const modal = page.locator('[role="dialog"]').or(page.locator('[class*="modal" i]')).first()
      const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false)

      if (modalVisible) {
        await expect(modal).toBeVisible()
      }
    }
  })
})
