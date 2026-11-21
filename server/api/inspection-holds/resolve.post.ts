import { defineSalesRoute } from '~/server/utils/sales/http'
import { resolveInspectionHold } from '~/server/utils/inspection-holds'

/** Decides a held customer return: back on sale, or return to the supplier. */
export default defineSalesRoute(
  { id: 'inspection-holds:resolve', limit: 60 },
  async ({ db, actor, input }) => resolveInspectionHold(db, actor, input)
)
