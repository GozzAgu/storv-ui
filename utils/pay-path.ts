/** Replaces any /pay/{token} segment, for logs, analytics and error reports. */
export function scrubPayPath(value: string): string {
  return value
    .replace(/\/pay\/(?!return\b)[A-Za-z0-9_-]{16,}/g, '/pay/[token]')
    .replace(/\/api\/paylink\/(?!return\b)[A-Za-z0-9_-]{16,}/g, '/api/paylink/[token]')
    .replace(/\/api\/pay\/[A-Za-z0-9_-]{16,}/g, '/api/pay/[token]')
}

/** Public payer pages: no analytics, no referrer, no caching. */
export function isPublicPayPath(path: string): boolean {
  return path === '/pay' || path.startsWith('/pay/')
}

/** V2 link tokens are 32 random bytes in base64url; legacy tokens are 40 hex characters. */
export function isV2LinkToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}
