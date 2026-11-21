import { defineSalesRoute } from '~/server/utils/sales/http'
import { restoreRemoval } from '~/server/utils/stock-removals'

/** Puts a deleted product back into inventory from its saved copy. */
export default defineSalesRoute(
  { id: 'inventory:restore-removal', limit: 30 },
  async ({ db, actor, input }) => restoreRemoval(db, actor, input)
)
