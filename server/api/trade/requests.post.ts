import { defineTradeRoute } from '~/server/utils/trade/http'
import { createTradeRequest } from '~/server/utils/trade/requests'

export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:request-create', limit: 30, windowMs: 24 * 60 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, auth, access, input }) =>
    createTradeRequest(db, access, auth.uid, {
      item: input.item,
      quantity: input.quantity,
      note: input.note,
      to: input.to,
    })
)
