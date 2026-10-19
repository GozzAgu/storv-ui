import { defineSalesRoute } from '~/server/utils/sales/http'
import { closeStockLoan } from '~/server/utils/sales/stock-loans'

export default defineSalesRoute({ id: 'stock-loans:return', limit: 30 }, async ({ db, actor, input }) => {
  await closeStockLoan(db, actor, input, 'returned')
  return { ok: true }
})
