import { describe, it, expect } from 'vitest'
import {
  computeBalanceDue,
  isBalanceFullyPaid,
  receiptAmountPaid,
  receiptBalanceDue,
} from '~/utils/receipt-balance'

describe('receipt-balance', () => {
  it('computes balance due', () => {
    expect(computeBalanceDue(100, 40)).toBe(60)
    expect(computeBalanceDue(100, 100)).toBe(0)
  })

  it('detects fully paid', () => {
    expect(isBalanceFullyPaid(100, 100)).toBe(true)
    expect(isBalanceFullyPaid(100, 99.99)).toBe(false)
  })

  it('sums payments when amountPaid missing', () => {
    const paid = receiptAmountPaid({
      payments: [
        { amount: 50, method: 'Cash', paidAt: new Date() },
        { amount: 25, method: 'Card', paidAt: new Date() },
      ],
    })
    expect(paid).toBe(75)
  })

  it('uses balanceDue field when set', () => {
    expect(
      receiptBalanceDue({
        total: 200,
        amountPaid: 50,
        balanceDue: 150,
      })
    ).toBe(150)
  })
})
