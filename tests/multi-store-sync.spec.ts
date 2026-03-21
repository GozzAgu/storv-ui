import { test, expect } from '@playwright/test'

/** Dashboard guard redirects unauthenticated users to /signin (client-side after auth resolves). */
function isSignInPage(page: import('@playwright/test').Page) {
  return page.url().includes('/signin')
}

async function gotoMultiStoreSync(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/multi-store-sync', { waitUntil: 'domcontentloaded' })
  // Client redirect + hydration: wait until we land on sign-in or the real page.
  await page.waitForURL(/\/signin(?:\?|$)|\/dashboard\/multi-store-sync/, {
    timeout: 45_000,
  })
}

test.describe('Multi-Store Sync', () => {
  test.beforeEach(async ({ page }) => {
    await gotoMultiStoreSync(page)
  })

  test('loads route: sign-in redirect or Multi-Store Sync shell', async ({ page }) => {
    if (isSignInPage(page)) {
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({
        timeout: 20_000,
      })
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 })
      return
    }

    await expect(
      page.getByRole('heading', { name: 'Multi-Store Sync', exact: true })
    ).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByText(/transfer items between stores/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows page title when authenticated', async ({ page }) => {
    if (isSignInPage(page)) {
      test.skip()
    }

    await expect(
      page.getByRole('heading', { name: 'Multi-Store Sync', exact: true })
    ).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByText(/transfer items between stores/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows access gate or full feature UI when authenticated', async ({ page }) => {
    if (isSignInPage(page)) {
      test.skip()
    }

    const accessHeading = page.getByRole('heading', { name: 'Access restricted', exact: true })
    const transferTab = page.getByRole('button', { name: 'Transfer Items' })

    await expect(
      accessHeading.or(transferTab)
    ).toBeVisible({ timeout: 20_000 })

    const gated = await accessHeading.isVisible().catch(() => false)
    if (gated) {
      await expect(accessHeading).toBeVisible()
      await expect(
        page.getByText(/only super admins|enterprise|upgrade/i)
      ).toBeVisible()
      return
    }

    await expect(transferTab).toBeVisible()
    await expect(page.getByRole('button', { name: 'Consolidated Reports' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Transfer History' })).toBeVisible()
  })

  test('shows stats cards when feature is unlocked', async ({ page }) => {
    if (isSignInPage(page)) {
      test.skip()
    }

    const accessHeading = page.getByRole('heading', { name: 'Access restricted', exact: true })
    await expect(
      accessHeading.or(page.getByText('Total stores', { exact: true }))
    ).toBeVisible({ timeout: 20_000 })

    if (await accessHeading.isVisible().catch(() => false)) {
      test.skip(true, 'Multi-store sync locked for this user')
    }

    await expect(page.getByText('Total stores', { exact: true })).toBeVisible()
    await expect(page.getByText('Total transfers', { exact: true })).toBeVisible()
  })
})