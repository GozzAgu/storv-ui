import { describe, expect, it } from 'vitest'
import { findDuplicateOpenLead } from '~/composables/leads/findDuplicateOpenLead'
import type { SalesLead } from '~/types/leads'

const leads: SalesLead[] = [
  {
    id: 'l1',
    storeId: 's1',
    customerName: 'Jane',
    customerPhone: '0803 111 2222',
    customerEmail: 'jane@example.com',
    productName: 'Phone',
    status: 'new',
    source: 'walk_in',
    createdBy: 'u1',
  },
  {
    id: 'l2',
    storeId: 's1',
    customerName: 'Won lead',
    customerPhone: '0803 999 0000',
    productName: 'Case',
    status: 'won',
    source: 'phone',
    createdBy: 'u1',
  },
]

describe('findDuplicateOpenLead', () => {
  it('matches normalized phone on open leads', () => {
    const hit = findDuplicateOpenLead(leads, { phone: '08031112222' })
    expect(hit?.id).toBe('l1')
  })

  it('ignores won leads and excluded id', () => {
    expect(findDuplicateOpenLead(leads, { phone: '08039990000' })).toBeNull()
    expect(findDuplicateOpenLead(leads, { phone: '08031112222', excludeLeadId: 'l1' })).toBeNull()
  })
})
