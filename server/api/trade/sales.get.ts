import { defineTradeRoute } from '~/server/utils/trade/http'
import { listTradeSales } from '~/server/utils/trade/sales'

export default defineTradeRoute(
  {
    method: 'GET',
    rateLimit: { id: 'trade:sales-list', limit: 120, windowMs: 10 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, access }) => ({ sales: await listTradeSales(db, access) })
)
