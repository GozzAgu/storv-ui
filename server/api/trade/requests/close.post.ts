import { defineTradeRoute } from '~/server/utils/trade/http'
import { assertDocId } from '~/server/utils/payments/access'
import { closeTradeRequest } from '~/server/utils/trade/requests'

export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:request-close', limit: 60, windowMs: 10 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, access, input }) => {
    await closeTradeRequest(db, access, assertDocId(input.requestId, 'requestId'))
    return { ok: true }
  }
)
