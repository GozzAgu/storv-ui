import { defineSalesRoute } from '~/server/utils/sales/http'
import { closeStockLoan } from '~/server/utils/sales/stock-loans'

export default defineSalesRoute({ id: 'stock-loans:mark-sold', limit: 30 }, async ({ db, actor, input }) => {
  await closeStockLoan(db, actor, input, 'sold')
  return { ok: true }
})
