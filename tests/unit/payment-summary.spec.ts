import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { PaymentStatus } from '~/types/payments-v2'
import { PAYMENT_STATUSES } from '~/types/payments-v2'
import { computePaymentSummary, outstandingKobo } from '~/utils/payment-summary'

const p = (
  status: PaymentStatus,
  amountKobo: number,
  refundedKobo = 0,
  updatedAt = '2026-10-07T10:00:00.000Z'
) => ({
  status,
  amountKobo,
  refundedKobo,
  updatedAt,
})

describe('computePaymentSummary examples', () => {
  it('unpaid with no payments', () => {
    expect(computePaymentSummary(5000, []).status).toBe('unpaid')
  })

  it('awaiting confirmation does not count as paid', () => {
    const s = computePaymentSummary(5000, [p('awaiting_confirmation', 5000)])
    expect(s.status).toBe('awaiting_confirmation')
    expect(s.balanceKobo).toBe(5000)
    expect(s.awaitingKobo).toBe(5000)
  })

  it('part payment, then paid', () => {
    expect(computePaymentSummary(5000, [p('confirmed', 2000)]).status).toBe('partially_paid')
    expect(computePaymentSummary(5000, [p('confirmed', 2000), p('confirmed', 3000)]).status).toBe(
      'paid'
    )
  })

  it('overpaid', () => {
    const s = computePaymentSummary(5000, [p('confirmed', 6000)])
    expect(s.status).toBe('overpaid')
    expect(s.overpaidKobo).toBe(1000)
    expect(s.balanceKobo).toBe(0)
  })

  it('partial and full refunds', () => {
    const partial = computePaymentSummary(5000, [p('partially_refunded', 5000, 1500)])
    expect(partial.status).toBe('partially_refunded')
    expect(partial.netPaidKobo).toBe(3500)
    expect(partial.balanceKobo).toBe(1500)
    expect(computePaymentSummary(5000, [p('refunded', 5000, 5000)]).status).toBe('refunded')
  })

  it('ignores failed, expired and rejected payments', () => {
    const s = computePaymentSummary(5000, [
      p('failed', 5000),
      p('expired', 5000),
      p('rejected', 5000),
    ])
    expect(s.status).toBe('unpaid')
    expect(s.paymentCount).toBe(0)
  })

  it('outstanding subtracts confirmed, awaiting and pending', () => {
    const s = computePaymentSummary(10000, [
      p('confirmed', 2000),
      p('awaiting_confirmation', 3000),
      p('pending', 1000),
    ])
    expect(outstandingKobo(s)).toBe(4000)
  })
})

const paymentArb = fc
  .record({
    status: fc.constantFrom(...PAYMENT_STATUSES),
    amountKobo: fc.integer({ min: 1, max: 50_000_000 }),
    refundFraction: fc.double({ min: 0, max: 1, noNaN: true }),
    minute: fc.integer({ min: 0, max: 59 }),
  })
  .map(({ status, amountKobo, refundFraction, minute }) => {
    const refundedKobo =
      status === 'refunded'
        ? amountKobo
        : status === 'partially_refunded'
        ? Math.min(amountKobo - 1, Math.max(1, Math.floor(amountKobo * refundFraction)))
        : 0
    return p(
      status,
      amountKobo,
      Math.max(0, refundedKobo),
      `2026-10-07T10:${String(minute).padStart(2, '0')}:00.000Z`
    )
  })

describe('computePaymentSummary properties', () => {
  const total = fc.integer({ min: 0, max: 100_000_000 })
  const payments = fc.array(paymentArb, { maxLength: 12 })

  it('money balances: net + balance − overpaid = total', () => {
    fc.assert(
      fc.property(total, payments, (t, ps) => {
        const s = computePaymentSummary(t, ps)
        expect(s.netPaidKobo + s.balanceKobo - s.overpaidKobo).toBe(t)
        expect(s.balanceKobo).toBeGreaterThanOrEqual(0)
        expect(s.overpaidKobo).toBeGreaterThanOrEqual(0)
        expect(s.balanceKobo === 0 || s.overpaidKobo === 0).toBe(true)
        expect(s.netPaidKobo).toBe(s.confirmedKobo - s.refundedKobo)
        expect(s.refundedKobo).toBeLessThanOrEqual(s.confirmedKobo)
      })
    )
  })

  it('is independent of payment order', () => {
    fc.assert(
      fc.property(total, payments, (t, ps) => {
        expect(computePaymentSummary(t, [...ps].reverse())).toEqual(computePaymentSummary(t, ps))
      })
    )
  })

  it('failed, expired and rejected payments never change the result', () => {
    fc.assert(
      fc.property(total, payments, fc.integer({ min: 1, max: 1_000_000 }), (t, ps, amt) => {
        const base = computePaymentSummary(t, ps)
        const noisy = computePaymentSummary(t, [
          ...ps,
          p('failed', amt),
          p('expired', amt),
          p('rejected', amt),
        ])
        expect(noisy).toEqual(base)
      })
    )
  })

  it('status agrees with the amounts', () => {
    fc.assert(
      fc.property(total, payments, (t, ps) => {
        const s = computePaymentSummary(t, ps)
        if (s.status === 'paid') expect(s.netPaidKobo).toBe(t)
        if (s.status === 'overpaid') expect(s.overpaidKobo).toBeGreaterThan(0)
        if (s.status === 'unpaid') expect(s.netPaidKobo + s.awaitingKobo).toBe(0)
        if (s.status === 'partially_paid') expect(s.netPaidKobo).toBeGreaterThan(0)
        if (s.status === 'awaiting_confirmation') expect(s.awaitingKobo).toBeGreaterThan(0)
        if (s.refundedKobo === 0) expect(['refunded', 'partially_refunded']).not.toContain(s.status)
      })
    )
  })

  it('outstanding never goes negative and never exceeds the balance', () => {
    fc.assert(
      fc.property(total, payments, (t, ps) => {
        const s = computePaymentSummary(t, ps)
        expect(outstandingKobo(s)).toBeGreaterThanOrEqual(0)
        expect(outstandingKobo(s)).toBeLessThanOrEqual(s.balanceKobo)
      })
    )
  })
})
