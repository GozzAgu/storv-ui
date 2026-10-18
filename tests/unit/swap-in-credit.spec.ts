import { describe, expect, it } from 'vitest'
import { swapInCredit, swapInCreditField } from '~/utils/swap-in-credit'

const carFields = [
  { name: 'name', type: 'text' },
  { name: 'price', type: 'currency' },
  { name: 'unitCost', type: 'currency' },
  { name: 'serialNo', type: 'text' },
]

describe('swapInCredit', () => {
  it('credits the cost price, not unit price plus cost price', () => {
    // The Hiace swap: Unit Price 300,000, Cost Price 1,200,000. It used to credit 1,500,000.
    expect(swapInCredit(carFields, { price: 300_000, unitCost: 1_200_000 })).toBe(1_200_000)
  })

  it('reads typed-in strings and treats blanks as no credit', () => {
    expect(swapInCredit(carFields, { price: '300000', unitCost: '1200000' })).toBe(1_200_000)
    expect(swapInCredit(carFields, { price: 300_000, unitCost: '' })).toBe(0)
  })

  it('falls back sensibly for categories without a cost field', () => {
    expect(swapInCreditField([{ name: 'price', type: 'currency' }])).toBe('price')
    expect(
      swapInCreditField([
        { name: 'price', type: 'currency' },
        { name: 'deposit', type: 'currency' },
      ])
    ).toBe('price')
    expect(swapInCreditField([{ name: 'value', type: 'currency' }])).toBe('value')
    expect(swapInCreditField([{ name: 'name', type: 'text' }])).toBeNull()
  })
})
