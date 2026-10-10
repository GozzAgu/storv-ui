import { defineTradeRoute } from '~/server/utils/trade/http'
import { assertDocId } from '~/server/utils/payments/access'
import { replyToTradeRequest } from '~/server/utils/trade/requests'

export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:request-reply', limit: 120, windowMs: 10 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, auth, access, input }) => ({
    reply: await replyToTradeRequest(db, access, auth.uid, assertDocId(input.requestId, 'requestId'), {
      status: input.status,
      priceKobo: input.priceKobo,
      quantity: input.quantity,
      note: input.note,
    }),
  })
)
