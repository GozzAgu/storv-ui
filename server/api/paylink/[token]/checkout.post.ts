import { createError, getRouterParam, readBody } from 'h3'
import { getPaystackSecret, paystackRequest } from '~/server/utils/payment-links'
import { hashIp, ipHashSalt, tokenHashFromParam } from '~/server/utils/payments/link-token'
import { startCheckout } from '~/server/utils/payments/links'
import type { PaystackCall } from '~/server/utils/payments/payout'
import { assertTokenRateLimit, definePublicPayRoute } from '~/server/utils/payments/public-http'

/** Public: start a Paystack hosted checkout for this link. Returns the checkout URL. */
export default definePublicPayRoute(
  { rateLimit: { id: 'paylink:checkout', limit: 10, windowMs: 60_000 } },
  async ({ event, db, ip }) => {
    const hash = tokenHashFromParam(getRouterParam(event, 'token'))
    await assertTokenRateLimit(event, hash, { id: 'paylink:checkout-token', limit: 10, windowMs: 10 * 60_000 })
    const salt = ipHashSalt()
    if (!salt) {
      console.error(JSON.stringify({ tag: 'payments-config-missing', key: 'PAYMENTS_IP_HASH_SALT' }))
      throw createError({
        statusCode: 503,
        message: 'Payment is temporarily unavailable',
        data: { code: 'PAYMENTS_MISCONFIGURED' },
      })
    }
    const body = ((await readBody<{ email?: unknown }>(event).catch(() => null)) ?? {}) as {
      email?: unknown
    }
    const config = useRuntimeConfig()
    const secretKey = getPaystackSecret(config)
    const paystack: PaystackCall = (path, init) =>
      paystackRequest(path, { method: init.method, body: init.body, secretKey })
    return startCheckout(db, hash, { email: body.email }, {
      paystack,
      appOrigin: config.public.appOrigin,
      ipHash: hashIp(ip, salt),
    })
  }
)
