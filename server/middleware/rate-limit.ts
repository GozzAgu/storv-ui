import { defineEventHandler } from 'h3'
import { assertRateLimit } from '~/server/utils/rate-limit'

const ONE_MINUTE = 60_000

/** Global API rate limits (KV when configured, else in-memory per instance). */
export default defineEventHandler(async (event) => {
  const path = event.path || ''

  if (!path.startsWith('/api/')) return

  if (path.startsWith('/api/pay/')) {
    await assertRateLimit(event, { id: 'pay-public', limit: 30, windowMs: ONE_MINUTE })
    return
  }

  if (path.startsWith('/api/paystack/webhook')) {
    await assertRateLimit(event, { id: 'paystack-webhook', limit: 120, windowMs: ONE_MINUTE })
    return
  }

  if (path.startsWith('/api/auth/2fa/')) {
    await assertRateLimit(event, { id: 'auth-2fa', limit: 20, windowMs: ONE_MINUTE })
    return
  }

  if (
    path.startsWith('/api/receipts/send-email') ||
    path.startsWith('/api/receipts/deliver')
  ) {
    await assertRateLimit(event, { id: 'receipt-delivery-ip', limit: 15, windowMs: ONE_MINUTE })
    return
  }

  if (path.startsWith('/api/proxy-image')) {
    await assertRateLimit(event, { id: 'proxy-image', limit: 60, windowMs: ONE_MINUTE })
    return
  }

  await assertRateLimit(event, { id: 'api-default', limit: 120, windowMs: ONE_MINUTE })
})
