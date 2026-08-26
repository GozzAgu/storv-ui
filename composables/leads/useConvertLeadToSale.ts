import { ref } from 'vue'
import type { ReceiptCreationPrefill } from '~/types/receipt-prefill'
import type { SalesLead } from '~/types/leads'
import { buildLeadReceiptPrefill } from '~/composables/leads/buildLeadReceiptPrefill'
import { useSalesLeadsStore } from '~/stores/salesLeads'
import { useAppToast } from '~/composables/useAppToast'

export function useConvertLeadToSale() {
  const salesLeadsStore = useSalesLeadsStore()
  const toast = useAppToast()
  const showReceiptModal = ref(false)
  const receiptPrefill = ref<ReceiptCreationPrefill | null>(null)
  const activeLeadId = ref<string | null>(null)

  function openConvertModal(lead: SalesLead) {
    activeLeadId.value = lead.id
    receiptPrefill.value = buildLeadReceiptPrefill(lead)
    showReceiptModal.value = true
  }

  function closeConvertModal() {
    showReceiptModal.value = false
    receiptPrefill.value = null
    activeLeadId.value = null
  }

  async function onReceiptCreated(receipt: { id?: string; total?: number }) {
    const leadId = activeLeadId.value
    if (!leadId || !receipt?.id) {
      closeConvertModal()
      return
    }

    const wonRevenue = typeof receipt.total === 'number' ? receipt.total : 0
    await salesLeadsStore.markLeadConverted(leadId, receipt.id, wonRevenue)
    toast.success('Lead marked won')
    closeConvertModal()
  }

  return {
    showReceiptModal,
    receiptPrefill,
    openConvertModal,
    closeConvertModal,
    onReceiptCreated,
  }
}
