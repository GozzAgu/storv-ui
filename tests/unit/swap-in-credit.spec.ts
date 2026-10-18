import { describe, expect, it } from 'vitest'
import { isSwapInPriceField, swapInCredit, swapInCreditField } from '~/utils/swap-in-credit'

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

  it('credits the cost price when Unit Price is left blank', () => {
    expect(swapInCredit(carFields, { price: '', unitCost: 1_200_000 })).toBe(1_200_000)
  })

  it('never credits the resale price; uses the swap value when there is no cost field', () => {
    const priceOnly = [{ name: 'price', type: 'currency' }]
    expect(swapInCreditField(priceOnly)).toBeNull()
    expect(swapInCredit(priceOnly, { price: 500_000 })).toBe(0)
    expect(swapInCredit(priceOnly, { price: 500_000 }, 350_000)).toBe(350_000)
    expect(swapInCredit(priceOnly, { price: '' }, '350000')).toBe(350_000)
    expect(swapInCredit(priceOnly, {}, '')).toBe(0)
  })

  it('falls back to the only non-price money field', () => {
    expect(swapInCreditField([{ name: 'value', type: 'currency' }])).toBe('value')
    expect(
      swapInCreditField([
        { name: 'price', type: 'currency' },
        { name: 'deposit', type: 'currency' },
      ])
    ).toBe('deposit')
    expect(
      swapInCreditField([
        { name: 'deposit', type: 'currency' },
        { name: 'fee', type: 'currency' },
      ])
    ).toBeNull()
    expect(swapInCreditField([{ name: 'name', type: 'text' }])).toBeNull()
  })
})

describe('isSwapInPriceField', () => {
  it('matches resale price fields by name or label', () => {
    expect(isSwapInPriceField({ name: 'price', type: 'currency' })).toBe(true)
    expect(isSwapInPriceField({ name: 'f_3', label: 'Unit Price', type: 'currency' })).toBe(true)
    expect(isSwapInPriceField({ name: 'unitCost', label: 'Cost Price', type: 'currency' })).toBe(
      false
    )
    expect(isSwapInPriceField({ name: 'price', type: 'text' })).toBe(false)
  })
})
