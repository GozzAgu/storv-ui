import type { Page } from '@playwright/test'

/** True when the dashboard auth guard redirected to the sign-in form. */
export async function isLoginPage(page: Page): Promise<boolean> {
 const email = page.locator('input[type="email"]').first()
 const welcome = page.getByText('Welcome back')
 const emailVisible = await email.isVisible().catch(() => false)
 const welcomeVisible = await emailVisible ? true : await welcome.isVisible().catch(() => false)
 return emailVisible || welcomeVisible
}

/** Wait for Nuxt client hydration after navigating to a dashboard route. */
export async function gotoDashboard(page: Page, path: string): Promise<void> {
 await page.goto(path, { waitUntil: 'domcontentloaded' })
 await page.waitForURL(/\/signin(?:\?|$)|\/dashboard\//, { timeout: 45_000 })
 await page.waitForLoadState('networkidle').catch(() => undefined)
}

/** Wait for the marketing landing page (not the Nuxt error shell). */
export async function gotoLanding(page: Page): Promise<void> {
 await page.goto('/', { waitUntil: 'domcontentloaded' })
 await page.waitForFunction(
 () => !document.title.includes('404') && document.querySelector('h1') !== null,
 { timeout: 45_000 },
 )
}
