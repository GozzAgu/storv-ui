import { requirePaymentsV2 } from '~/server/utils/payments/config'
import { resolvePaymentsAccess } from '~/server/utils/payments/access'
import { defineTradeRoute } from '~/server/utils/trade/http'
import { createTradeSale } from '~/server/utils/trade/sales'

/** Bill the partner who asked: puts a payment link on an unpaid sale and tells them. */
export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:sale-create', limit: 30, windowMs: 60 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, auth, access, input }) => {
    await requirePaymentsV2()
    const payments = await resolvePaymentsAccess(db, auth.uid, access.ownerId, access.storeId)
    return createTradeSale(
      db,
      payments,
      auth.uid,
      { requestId: input.requestId, receiptId: input.receiptId },
      { env: process.env, appOrigin: useRuntimeConfig().public.appOrigin }
    )
  }
)
