import { describe, it, expect } from 'vitest'
import { getReceiptStatusLabel, getReceiptStatusTone } from '~/utils/receipt-status'

describe('receipt-status', () => {
  it('returns labels for known statuses', () => {
    expect(getReceiptStatusLabel('completed')).toBe('Completed')
    expect(getReceiptStatusLabel('refunded')).toBe('Refunded')
    expect(getReceiptStatusLabel('balance_due')).toBe('Balance due')
  })

  it('maps statuses to badge tones', () => {
    expect(getReceiptStatusTone('completed')).toBe('success')
    expect(getReceiptStatusTone('balance_due')).toBe('warning')
    expect(getReceiptStatusTone('refunded')).toBe('error')
  })
})
