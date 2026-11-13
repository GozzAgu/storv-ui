/**
 * Stock loans to smaller retailers: `users/{ownerId}/stores/{storeId}/sellerLoanOuts/{loanId}`.
 *
 *   pending_approval ──approve──▶ active ──return──▶ returned
 *          │                        └───mark_sold──▶ sold
 *          ├──reject──▶ rejected
 *          └──cancel──▶ cancelled
 *
 * A pending loan reserves its items (so nobody sells or lends them twice) but the goods are not
 * handed over until an approver says yes. Loans created by an approver start active. All moves
 * run on the server; see utils/stock-loan-policy.ts for who may do what.
 */

export type StockLoanStatus =
  | 'pending_approval'
  | 'active'
  | 'returned'
  | 'sold'
  | 'rejected'
  | 'cancelled'

export type StockLoanAction = 'approve' | 'reject' | 'cancel' | 'return' | 'mark_sold'

export const STOCK_LOAN_ACTIONS: readonly StockLoanAction[] = [
  'approve',
  'reject',
  'cancel',
  'return',
  'mark_sold',
]

/** Statuses whose items are still reserved by the loan. */
export const OPEN_STOCK_LOAN_STATUSES: ReadonlySet<StockLoanStatus> = new Set([
  'pending_approval',
  'active',
])

export function normalizeStockLoanStatus(raw: unknown): StockLoanStatus {
  switch (raw) {
    case 'pending_approval':
    case 'returned':
    case 'sold':
    case 'rejected':
    case 'cancelled':
      return raw
    default:
      return 'active'
  }
}

export const STOCK_LOAN_STATUS_LABELS: Record<StockLoanStatus, string> = {
  pending_approval: 'Awaiting approval',
  active: 'On loan',
  returned: 'Returned',
  sold: 'Sold',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const STOCK_LOAN_STATUS_TONES: Record<
  StockLoanStatus,
  'warning' | 'info' | 'success' | 'error' | 'neutral'
> = {
  pending_approval: 'warning',
  active: 'info',
  returned: 'neutral',
  sold: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}
