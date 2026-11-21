import { defineSalesRoute } from '~/server/utils/sales/http'
import { createSupplierReturn } from '~/server/utils/supplier-returns'

/** Logs a defective in-stock item as a supplier return and takes it out of stock. */
export default defineSalesRoute(
  { id: 'supplier-returns:create', limit: 30 },
  async ({ db, actor, input }) => createSupplierReturn(db, actor, input)
)
