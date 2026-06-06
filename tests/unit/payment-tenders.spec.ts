import { describe, expect, it } from 'vitest'
import { mergePaymentTenders, normalizePaymentTenderList } from '~/utils/payment-tenders'

describe('payment-tenders', () => {
  it('includes OPay and Moniepoint in defaults', () => {
    const list = mergePaymentTenders(null)
    expect(list).toContain('OPay')
    expect(list).toContain('Moniepoint')
  })

  it('dedupes custom list case-insensitively', () => {
    const list = normalizePaymentTenderList(['Cash', 'cash', 'OPay'])
    expect(list).toEqual(['Cash', 'OPay'])
  })
})
