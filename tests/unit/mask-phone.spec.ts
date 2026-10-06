import { describe, expect, it } from 'vitest'
import { maskPhone } from '~/utils/mask-phone'

describe('maskPhone', () => {
  it('keeps the country code and last four digits of international numbers', () => {
    expect(maskPhone('+2348031234921')).toBe('+234 ••• ••• 4921')
    expect(maskPhone('+234 803 123 4921')).toBe('+234 ••• ••• 4921')
    expect(maskPhone('+44 7911 123456')).toBe('+44 ••• ••• 3456')
    expect(maskPhone('00447911123456')).toBe('+44 ••• ••• 3456')
  })

  it('masks local numbers without inventing a country code', () => {
    expect(maskPhone('08031234921')).toBe('••• ••• 4921')
    expect(maskPhone('8031234921')).toBe('••• ••• 4921')
  })

  it('leaves empty and short values alone', () => {
    expect(maskPhone('')).toBe('')
    expect(maskPhone(null)).toBe('')
    expect(maskPhone('12345')).toBe('12345')
  })
})
