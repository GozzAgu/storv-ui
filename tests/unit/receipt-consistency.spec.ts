import { describe, expect, it } from 'vitest'
import { assertReceiptConsistent, RECEIPT_CHANGED_WHILE_SAVING } from '~/utils/receipt-consistency'

describe('assertReceiptConsistent', () => {
  it('refuses a receipt whose cart emptied while it saved (the ₦0 sale)', () => {
    expect(() => assertReceiptConsistent({ items: [{ quantity: 1 }], itemsCount: 0 })).toThrow(
      RECEIPT_CHANGED_WHILE_SAVING
    )
  })

  it('lets normal sales through', () => {
    expect(() => assertReceiptConsistent({ items: [{ quantity: 2 }], itemsCount: 2 })).not.toThrow()
    expect(() => assertReceiptConsistent({ items: [], itemsCount: 0 })).not.toThrow()
    expect(() => assertReceiptConsistent({ items: [{ quantity: 1 }] })).not.toThrow()
  })
})
