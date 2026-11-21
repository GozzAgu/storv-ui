import type { Receipt } from '~/stores/receipts'

export type ReceiptStatusTone = 'success' | 'warning' | 'error' | 'neutral'

/** Badge tone for a receipt status in the design-system components. */
export function getReceiptStatusTone(status: Receipt['status']): ReceiptStatusTone {
  switch (status) {
    case 'completed':
      return 'success'
    case 'pending':
    case 'balance_due':
      return 'warning'
    case 'refunded':
      return 'error'
    default:
      return 'neutral'
  }
}

const RECEIPT_STATUS_LABELS: Partial<Record<Receipt['status'], string>> = {
  completed: 'Completed',
  pending: 'Pending',
  balance_due: 'Balance due',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

export function getReceiptStatusLabel(status: Receipt['status']): string {
  return RECEIPT_STATUS_LABELS[status] ?? status
}

/**
 * Status as shown on a sale. A refund with items still held for inspection reads "Return
 * pending" until a manager decides each item; only then does it show as refunded.
 */
export function getReceiptDisplayStatus(receipt: Pick<Receipt, 'status' | 'inspectionPending'>): {
  label: string
  tone: ReceiptStatusTone
} {
  if (receipt.status === 'refunded' && receipt.inspectionPending) {
    return { label: 'Return pending', tone: 'warning' }
  }
  return {
    label: getReceiptStatusLabel(receipt.status),
    tone: getReceiptStatusTone(receipt.status),
  }
}
