import type { Receipt, ReceiptPayment } from '~/stores/receipts'

export const BALANCE_DUE_STATUS = 'balance_due' as const

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function computeBalanceDue(total: number, amountPaid: number): number {
  return roundMoney(Math.max(0, total - amountPaid))
}

export function isBalanceFullyPaid(total: number, amountPaid: number): boolean {
  return computeBalanceDue(total, amountPaid) <= 0
}

export function receiptAmountPaid(receipt: Pick<Receipt, 'amountPaid' | 'payments'>): number {
  if (typeof receipt.amountPaid === 'number') return receipt.amountPaid
  if (!receipt.payments?.length) return 0
  return roundMoney(receipt.payments.reduce((s, p) => s + (p.amount || 0), 0))
}

export function receiptBalanceDue(receipt: Pick<Receipt, 'total' | 'amountPaid' | 'balanceDue' | 'payments'>): number {
  if (typeof receipt.balanceDue === 'number') return receipt.balanceDue
  return computeBalanceDue(receipt.total, receiptAmountPaid(receipt))
}

export function isBalanceDueReceipt(receipt: Pick<Receipt, 'status'>): boolean {
  return receipt.status === BALANCE_DUE_STATUS
}

export function normalizePayments(raw: unknown): ReceiptPayment[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => {
    const row = p as Record<string, unknown>
    const paidAt = row.paidAt as { toDate?: () => Date } | Date | string | undefined
    let date: Date
    if (paidAt && typeof paidAt === 'object' && 'toDate' in paidAt && typeof paidAt.toDate === 'function') {
      date = paidAt.toDate()
    } else if (paidAt instanceof Date) {
      date = paidAt
    } else {
      date = new Date(paidAt as string)
    }
    const entry: ReceiptPayment = {
      amount: Number(row.amount) || 0,
      method: String(row.method || ''),
      paidAt: date,
    }
    if (row.recordedBy) entry.recordedBy = String(row.recordedBy)
    return entry
  })
}

/** Firestore rejects `undefined` anywhere in update payloads (including nested payment rows). */
export function paymentsForFirestore(payments: ReceiptPayment[]): Array<{
  amount: number
  method: string
  paidAt: Date
  recordedBy?: string
}> {
  return payments.map((p) => {
    const row: {
      amount: number
      method: string
      paidAt: Date
      recordedBy?: string
    } = {
      amount: roundMoney(Number(p.amount) || 0),
      method: String(p.method || 'Cash').trim() || 'Cash',
      paidAt:
        p.paidAt instanceof Date
          ? p.paidAt
          : p.paidAt && typeof p.paidAt === 'object' && 'toDate' in p.paidAt && typeof p.paidAt.toDate === 'function'
            ? p.paidAt.toDate()
            : new Date(p.paidAt as string),
    }
    if (p.recordedBy) row.recordedBy = p.recordedBy
    return row
  })
}
