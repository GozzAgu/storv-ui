import { defineTradeRoute } from '~/server/utils/trade/http'
import { lookupTradeHandle } from '~/server/utils/trade/partners'

export default defineTradeRoute(
  {
    method: 'GET',
    rateLimit: { id: 'trade:lookup', limit: 30, windowMs: 10 * 60_000 },
    ownerOnly: true,
  },
  async ({ db, access, input }) => lookupTradeHandle(db, access, input.handle)
)
