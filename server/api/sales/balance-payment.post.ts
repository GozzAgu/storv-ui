import { defineSalesRoute } from '~/server/utils/sales/http'
import { recordBalancePayment } from '~/server/utils/sales/balance'

/** Records part of a balance owed on a sale (non Payments V2). */
export default defineSalesRoute({ id: 'sales:balance-payment', limit: 60 }, ({ db, actor, input }) =>
  recordBalancePayment(db, actor, {
    receiptId: input.receiptId,
    amount: input.amount,
    method: input.method,
  })
)
