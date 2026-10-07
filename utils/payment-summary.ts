import type {
  PaymentRecord,
  PaymentStatus,
  PaymentSummary,
  SalePaymentStatus,
} from '~/types/payments-v2'
import { assertKobo, PAYMENTS_V2_CURRENCY } from '~/utils/money-kobo'

type SummaryInput = Pick<PaymentRecord, 'amountKobo' | 'status' | 'refundedKobo' | 'updatedAt'>

const CONFIRMED_STATES: ReadonlySet<PaymentStatus> = new Set([
  'confirmed',
  'partially_refunded',
  'refunded',
])

/**
 * Derives a sale's payment status from its payment records. Pure and order-independent, so the
 * server can recompute it inside every transaction that touches a payment.
 * Failed, expired and rejected payments never count toward money received.
 */
export function computePaymentSummary(
  totalKobo: number,
  payments: readonly SummaryInput[],
  version = 1
): PaymentSummary {
  assertKobo(totalKobo)

  let confirmedKobo = 0
  let refundedKobo = 0
  let awaitingKobo = 0
  let pendingKobo = 0
  let paymentCount = 0
  let lastPaymentAt: string | null = null

  for (const p of payments) {
    assertKobo(p.amountKobo)
    const counted =
      CONFIRMED_STATES.has(p.status) ||
      p.status === 'awaiting_confirmation' ||
      p.status === 'pending'
    if (!counted) continue

    paymentCount += 1
    if (CONFIRMED_STATES.has(p.status)) {
      const refunded = p.status === 'refunded' ? p.amountKobo : p.refundedKobo ?? 0
      assertKobo(refunded)
      confirmedKobo += p.amountKobo
      refundedKobo += Math.min(refunded, p.amountKobo)
    } else if (p.status === 'awaiting_confirmation') {
      awaitingKobo += p.amountKobo
    } else {
      pendingKobo += p.amountKobo
    }
    if (p.updatedAt && (!lastPaymentAt || p.updatedAt > lastPaymentAt)) {
      lastPaymentAt = p.updatedAt
    }
  }

  const netPaidKobo = confirmedKobo - refundedKobo
  const balanceKobo = Math.max(0, totalKobo - netPaidKobo)
  const overpaidKobo = Math.max(0, netPaidKobo - totalKobo)

  return {
    status: deriveSaleStatus({ totalKobo, netPaidKobo, refundedKobo, awaitingKobo }),
    currency: PAYMENTS_V2_CURRENCY,
    totalKobo,
    confirmedKobo,
    refundedKobo,
    netPaidKobo,
    awaitingKobo,
    pendingKobo,
    balanceKobo,
    overpaidKobo,
    paymentCount,
    lastPaymentAt,
    version,
  }
}

function deriveSaleStatus(s: {
  totalKobo: number
  netPaidKobo: number
  refundedKobo: number
  awaitingKobo: number
}): SalePaymentStatus {
  if (s.refundedKobo > 0) return s.netPaidKobo === 0 ? 'refunded' : 'partially_refunded'
  if (s.netPaidKobo > s.totalKobo) return 'overpaid'
  if (s.netPaidKobo === s.totalKobo) return 'paid'
  if (s.awaitingKobo > 0) return 'awaiting_confirmation'
  if (s.netPaidKobo > 0) return 'partially_paid'
  return 'unpaid'
}

/**
 * Money still open for new payments or links: total minus everything confirmed (net of refunds),
 * awaiting confirmation, or pending on an active link. The create-link and record-payment
 * transactions refuse anything above this (overpayment cap).
 */
export function outstandingKobo(summary: PaymentSummary): number {
  return Math.max(
    0,
    summary.totalKobo - summary.netPaidKobo - summary.awaitingKobo - summary.pendingKobo
  )
}

export function salePaymentStatusLabel(status: SalePaymentStatus): string {
  switch (status) {
    case 'unpaid':
      return 'Unpaid'
    case 'partially_paid':
      return 'Part paid'
    case 'awaiting_confirmation':
      return 'Awaiting confirmation'
    case 'paid':
      return 'Paid'
    case 'overpaid':
      return 'Overpaid'
    case 'partially_refunded':
      return 'Part refunded'
    case 'refunded':
      return 'Refunded'
  }
}
