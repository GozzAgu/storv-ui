import { defineEventHandler } from 'h3'
import { assertRateLimit } from '~/server/utils/rate-limit'

const ONE_MINUTE = 60_000

/** Global API rate limits (in-memory; per-instance on serverless). */
export default defineEventHandler((event) => {
  const path = event.path || ''

  if (!path.startsWith('/api/')) return

  // Public payment pages — tighter limits to reduce abuse.
  if (path.startsWith('/api/pay/')) {
    assertRateLimit(event, { id: 'pay-public', limit: 30, windowMs: ONE_MINUTE })
    return
  }

  if (path.startsWith('/api/paystack/webhook')) {
    assertRateLimit(event, { id: 'paystack-webhook', limit: 120, windowMs: ONE_MINUTE })
    return
  }

  if (path.startsWith('/api/auth/2fa/')) {
    assertRateLimit(event, { id: 'auth-2fa', limit: 20, windowMs: ONE_MINUTE })
    return
  }

  if (
    path.startsWith('/api/receipts/send-email') ||
    path.startsWith('/api/receipts/deliver')
  ) {
    // Per-route handlers also rate-limit by uid; this caps anonymous/IP abuse.
    assertRateLimit(event, { id: 'receipt-delivery-ip', limit: 15, windowMs: ONE_MINUTE })
    return
  }

  if (path.startsWith('/api/proxy-image')) {
    assertRateLimit(event, { id: 'proxy-image', limit: 60, windowMs: ONE_MINUTE })
    return
  }

  assertRateLimit(event, { id: 'api-default', limit: 120, windowMs: ONE_MINUTE })
})
