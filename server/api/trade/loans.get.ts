import { defineTradeRoute } from '~/server/utils/trade/http'
import { listTradeLoans } from '~/server/utils/trade/loans'

/** Partner loans from both sides: stock you lent and stock you borrowed. */
export default defineTradeRoute(
  { method: 'GET', rateLimit: { id: 'trade:loans-list', limit: 120, windowMs: 10 * 60_000 } },
  async ({ db, access }) => ({ loans: await listTradeLoans(db, access) })
)
