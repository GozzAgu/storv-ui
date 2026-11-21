import { defineSalesRoute } from '~/server/utils/sales/http'
import { removeCategoryItems } from '~/server/utils/stock-removals'

/** Records and deletes a category's products in chunks before the category itself is deleted. */
export default defineSalesRoute(
  { id: 'inventory:remove-category-items', limit: 120 },
  async ({ db, actor, input }) => removeCategoryItems(db, actor, input)
)
