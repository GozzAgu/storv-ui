import { defineSalesRoute } from '~/server/utils/sales/http'
import { removeItems } from '~/server/utils/stock-removals'

/** Deletes products and keeps a record of each one (reason, copy of the item, who, when). */
export default defineSalesRoute(
  { id: 'inventory:remove-items', limit: 30 },
  async ({ db, actor, input }) => removeItems(db, actor, input)
)
