import { defineSalesRoute } from '~/server/utils/sales/http'
import { runStockLoanAction } from '~/server/utils/sales/stock-loans'

export default defineSalesRoute({ id: 'stock-loans:cancel', limit: 60 }, ({ db, actor, input }) =>
  runStockLoanAction(db, actor, input, 'cancel')
)
