import { test, expect } from '@playwright/test'

async function isLoginPage(page: import('@playwright/test').Page) {
  return page.locator('input[type="email"]').first().isVisible()
}

test.describe('Inventory Page', () => {
  test('loads inventory route', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')

    // Either login (unauthenticated) or app shell
    const loginVisible = await isLoginPage(page)
    const foldersHeading = page.getByRole('heading', { name: 'Folders', exact: true })
    const foldersVisible = await foldersHeading.isVisible().catch(() => false)

    expect(loginVisible || foldersVisible).toBeTruthy()
  })

  test('shows Folders heading when authenticated', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')

    if (await isLoginPage(page)) {
      test.skip()
    }

    await expect(page.getByRole('heading', { name: 'Folders', exact: true })).toBeVisible({
      timeout: 15000,
    })
  })

  test('shows folder organization subtitle when authenticated', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')

    if (await isLoginPage(page)) {
      test.skip()
    }

    await expect(page.getByText(/organize products into folders/i)).toBeVisible({
      timeout: 15000,
    })
  })

  test('shows empty state or folder grid when authenticated', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')

    if (await isLoginPage(page)) {
      test.skip()
    }

    const emptyState = page.getByText(/no folders/i)
    const productCountLine = page.getByText(/\d+\s+Products?/i).first()

    const hasEmpty = await emptyState.isVisible().catch(() => false)
    const hasFolders = await productCountLine.isVisible().catch(() => false)

    expect(hasEmpty || hasFolders).toBeTruthy()
  })
})
