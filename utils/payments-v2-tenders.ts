import { nairaToKobo } from '~/utils/money-kobo'
import { outstandingKobo } from '~/utils/payment-summary'
import type { PaymentSummary } from '~/types/payments-v2'

interface V2SaleLike {
  total: number
  paymentsV2?: boolean
  paymentSummary?: PaymentSummary
}

/** Money on this sale is tracked by Payments V2 (server records), not by receipt fields. */
export function isV2Sale(receipt: V2SaleLike): boolean {
  return receipt.paymentsV2 === true || !!receipt.paymentSummary
}

/** What can still be recorded: the server's rollup, or the whole total before the first record. */
export function saleOutstandingKobo(receipt: V2SaleLike): number {
  return receipt.paymentSummary
    ? outstandingKobo(receipt.paymentSummary)
    : nairaToKobo(receipt.total || 0)
}

export interface SaleTender {
  methodLabel: string
  amountKobo: number
}

export const MAX_SALE_TENDERS = 5

/** YYYY-MM-DD in Africa/Lagos, the business day the server's till count uses. */
export function lagosDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** One server call at a time (each is its own audited transaction); collects failures. */
export async function runSequential<T>(
  ids: string[],
  fn: (id: string) => Promise<T>
): Promise<{ ok: number; failed: { id: string; error: unknown }[] }> {
  let ok = 0
  const failed: { id: string; error: unknown }[] = []
  for (const id of ids) {
    try {
      await fn(id)
      ok++
    } catch (error) {
      failed.push({ id, error })
    }
  }
  return { ok, failed }
}

/**
 * Tenders to record on the server for a new sale. Balance-due sales record only the deposit.
 * Split lines are rounded to kobo independently; any overshoot of the total comes off the last
 * line so the server's overpayment cap never rejects a split that summed correctly in naira.
 * A real overpayment (more than rounding) is left alone for the server to refuse.
 */
export function buildSaleTenders(input: {
  total: number
  isBalanceDue: boolean
  deposit: number
  method: string
  split?: { method: string; amount: number }[]
}): SaleTender[] {
  const totalKobo = nairaToKobo(input.total)
  const label = (m: string) => m.trim() || 'Cash'

  let tenders: SaleTender[]
  if (input.isBalanceDue) {
    tenders = [{ methodLabel: label(input.method), amountKobo: nairaToKobo(input.deposit) }]
  } else if (input.split && input.split.length > 0) {
    tenders = input.split.map((p) => ({
      methodLabel: label(p.method),
      amountKobo: nairaToKobo(p.amount || 0),
    }))
  } else {
    tenders = [{ methodLabel: label(input.method), amountKobo: totalKobo }]
  }

  tenders = tenders.filter((t) => t.amountKobo > 0)
  let over = tenders.reduce((s, t) => s + t.amountKobo, 0) - totalKobo
  if (over > tenders.length) return tenders
  for (let i = tenders.length - 1; i >= 0 && over > 0; i--) {
    const cut = Math.min(over, tenders[i]!.amountKobo)
    tenders[i]!.amountKobo -= cut
    over -= cut
  }
  return tenders.filter((t) => t.amountKobo > 0)
}
