import { defineSalesRoute } from '~/server/utils/sales/http'
import { runBulkPriceUpdate } from '~/server/utils/inventory/bulk-price'

/** Set or adjust the unit/cost price of many products at once (owner or products.edit). */
export default defineSalesRoute({ id: 'inventory:bulk-price', limit: 30 }, ({ db, actor, input }) =>
  runBulkPriceUpdate(db, actor, input)
)
