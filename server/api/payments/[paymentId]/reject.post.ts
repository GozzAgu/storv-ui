import { getRouterParam } from 'h3'
import { definePaymentsRoute } from '~/server/utils/payments/http'
import { decidePayment } from '~/server/utils/payments/service'

export default definePaymentsRoute(
  { method: 'POST', rateLimit: { id: 'payments:decide', limit: 120, windowMs: 60_000 } },
  async ({ event, db, access, input }) => {
    const res = await decidePayment(db, access, {
      paymentId: getRouterParam(event, 'paymentId'),
      decision: 'reject',
      reason: input.reason,
    })
    const item = res.items[0]!
    return {
      paymentId: item.paymentId,
      status: item.status,
      summary: res.summaries[item.receiptId],
    }
  }
)
