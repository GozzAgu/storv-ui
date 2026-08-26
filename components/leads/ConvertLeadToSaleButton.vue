<template>
  <div>
    <Button
      v-if="canConvert"
      variant="primary"
      size="sm"
      :icon="ReceiptPercentIcon"
      @click="openConvertModal(lead)"
    >
      Create sale
    </Button>

    <CreateReceiptModal
      v-model="showReceiptModal"
      :prefill="receiptPrefill"
      @receipt-created="onReceiptCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ReceiptPercentIcon } from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
import type { SalesLead } from '~/types/leads'
import { isOpenSalesLeadStatus } from '~/types/leads'
import { useConvertLeadToSale } from '~/composables/leads/useConvertLeadToSale'

const props = defineProps<{
  lead: SalesLead
}>()

const { showReceiptModal, receiptPrefill, openConvertModal, onReceiptCreated } =
  useConvertLeadToSale()

const canConvert = computed(() => isOpenSalesLeadStatus(props.lead.status))
</script>
