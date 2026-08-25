import { describe, expect, it } from 'vitest'
import { buildLeadReceiptPrefill } from '~/composables/social-sales/buildLeadReceiptPrefill'
import type { SocialLead } from '~/types/social-sales'

const baseLead: SocialLead = {
  id: 'lead-99',
  storeId: 'store-1',
  customerName: 'Ada Okonkwo',
  customerPhone: '+234 803 111 2233',
  whatsappNumber: '+234 803 111 2233',
  platform: 'whatsapp',
  productId: 'item-abc',
  productName: 'iPhone 15 Pro',
  estimatedValue: 900000,
  status: 'negotiating',
  source: 'whatsapp',
  notes: 'Prefers natural titanium',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'uid-1',
}

describe('buildLeadReceiptPrefill', () => {
  it('maps lead contact and product context for the receipt wizard', () => {
    const prefill = buildLeadReceiptPrefill(baseLead)
    expect(prefill.customerName).toBe('Ada Okonkwo')
    expect(prefill.customerPhone).toBe('+234 803 111 2233')
    expect(prefill.inventoryItemId).toBe('item-abc')
    expect(prefill.itemSearchQuery).toBe('iPhone 15 Pro')
    expect(prefill.notes).toContain('Prefers natural titanium')
    expect(prefill.notes).toContain('WhatsApp')
    expect(prefill.notes).toContain('lead-99')
  })

  it('falls back to whatsapp number when phone is missing', () => {
    const prefill = buildLeadReceiptPrefill({
      ...baseLead,
      customerPhone: undefined,
      whatsappNumber: '+234 909 000 1111',
    })
    expect(prefill.customerPhone).toBe('+234 909 000 1111')
  })
})
