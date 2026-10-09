import type { H3Event } from 'h3'
import { trustedClientIp } from '~/server/utils/rate-limit'
import { parseCheckoutReference } from './link-token'

/** Storvv Payments V2 checkout references (`stvp_{linkId}_{hex}`). */
export function isLinkReference(reference: unknown): reference is string {
  return parseCheckoutReference(reference) !== null
}

/**
 * Optional second layer after the HMAC check (correction J): when PAYSTACK_WEBHOOK_IPS is set
 * (comma list, e.g. Paystack's published 52.31.139.75,52.49.173.169,52.214.14.220), link events
 * from any other client IP are refused. The IP comes from the platform header only.
 */
export function webhookIpAllowed(event: H3Event, env: NodeJS.ProcessEnv = process.env): boolean {
  const list = String(env.PAYSTACK_WEBHOOK_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!list.length) return true
  return list.includes(trustedClientIp(event, env))
}
