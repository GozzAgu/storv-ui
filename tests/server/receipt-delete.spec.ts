import { describe, expect, it } from 'vitest'
import { computeCustomerAfterReceiptDelete } from '~/server/utils/receipt-delete'

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
