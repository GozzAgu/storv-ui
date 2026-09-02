import { describe, expect, it } from 'vitest'
import { buildPaymentLinkShareMessage } from '~/utils/payment-link-share'

describe('payment-link-share', () => {
  it('builds WhatsApp-friendly invoice message', () => {
    const message = buildPaymentLinkShareMessage({
      url: 'https://app.storvv.com/pay/abc123',
      invoiceNumber: 'PL-XYZ',
      customerName: 'Ada',
      total: 45000,
    })

    expect(message).toContain('Hi Ada')
    expect(message).toContain('PL-XYZ')
    expect(message).toContain('https://app.storvv.com/pay/abc123')
    expect(message).toContain('45')
  })
})
