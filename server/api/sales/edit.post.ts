import { defineSalesRoute } from '~/server/utils/sales/http'
import { editSale } from '~/server/utils/sales/edit'

/** Corrects a sale's customer details or notes and records the edit on the receipt. */
export default defineSalesRoute({ id: 'sales:edit', limit: 30 }, async ({ db, actor, input }) => {
  const result = await editSale(db, actor, {
    receiptId: input.receiptId,
    changes: input.changes,
    reason: input.reason,
  })
  return { status: 'edited' as const, ...result }
})
