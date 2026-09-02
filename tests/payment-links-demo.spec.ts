import { test, expect } from '@playwright/test'

test.describe('Demo payment links', () => {
  test('loads payment links page in demo mode', async ({ page }) => {
    await page.goto('/demo/dashboard/payment-links', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle').catch(() => undefined)

    await expect(page.getByRole('heading', { name: /payment links/i })).toBeVisible({
      timeout: 30_000,
    })
  })

  test('shows new payment link action when payout is connected in demo', async ({ page }) => {
    await page.goto('/demo/dashboard/payment-links', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle').catch(() => undefined)

    const newLink = page.getByRole('button', { name: /new payment link/i })
    await expect(newLink).toBeVisible({ timeout: 30_000 })
  })
})
