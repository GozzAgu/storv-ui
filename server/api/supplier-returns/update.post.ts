import { defineSalesRoute } from '~/server/utils/sales/http'
import { updateSupplierReturn } from '~/server/utils/supplier-returns'

/** Sends a supplier return, resolves or rejects it, or edits its supplier details. */
export default defineSalesRoute(
  { id: 'supplier-returns:update', limit: 60 },
  async ({ db, actor, input }) => updateSupplierReturn(db, actor, input)
)
