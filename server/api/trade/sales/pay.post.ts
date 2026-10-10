import { createError } from 'h3'
import { getPaystackSecret, paystackRequest } from '~/server/utils/payment-links'
import { requirePaymentsV2 } from '~/server/utils/payments/config'
import { hashIp, ipHashSalt } from '~/server/utils/payments/link-token'
import type { PaystackCall } from '~/server/utils/payments/payout'
import { trustedClientIp } from '~/server/utils/rate-limit'
import { defineTradeRoute } from '~/server/utils/trade/http'
import { payTradeSale } from '~/server/utils/trade/sales'

/** The buyer pays a partner's bill: returns a Paystack checkout URL. */
export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:sale-pay', limit: 10, windowMs: 10 * 60_000 },
    tradeOnly: true,
    requireVerifiedEmail: true,
  },
  async ({ event, db, auth, access, input }) => {
    await requirePaymentsV2()
    const salt = ipHashSalt()
    if (!salt) {
      console.error(
        JSON.stringify({ tag: 'payments-config-missing', key: 'PAYMENTS_IP_HASH_SALT' })
      )
      throw createError({
        statusCode: 503,
        message: 'Payment is temporarily unavailable',
        data: { code: 'PAYMENTS_MISCONFIGURED' },
      })
    }
    const config = useRuntimeConfig()
    const secretKey = getPaystackSecret(config)
    const paystack: PaystackCall = (path, init) =>
      paystackRequest(path, { method: init.method, body: init.body, secretKey })
    return payTradeSale(db, access, auth.email, input.saleId, {
      paystack,
      appOrigin: config.public.appOrigin,
      ipHash: hashIp(trustedClientIp(event), salt),
    })
  }
)
