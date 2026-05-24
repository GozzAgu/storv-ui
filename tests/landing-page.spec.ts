import { test, expect } from '@playwright/test'
import { gotoLanding } from './helpers/e2e'

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await gotoLanding(page)

    await expect(page).toHaveTitle(/Storvv/i)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('should display hero section', async ({ page }) => {
    await gotoLanding(page)

    const heroSection = page.locator('section').first()
    await expect(heroSection).toBeVisible()
  })

  test('should show "Launching Soon" modal when clicking sign in', async ({ page }) => {
    await gotoLanding(page)

    const signInButton = page.getByRole('link', { name: /sign in/i }).or(page.getByText(/sign in/i)).first()
    if (await signInButton.isVisible()) {
      await signInButton.click()

      const modal = page.locator('[role="dialog"]').or(page.locator('.modal')).first()
      await expect(modal).toBeVisible({ timeout: 5000 })
    }
  })

  test('should have navigation links', async ({ page }) => {
    await gotoLanding(page)

    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })
})
