import { describe, expect, it } from 'vitest'
import {
  computeCustomerAfterReceiptDelete,
  receiptDeleteBlockReason,
  receiptDeleteStockAction,
} from '~/server/utils/receipt-delete'

describe('receipt delete customer consistency', () => {
  it('marks customer for deletion when deleting last receipt', () => {
    const result = computeCustomerAfterReceiptDelete(
      { receipts: ['r1'], totalOrders: 1, totalSpent: 5000 },
      'r1',
      5000
    )
    expect(result.deleteCustomer).toBe(true)
    expect(result.totalOrders).toBe(0)
    expect(result.totalSpent).toBe(0)
  })

  it('updates totals when customer has remaining receipts', () => {
    const result = computeCustomerAfterReceiptDelete(
      { receipts: ['r1', 'r2'], totalOrders: 2, totalSpent: 12000 },
      'r2',
      7000
    )
    expect(result.deleteCustomer).toBe(false)
    expect(result.receipts).toEqual(['r1'])
    expect(result.totalOrders).toBe(1)
    expect(result.totalSpent).toBe(5000)
  })
})

describe('receiptDeleteBlockReason', () => {
  it('allows a plain sale', () => {
    expect(receiptDeleteBlockReason({})).toBeNull()
  })

  it('refuses a sale with payments recorded against it', () => {
    expect(receiptDeleteBlockReason({ paymentSummary: { version: 1 } })).toMatch(/payments/)
  })

  it('refuses a partner stock-loan sale', () => {
    expect(receiptDeleteBlockReason({ tradeLoanId: 'loan1' })).toMatch(/partner/)
  })
})

describe('receiptDeleteStockAction', () => {
  it('puts stock back only for a completed sale', () => {
    expect(receiptDeleteStockAction('completed')).toBe('restore')
    expect(receiptDeleteStockAction(undefined)).toBe('restore')
  })

  it('releases the hold on a balance-due sale instead of adding stock', () => {
    expect(receiptDeleteStockAction('balance_due')).toBe('release_hold')
  })

  it('never restores stock a refund or cancel already returned', () => {
    expect(receiptDeleteStockAction('refunded')).toBe('none')
    expect(receiptDeleteStockAction('cancelled')).toBe('none')
    expect(receiptDeleteStockAction('pending')).toBe('none')
  })
})
