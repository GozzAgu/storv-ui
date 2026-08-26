import type { ReceiptCreationPrefill } from '~/types/receipt-prefill'
import type { SalesLead } from '~/types/leads'

export function buildLeadReceiptPrefill(lead: SalesLead): ReceiptCreationPrefill {
  const notes = [
    lead.notes?.trim(),
    lead.productName ? `Interest: ${lead.productName}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    customerName: lead.customerName,
    customerPhone: lead.customerPhone,
    customerEmail: lead.customerEmail,
    notes: notes || undefined,
    inventoryItemId: lead.inventoryItemId,
    itemSearchQuery: lead.inventoryItemId ? undefined : lead.productName,
  }
}
