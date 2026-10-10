/** Trade handles: the public @name a business is found by when connecting as partners. */

export const TRADE_HANDLE_MIN = 3
export const TRADE_HANDLE_MAX = 30

const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'demo',
  'help',
  'official',
  'partners',
  'payments',
  'paystack',
  'security',
  'store',
  'storvv',
  'storv',
  'support',
  'team',
  'trade',
  'verified',
])

/** Lowercase, strip a leading @ and anything outside a-z, 0-9 and single hyphens. */
export function normalizeTradeHandle(input: unknown): string {
  return String(input ?? '')
    .trim()
    .replace(/^@+/, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, TRADE_HANDLE_MAX)
    .replace(/-+$/, '')
}

/** Reason the handle cannot be used, or null when it is fine. */
export function tradeHandleProblem(handle: string): string | null {
  if (handle.length < TRADE_HANDLE_MIN) {
    return `Use at least ${TRADE_HANDLE_MIN} letters or numbers.`
  }
  if (handle.length > TRADE_HANDLE_MAX || !HANDLE_RE.test(handle)) {
    return 'Use only letters, numbers and single hyphens.'
  }
  if (RESERVED.has(handle) || handle.startsWith('storvv')) {
    return 'That handle is reserved. Try another.'
  }
  return null
}

export function isValidTradeHandle(handle: string): boolean {
  return tradeHandleProblem(handle) === null
}

/** A starting suggestion: the storefront slug if valid, else the business name. */
export function suggestTradeHandle(storefrontSlug: string | null | undefined, name: string): string {
  const fromSlug = normalizeTradeHandle(storefrontSlug)
  if (isValidTradeHandle(fromSlug)) return fromSlug
  const fromName = normalizeTradeHandle(name)
  return isValidTradeHandle(fromName) ? fromName : ''
}

/** Link that opens the Partners page with this handle ready to connect. */
export function tradeInvitePath(handle: string): string {
  return `/dashboard/partners?connect=${encodeURIComponent(handle)}`
}
