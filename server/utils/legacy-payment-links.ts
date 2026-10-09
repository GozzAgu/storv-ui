/**
 * Legacy payment-link endpoints (token-in-reference, no revoke, holds never released) stay off
 * until Payments V2 replaces them. Set LEGACY_PAYMENT_LINKS_ENABLED=1 to restore them.
 */
const LEGACY_ROUTES: Array<{ method: string | null; pattern: RegExp }> = [
  { method: null, pattern: /^\/api\/pay(\/|$)/ },
  { method: 'POST', pattern: /^\/api\/storefront\/[^/]+\/checkout\/?$/ },
  { method: 'POST', pattern: /^\/api\/storefront\/inquiries\/[^/]+\/payment-link\/?$/ },
  { method: 'POST', pattern: /^\/api\/payment-links\/create\/?$/ },
]

export const LEGACY_PAYMENT_LINKS_GONE_MESSAGE =
  'Online payment is paused while we upgrade it. Please contact the shop to pay.'

export function isLegacyPaymentLinkRoute(path: string, method: string): boolean {
  const cleanPath = path.split('?')[0] || ''
  const upperMethod = method.toUpperCase()
  return LEGACY_ROUTES.some(
    (route) =>
      (route.method === null || route.method === upperMethod) && route.pattern.test(cleanPath)
  )
}

export function legacyPaymentLinksEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.LEGACY_PAYMENT_LINKS_ENABLED === '1'
}
