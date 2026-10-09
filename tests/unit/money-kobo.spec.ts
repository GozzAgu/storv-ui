import { describe, expect, it } from 'vitest'
import {
  assertKobo,
  isPaymentsCurrency,
  koboToNaira,
  MoneyConversionError,
  nairaToKobo,
} from '~/utils/money-kobo'

describe('nairaToKobo', () => {
  it.each([
    [0.1, 10],
    [0.29, 29],
    [19.99, 1999],
    [1234567.89, 123456789],
    [0, 0],
    [1, 100],
    [1.005, 101],
    ['250.50', 25050],
  ])('%s naira → %s kobo', (naira, kobo) => {
    expect(nairaToKobo(naira)).toBe(kobo)
  })

  it('rejects negatives', () => {
    expect(() => nairaToKobo(-0.01)).toThrow(MoneyConversionError)
    expect(() => nairaToKobo(-100)).toThrow('negative')
  })

  it('rejects non-finite and junk input', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 'abc', '1,000']) {
      expect(() => nairaToKobo(bad as number)).toThrow(MoneyConversionError)
    }
  })

  it('rejects amounts beyond safe integer kobo', () => {
    expect(() => nairaToKobo(Number.MAX_SAFE_INTEGER)).toThrow('too large')
  })

  it('round-trips every two-decimal amount up to 10,000 naira', () => {
    for (let kobo = 0; kobo <= 1_000_000; kobo += 7) {
      expect(nairaToKobo(kobo / 100)).toBe(kobo)
    }
  }, 30_000)
})

describe('kobo helpers', () => {
  it('converts back to naira', () => {
    expect(koboToNaira(1999)).toBe(19.99)
  })

  it('assertKobo accepts only non-negative integers', () => {
    expect(() => assertKobo(10)).not.toThrow()
    for (const bad of [-1, 1.5, '10', null]) expect(() => assertKobo(bad)).toThrow()
  })

  it('only NGN is supported', () => {
    expect(isPaymentsCurrency('NGN')).toBe(true)
    expect(isPaymentsCurrency('USD')).toBe(false)
    expect(isPaymentsCurrency('ngn')).toBe(false)
  })
})
