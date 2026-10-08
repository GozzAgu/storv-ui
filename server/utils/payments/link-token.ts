import { createHash, randomBytes } from 'node:crypto'

/** 32 bytes = 256 bits of randomness, base64url without padding (43 characters). */
export const LINK_TOKEN_BYTES = 32
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const REFERENCE_PATTERN = /^stvp_([A-Za-z0-9]{20})_([a-f0-9]{16})$/

export const LINK_TTL_HOURS = { default: 24, min: 1, max: 24 * 7 } as const
export const MAX_ACTIVE_TOKENS_PER_LINK = 10

export function hashLinkToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function generateLinkToken(): { token: string; hash: string } {
  const token = randomBytes(LINK_TOKEN_BYTES).toString('base64url')
  return { token, hash: hashLinkToken(token) }
}

/** Hash of a well-formed token, or null. Anything else is treated as not found. */
export function tokenHashFromParam(raw: unknown): string | null {
  return typeof raw === 'string' && TOKEN_PATTERN.test(raw) ? hashLinkToken(raw) : null
}

/** Expiry in hours: default 24, at least 1, at most 7 days. */
export function resolveLinkExpiry(hours: unknown, now: Date = new Date()): string {
  const h = hours == null || hours === '' ? LINK_TTL_HOURS.default : Number(hours)
  if (!Number.isInteger(h) || h < LINK_TTL_HOURS.min || h > LINK_TTL_HOURS.max) {
    throw new RangeError(
      `Expiry must be a whole number of hours between ${LINK_TTL_HOURS.min} and ${LINK_TTL_HOURS.max}`
    )
  }
  return new Date(now.getTime() + h * 3_600_000).toISOString()
}

/**
 * Paystack reference: carries the link ID (not secret) so the return page and the webhook can
 * find the link, plus randomness so each checkout attempt is unique. Never the token.
 */
export function newCheckoutReference(linkId: string): string {
  if (!/^[A-Za-z0-9]{20}$/.test(linkId)) throw new Error('Unexpected link ID format')
  return `stvp_${linkId}_${randomBytes(8).toString('hex')}`
}

export function parseCheckoutReference(raw: unknown): { linkId: string; reference: string } | null {
  if (typeof raw !== 'string') return null
  const m = REFERENCE_PATTERN.exec(raw)
  return m ? { linkId: m[1]!, reference: raw } : null
}

/** One-way hash of the client IP for attempt records (never the raw address). */
export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/** Replaces any /pay/{token} segment, for logs, analytics and error reports. */
export function scrubPayPath(value: string): string {
  return value.replace(/\/pay\/(?!return\b)[A-Za-z0-9_-]{16,}/g, '/pay/[token]').replace(
    /\/api\/paylink\/(?!return\b)[A-Za-z0-9_-]{16,}/g,
    '/api/paylink/[token]'
  )
}
