import type { Receipt, ReceiptPaymentEntry } from '~/stores/receipts'

const PAY_EPS = 0.01

export function receiptAmountPaid(receipt: Pick<Receipt, 'amountPaid' | 'splitPayments' | 'total' | 'status'>): number {
  if (typeof receipt.amountPaid === 'number' && !Number.isNaN(receipt.amountPaid)) {
    return receipt.amountPaid
  }
  if (receipt.splitPayments?.length) {
    return receipt.splitPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  }
  return receipt.status === 'completed' ? receipt.total : 0
}

export function receiptBalanceDue(receipt: Pick<Receipt, 'amountPaid' | 'splitPayments' | 'total' | 'status'>): number {
  return Math.max(0, (receipt.total || 0) - receiptAmountPaid(receipt))
}

export function isReceiptFullyPaid(receipt: Pick<Receipt, 'amountPaid' | 'splitPayments' | 'total' | 'status'>): boolean {
  return receiptBalanceDue(receipt) <= PAY_EPS
}

/** Open balance or inventory not finalized yet. */
export function isReceiptOutstanding(
  receipt: Pick<Receipt, 'amountPaid' | 'splitPayments' | 'total' | 'status' | 'inventoryApplied'>,
): boolean {
  if (receipt.status === 'refunded') return false
  if (receipt.inventoryApplied === true && isReceiptFullyPaid(receipt)) return false
  return receipt.inventoryApplied !== true || !isReceiptFullyPaid(receipt)
}

export function buildPaymentEntry(
  amount: number,
  method: string,
  recordedBy?: string,
): ReceiptPaymentEntry {
  return {
    amount,
    method,
    date: new Date(),
    ...(recordedBy ? { recordedBy } : {}),
  }
}
