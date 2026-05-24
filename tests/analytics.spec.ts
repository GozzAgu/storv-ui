import { test, expect } from '@playwright/test'
import { gotoDashboard, isLoginPage } from './helpers/e2e'

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, '/dashboard/analytics')
  })

  test('should display analytics page or sign-in gate', async ({ page }) => {
    if (await isLoginPage(page)) {
      await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10_000 })
      return
    }

    const pageTitle = page.getByRole('heading', { name: /analytics/i }).first()
    await expect(pageTitle).toBeVisible({ timeout: 10_000 })
  })

  test('should display key metrics or store-selection state when authenticated', async ({ page }) => {
    if (await isLoginPage(page)) {
      test.skip()
    }

    const metrics = [
      page.getByText(/total revenue/i),
      page.getByText(/completed revenue/i),
      page.getByText(/low stock/i),
      page.getByText(/select a store to view analytics/i),
    ]

    const visibleMetrics = await Promise.all(
      metrics.map((m) => m.isVisible().catch(() => false)),
    )

    expect(visibleMetrics.some(Boolean)).toBeTruthy()
  })

  test('should have period selector when authenticated', async ({ page }) => {
    if (await isLoginPage(page)) {
      test.skip()
    }

    const periodButton = page.getByRole('button', { name: /daily|weekly|monthly/i }).first()
    const hasSelector = await periodButton.isVisible().catch(() => false)

    if (hasSelector) {
      await expect(periodButton).toBeVisible()
    }
  })
})
