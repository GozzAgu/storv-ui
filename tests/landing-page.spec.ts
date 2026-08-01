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

  test('should link sign in to the app', async ({ page }) => {
    await gotoLanding(page)

    const signInLink = page.getByRole('link', { name: /sign in/i }).first()
    await expect(signInLink).toBeVisible()
    await expect(signInLink).toHaveAttribute('href', /.+\/login|app\.|localhost/i)
  })

  test('should have navigation links', async ({ page }) => {
    await gotoLanding(page)

    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })
})
