import { defineSalesRoute } from '~/server/utils/sales/http'
import { applyLedgerEntry } from '~/server/utils/sales/customer-ledger'

/** Charge a customer, take a payment, or (managers) adjust their balance. */
export default defineSalesRoute({ id: 'customer-accounts:entry', limit: 60 }, ({ db, actor, input }) =>
  applyLedgerEntry(db, actor, input)
)
