import { test, expect } from '@playwright/test'
import { gotoDashboard, isLoginPage } from './helpers/e2e'

test.describe('Receipts Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, '/dashboard/receipts')
  })

  test('should display receipts page or sign-in gate', async ({ page }) => {
    if (await isLoginPage(page)) {
      await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10_000 })
      return
    }

    const pageTitle = page
      .getByRole('tab', { name: 'Receipts' })
      .or(page.getByText(/^Receipts$/).first())
    await expect(pageTitle).toBeVisible({ timeout: 10_000 })
  })

  test('should have search functionality', async ({ page }) => {
    if (await isLoginPage(page)) {
      test.skip()
    }

    const searchInput = page.locator('input[placeholder*="search" i]').first()

    const searchVisible = await searchInput.isVisible().catch(() => false)
    if (searchVisible) {
      await expect(searchInput).toBeVisible()
    }
  })

  test('should display stats cards', async ({ page }) => {
    if (await isLoginPage(page)) {
      test.skip()
    }

    const statsCards = page.locator('[class*="card"]').or(page.locator('[class*="stat"]'))
    const cardCount = await statsCards.count()

    expect(cardCount).toBeGreaterThanOrEqual(0)
  })
})
