import { defineSalesRoute } from '~/server/utils/sales/http'
import { createWriteOff } from '~/server/utils/stock-write-offs'

/** Writes stock off as a loss: from inventory, a held customer return, or a rejected claim. */
export default defineSalesRoute(
  { id: 'write-offs:create', limit: 30 },
  async ({ db, actor, input }) => createWriteOff(db, actor, input)
)
