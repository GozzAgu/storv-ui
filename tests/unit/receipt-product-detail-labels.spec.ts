import { describe, expect, it } from 'vitest'
import { getProductDetailLines, humanizeDetailKey } from '~/composables/useReceiptProductDetails'
import type { ReceiptItem } from '~/stores/receipts'

describe('receipt product detail labels', () => {
  it('reads snake_case, kebab-case and camelCase keys as words', () => {
    expect(humanizeDetailKey('engine_number')).toBe('Engine Number')
    expect(humanizeDetailKey('chasis-number')).toBe('Chasis Number')
    expect(humanizeDetailKey('batteryCycleCount')).toBe('Battery Cycle Count')
  })

  it('labels custom columns cleanly on receipt lines', () => {
    const item = {
      itemId: 'i1',
      itemName: 'Civic',
      quantity: 1,
      price: 9_000_000,
      serialNo: '5',
      productDetails: { engine_number: '432w1', chasis_number: '4we23' },
    } as unknown as ReceiptItem
    const lines = getProductDetailLines(item, { omitLineItemFields: true })
    expect(lines).toContain('SN: 5')
    expect(lines).toContain('Engine Number: 432w1')
    expect(lines).toContain('Chasis Number: 4we23')
  })
})
