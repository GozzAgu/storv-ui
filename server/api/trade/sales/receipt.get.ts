import { defineTradeRoute } from '~/server/utils/trade/http'
import { tradeSaleReceipt } from '~/server/utils/trade/sales'

export default defineTradeRoute(
  {
    method: 'GET',
    rateLimit: { id: 'trade:sale-receipt', limit: 60, windowMs: 10 * 60_000 },
    tradeOnly: true,
  },
  async ({ db, access, input }) => ({ receipt: await tradeSaleReceipt(db, access, input.saleId) })
)
