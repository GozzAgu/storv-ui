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
    return {
      amount: Number(row.amount) || 0,
      method: String(row.method || ''),
      paidAt: date,
      recordedBy: row.recordedBy ? String(row.recordedBy) : undefined,
    }
  })
}
