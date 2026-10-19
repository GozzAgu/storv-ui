import { defineSalesRoute } from '~/server/utils/sales/http'
import { createStockLoan } from '~/server/utils/sales/stock-loans'

export default defineSalesRoute({ id: 'stock-loans:create', limit: 30 }, ({ db, actor, input }) =>
  createStockLoan(db, actor, input)
)
