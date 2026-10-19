export interface CustomerTotalsInput {
  receipts?: string[]
  totalOrders?: number
  totalSpent?: number
}

export interface CustomerTotalsResult {
  deleteCustomer: boolean
  receipts: string[]
  totalOrders: number
  totalSpent: number
}

/**
 * What deleting a sale does to its stock. Only a completed sale took stock out, so only it puts
 * stock back. A balance-due sale only holds its items (pendingSaleReceiptId), so the hold is
 * released. Refunded and cancelled sales already returned their stock: restoring again would
 * create units that don't exist.
 */
export type ReceiptDeleteStockAction = 'restore' | 'release_hold' | 'none'

export function receiptDeleteStockAction(status: unknown): ReceiptDeleteStockAction {
  if (status === undefined || status === null || status === '' || status === 'completed') {
    return 'restore'
  }
  if (status === 'balance_due') return 'release_hold'
  return 'none'
}

/**
 * Why a sale can't be deleted, or null if it can. Matches firestore.rules: a sale with payments
 * recorded against it keeps its audit trail, and a partner-loan sale belongs to the loan.
 */
export function receiptDeleteBlockReason(receipt: {
  paymentSummary?: unknown
  tradeLoanId?: unknown
}): string | null {
  if (receipt.paymentSummary !== undefined && receipt.paymentSummary !== null) {
    return 'This sale has payments recorded against it, so it can’t be deleted. Refund or cancel it instead.'
  }
  if (receipt.tradeLoanId !== undefined && receipt.tradeLoanId !== null) {
    return 'This sale is part of a partner stock loan, so it can’t be deleted.'
  }
  return null
}

export function computeCustomerAfterReceiptDelete(
  customer: CustomerTotalsInput,
  receiptId: string,
  receiptTotal: number
): CustomerTotalsResult {
  const currentReceipts = Array.isArray(customer.receipts) ? customer.receipts : []
  const updatedReceipts = currentReceipts.filter((id) => id !== receiptId)
  if (updatedReceipts.length === 0) {
    return {
      deleteCustomer: true,
      receipts: [],
      totalOrders: 0,
      totalSpent: 0,
    }
  }

  return {
    deleteCustomer: false,
    receipts: updatedReceipts,
    totalOrders: Math.max(0, Number(customer.totalOrders || 1) - 1),
    totalSpent: Math.max(0, Number(customer.totalSpent || receiptTotal) - receiptTotal),
  }
}
