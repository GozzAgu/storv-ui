import { test, expect } from '@playwright/test'
import { gotoDashboard, isLoginPage } from './helpers/e2e'

test.describe('Inventory Page', () => {
  test('loads inventory route', async ({ page }) => {
    await gotoDashboard(page, '/dashboard/inventory')

    const loginVisible = await isLoginPage(page)
    const categoriesHeading = page.getByRole('heading', { name: 'Categories', exact: true })
    const categoriesVisible = await categoriesHeading.isVisible().catch(() => false)

    expect(loginVisible || categoriesVisible).toBeTruthy()
  })

  test('shows Categories heading when authenticated', async ({ page }) => {
    await gotoDashboard(page, '/dashboard/inventory')

    if (await isLoginPage(page)) {
      test.skip()
    }

    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('shows category organization subtitle when authenticated', async ({ page }) => {
    await gotoDashboard(page, '/dashboard/inventory')

    if (await isLoginPage(page)) {
      test.skip()
    }

    await expect(
      page.getByText(/create a category to start organizing your inventory/i)
    ).toBeVisible({
      timeout: 15_000,
    })
  })

  test('shows empty state or category grid when authenticated', async ({ page }) => {
    await gotoDashboard(page, '/dashboard/inventory')

    if (await isLoginPage(page)) {
      test.skip()
    }

    const emptyState = page.getByText(/no categories/i)
    const productCountLine = page.getByText(/\d+\s+Products?/i).first()

    const hasEmpty = await emptyState.isVisible().catch(() => false)
    const hasCategories = await productCountLine.isVisible().catch(() => false)

    expect(hasEmpty || hasCategories).toBeTruthy()
  })
})
