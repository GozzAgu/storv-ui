import { defineEventHandler, setHeaders, type H3Event } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit, trustedClientIp } from '~/server/utils/rate-limit'
import { requirePaymentsV2 } from './config'
import { toHttpError } from './http'

/** Headers on every public pay response (pages get the same set from routeRules). */
export const PUBLIC_PAY_HEADERS = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
} as const

export interface PublicPayContext {
  event: H3Event
  db: Firestore
  ip: string
}

/**
 * Public pay endpoints: gate (404 when off) → no-store/no-referrer headers → per-IP limit from
 * the platform IP header (distributed in production) → handler. Bodies and paths are never
 * logged; errors carry codes, not tokens.
 */
export function definePublicPayRoute<T>(
  options: { rateLimit: { id: string; limit: number; windowMs: number } },
  run: (ctx: PublicPayContext) => Promise<T>
) {
  return defineEventHandler(async (event) => {
    setHeaders(event, PUBLIC_PAY_HEADERS)
    await requirePaymentsV2()
    await assertRateLimit(event, { ...options.rateLimit, requireDistributed: true })
    try {
      return await run({ event, db: getAdminFirestore(), ip: trustedClientIp(event) })
    } catch (err) {
      throw toHttpError(err)
    }
  })
}

/** Per-token limit, keyed on the token's hash so the token never reaches the limiter store. */
export async function assertTokenRateLimit(
  event: H3Event,
  tokenHash: string | null,
  opts: { id: string; limit: number; windowMs: number }
): Promise<void> {
  if (!tokenHash) return
  await assertRateLimit(event, { ...opts, uid: `tok:${tokenHash.slice(0, 32)}`, requireDistributed: true })
}
