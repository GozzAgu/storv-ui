import { defineTradeRoute } from '~/server/utils/trade/http'
import { returnTradeLoanItems } from '~/server/utils/trade/loans'

/** Borrower: mark items returned. Lender: confirm they are back in stock. */
export default defineTradeRoute(
  {
    method: 'POST',
    rateLimit: { id: 'trade:loan-return', limit: 60, windowMs: 60 * 60_000 },
  },
  async ({ db, auth, access, input }) =>
    returnTradeLoanItems(db, access, auth.uid, { loanId: input.loanId, lineIds: input.lineIds })
)
