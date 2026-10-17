/**
 * Pages that stay on the marketing site (www.storvv.com). Everything else on that host is
 * sent to app.storvv.com. Every page using the `marketing` layout must be listed here,
 * or visitors get bounced into the app (tests/unit/marketing-paths.spec.ts checks this).
 */
export const MARKETING_PAGE_PATHS = [
  '/',
  '/features',
  '/pricing',
  '/security',
  '/help',
  '/privacy',
  '/terms',
  '/subscribe',
] as const

export function isMarketingPath(path: string): boolean {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path
  if ((MARKETING_PAGE_PATHS as readonly string[]).includes(normalized)) return true
  if (normalized === '/store' || normalized.startsWith('/store/')) return true
  // Guest Paystack checkout (storefront Phase 4 may land here from www).
  if (normalized === '/pay' || normalized.startsWith('/pay/')) return true
  return false
}
