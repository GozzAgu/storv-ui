import { ref, type Ref } from 'vue'
import type { ReceiptCreationPrefill } from '~/types/receipt-prefill'
import type { SocialLead } from '~/types/social-sales'
import { buildLeadReceiptPrefill } from '~/composables/social-sales/buildLeadReceiptPrefill'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'

export interface SocialLeadReceiptCreatedPayload {
  id: string
  total?: number
  status?: string
}

/**
 * Adapter: opens CreateReceiptModal with lead context and marks the lead won after sale.
 * Does not modify receipts or inventory stores.
 */
export function useConvertLeadToSale(leadId: Ref<string>, actorName: Ref<string>) {
  const leadsStore = useSocialSalesLeadsStore()
  const toast = useAppToast()

  const receiptModalOpen = ref(false)
  const receiptPrefill = ref<ReceiptCreationPrefill | null>(null)

  function convertLeadToSale(lead: SocialLead) {
    receiptPrefill.value = buildLeadReceiptPrefill(lead)
    receiptModalOpen.value = true
  }

  async function handleReceiptCreated(receipt: SocialLeadReceiptCreatedPayload) {
    if (!receipt?.id) return

    const revenue = Number(receipt.total) || 0
    try {
      await leadsStore.markLeadConverted(leadId.value, receipt.id, revenue, actorName.value)
      toast.success('Lead converted to sale')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sale recorded but lead update failed'
      toast.error(message)
    } finally {
      receiptPrefill.value = null
      receiptModalOpen.value = false
    }
  }

  function closeReceiptModal() {
    receiptPrefill.value = null
    receiptModalOpen.value = false
  }

  return {
    receiptModalOpen,
    receiptPrefill,
    convertLeadToSale,
    handleReceiptCreated,
    closeReceiptModal,
  }
}
