import { defineTradeRoute } from '~/server/utils/trade/http'
import { listTradeRequests } from '~/server/utils/trade/requests'

export default defineTradeRoute(
  {
    method: 'GET',
    rateLimit: { id: 'trade:requests', limit: 120, windowMs: 10 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, access }) => listTradeRequests(db, access)
)
