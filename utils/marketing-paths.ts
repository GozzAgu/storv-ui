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
  '/about',
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

/**
 * App routes that must never render on the server: they need Firebase auth, IndexedDB or a
 * payment token in the browser. Anything not listed here (marketing pages, unknown URLs) is
 * server-rendered, which is also what lets unknown URLs answer with a real 404.
 */
export const CLIENT_ONLY_ROUTE_PATTERNS = [
  '/dashboard',
  '/dashboard/**',
  '/signin',
  '/signup',
  '/forgot-password',
  '/auth/**',
  '/demo',
  '/demo/**',
  '/dev/**',
  '/r/**',
  '/store',
  '/store/**',
  '/subscribe',
] as const
