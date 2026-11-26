import { describe, expect, it } from 'vitest'
import {
  transferMatchesQuery,
  transferReference,
  transferSearchSummary,
  transferSearchUrl,
} from '~/utils/transfer-search'

const transfer = {
  id: 'abc123nqzwvw',
  sourceStoreId: 's1',
  destinationStoreId: 's2',
  destinationStoreName: 'Old Abuja name',
  items: [
    { itemName: 'iPhone 15 Pro', serialNumber: '356789012345678', quantity: 1 },
    { itemName: 'USB-C cable', quantity: 4 },
  ],
  notes: 'Urgent for weekend',
  trackingNumber: 'GIG-55102',
  status: 'in_transit',
}
const names = { s1: 'Lagos, Lekki' }

describe('transferReference', () => {
  it('uses the last six characters, upper-cased', () => {
    expect(transferReference('abc123nqzwvw')).toBe('TR-NQZWVW')
    expect(transferReference('a-b_c')).toBe('TR-ABC')
  })
})

describe('transferMatchesQuery', () => {
  it('finds a transfer by its reference, with or without the prefix', () => {
    for (const q of ['TR-NQZWVW', 'tr-nqzwvw', 'tr nqzwvw', 'nqzwvw', 'TR-NQZ']) {
      expect(transferMatchesQuery(transfer, q, names)).toBe(true)
    }
    expect(transferMatchesQuery(transfer, 'TR-XXXXXX', names)).toBe(false)
  })

  it('finds a transfer by branch, item, serial, notes or tracking number', () => {
    for (const q of ['lekki', 'old abuja', 'iphone', '356789', 'weekend', 'gig-551']) {
      expect(transferMatchesQuery(transfer, q, names)).toBe(true)
    }
    expect(transferMatchesQuery(transfer, 'samsung', names)).toBe(false)
  })
})

describe('transferSearchSummary', () => {
  it('describes the route, what moves and where it stands', () => {
    expect(transferSearchSummary(transfer, names)).toEqual({
      title: 'TR-NQZWVW',
      subtitle: 'Lagos, Lekki → Old Abuja name',
      description: 'iPhone 15 Pro + 1 more · Awaiting receipt',
    })
  })
})

describe('transferSearchUrl', () => {
  it('opens History with the transfer expanded', () => {
    expect(transferSearchUrl('abc 1')).toBe(
      '/dashboard/multi-store-sync?tab=history&transfer=abc%201'
    )
  })
})
