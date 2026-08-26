import { describe, expect, it } from 'vitest'
import { buildLeadReceiptPrefill } from '~/composables/leads/buildLeadReceiptPrefill'
import type { SalesLead } from '~/types/leads'
import {
  isOpenSalesLeadStatus,
  SALES_LEAD_SOURCE_LABELS,
  SALES_LEAD_STATUS_LABELS,
} from '~/types/leads'

const sampleLead: SalesLead = {
  id: 'lead1',
  storeId: 's1',
  customerName: 'Jane Doe',
  customerPhone: '+234800',
  customerEmail: 'jane@example.com',
  productName: 'iPhone 15',
  estimatedValue: 500000,
  status: 'new',
  source: 'walk_in',
  notes: 'Wants 256GB',
  createdBy: 'u1',
}

describe('sales leads helpers', () => {
  it('buildLeadReceiptPrefill maps contact and product search', () => {
    const prefill = buildLeadReceiptPrefill(sampleLead)
    expect(prefill.customerName).toBe('Jane Doe')
    expect(prefill.customerPhone).toBe('+234800')
    expect(prefill.itemSearchQuery).toBe('iPhone 15')
    expect(prefill.notes).toContain('Wants 256GB')
    expect(prefill.notes).toContain('Interest: iPhone 15')
    expect(prefill.inventoryItemId).toBeUndefined()
  })

  it('buildLeadReceiptPrefill prefers inventoryItemId when linked', () => {
    const prefill = buildLeadReceiptPrefill({ ...sampleLead, inventoryItemId: 'item1' })
    expect(prefill.inventoryItemId).toBe('item1')
    expect(prefill.itemSearchQuery).toBeUndefined()
  })

  it('labels cover all statuses and sources', () => {
    expect(SALES_LEAD_STATUS_LABELS.new).toBe('New')
    expect(SALES_LEAD_SOURCE_LABELS.whatsapp).toBe('WhatsApp')
  })

  it('treats won and lost as closed', () => {
    expect(isOpenSalesLeadStatus('negotiating')).toBe(true)
    expect(isOpenSalesLeadStatus('won')).toBe(false)
    expect(isOpenSalesLeadStatus('lost')).toBe(false)
  })
})
