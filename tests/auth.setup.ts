import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const authFile = 'tests/.auth/user.json'

setup('authenticate dashboard user', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  setup.skip(!email || !password, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD')

  await page.goto('/signin', { waitUntil: 'domcontentloaded' })
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 })
  await expect(page).toHaveURL(/\/dashboard/)

  mkdirSync(dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
