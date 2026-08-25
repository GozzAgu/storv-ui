import type { ReceiptCreationPrefill } from '~/types/receipt-prefill'
import type { SocialLead } from '~/types/social-sales'
import { socialPlatformLabel } from '~/types/social-sales'

/** Map a social lead to receipt wizard prefill (adapter only — no receipt logic). */
export function buildLeadReceiptPrefill(lead: SocialLead): ReceiptCreationPrefill {
  const platformNote = `Social lead · ${socialPlatformLabel(lead.platform)} (lead ${lead.id})`
  const notes = [lead.notes?.trim(), platformNote].filter(Boolean).join('\n\n')

  return {
    customerName: lead.customerName,
    customerPhone: lead.customerPhone || lead.whatsappNumber,
    notes: notes || platformNote,
    inventoryItemId: lead.productId,
    itemSearchQuery: lead.productName,
  }
}
