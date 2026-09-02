import { test, expect } from '@playwright/test'
import { gotoDashboard, isLoginPage } from './helpers/e2e'

test.describe('Authenticated dashboard smoke', () => {
  test('settings subscription upgrade control is enabled when plan selected', async ({ page }) => {
    await gotoDashboard(page, '/dashboard/settings')

    if (await isLoginPage(page)) {
      test.skip(true, 'Auth storage state missing — run tests/auth.setup.ts first')
    }

    const upgradeButton = page.getByRole('button', { name: /^Upgrade$/i })
    await expect(upgradeButton).toBeVisible({ timeout: 20_000 })
    await expect(upgradeButton).toBeEnabled({ timeout: 10_000 })
  })
})
