import { describe, it, expect } from 'vitest'
import { getReceiptStatusBadge } from '~/utils/receipt-status'

describe('receipt-status', () => {
 it('returns labels for known statuses', () => {
 expect(getReceiptStatusBadge('completed').label).toBe('Completed')
 expect(getReceiptStatusBadge('refunded').label).toBe('Refunded')
 expect(getReceiptStatusBadge('balance_due').label).toBe('Balance due')
 })
})
