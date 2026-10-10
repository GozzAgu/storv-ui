import { defineTradeRoute } from '~/server/utils/trade/http'
import { claimTradeSaleStock } from '~/server/utils/trade/sales'

/** Claim (or release) the one-time "add to inventory" for a paid partner bill. */
export default defineTradeRoute(
  { method: 'POST', rateLimit: { id: 'trade:sale-stock', limit: 30, windowMs: 10 * 60_000 } },
  async ({ db, auth, access, input }) =>
    claimTradeSaleStock(db, access, auth.uid, input.saleId, input.action)
)
