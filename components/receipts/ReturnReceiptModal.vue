<template>
  <SDialog
    :open="props.modelValue"
    role="alertdialog"
    size="md"
    title="Return / refund sale"
    :description="receipt ? `Receipt #${receipt.receiptNumber}` : undefined"
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div v-if="!receipt" class="s-receipt-view__loading">
      <SSpinner :size="24" />
      <p>Loading sale…</p>
    </div>

    <div v-else class="s-form">
      <div class="s-receipt-callout s-receipt-callout--warning">
        <p class="s-receipt-callout__title">Confirm return / refund</p>
        <p>
          This marks the sale as refunded and returns all items to inventory. The customer will be
          notified and the transaction will be recorded.
        </p>
      </div>

      <section class="s-form-section">
        <h3 class="s-form-section__title">Sale information</h3>
        <dl class="s-record-summary s-record-summary--stack">
          <div class="s-record-row">
            <dt>Receipt number</dt>
            <dd class="s-record-row__value">{{ receipt.receiptNumber }}</dd>
          </div>
          <div class="s-record-row">
            <dt>Customer</dt>
            <dd class="s-record-row__value">{{ receipt.customerName }}</dd>
          </div>
          <div class="s-record-row">
            <dt>Date</dt>
            <dd class="s-record-row__value">{{ formatDate(receipt.date) }}</dd>
          </div>
          <div class="s-record-row">
            <dt>Payment method</dt>
            <dd class="s-record-row__value">{{ receipt.paymentMethod }}</dd>
          </div>
          <div class="s-record-row">
            <dt>Total</dt>
            <dd class="s-record-row__value">{{ formatCurrency(receipt.total) }}</dd>
          </div>
        </dl>
      </section>

      <section class="s-form-section">
        <h3 class="s-form-section__title">Items to be returned</h3>
        <ul class="s-record-rows s-receipt-items">
          <li v-for="(item, index) in receipt.items" :key="index" class="s-record-row">
            <span>{{ item.itemName }} × {{ item.quantity }}</span>
            <span class="s-record-row__value">
              {{ formatCurrency(item.price * item.quantity) }}
            </span>
          </li>
        </ul>
        <div class="s-record-row s-record-row--total">
          <span>Refund amount</span>
          <span class="s-record-row__value">{{ formatCurrency(receipt.total) }}</span>
        </div>
      </section>

      <div v-if="v2 && moneyHeldKobo > 0" class="s-receipt-callout s-receipt-callout--warning">
        <p class="s-receipt-callout__title">Refund the payments first</p>
        <p>
          {{ formatCurrency(koboToNaira(moneyHeldKobo)) }} is still held on this sale (confirmed,
          awaiting confirmation or pending). Refund or reject each payment in the sale's Payments
          section, then return the items here.
        </p>
      </div>

      <SField label="Return reason" :hint="v2 ? 'Required' : 'Optional'">
        <STextarea
          v-model="returnReason"
          :rows="2"
          placeholder="Enter reason for return/refund..."
        />
      </SField>

      <SCheckbox
        v-model="confirmed"
        label="I confirm this return/refund. All items go back to inventory and the sale is marked as refunded."
      />
    </div>

    <template #footer>
      <SDialogActions
        :primary-label="isProcessing ? 'Processing…' : 'Confirm return / refund'"
        :primary-icon="ArrowPathIcon"
        :primary-loading="isProcessing"
        :primary-disabled="!canSubmit"
        @cancel="handleCancel"
        @primary="handleConfirmReturn"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import STextarea from '~/components/s/STextarea.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { computed, ref, watch } from 'vue'
import { ArrowPathIcon } from '~/utils/app-icons'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { usePreferences } from '~/composables/usePreferences'
import { useSensitiveAction } from '~/composables/useSensitiveAction'
import { useHaptics } from '~/composables/useHaptics'
import { groupReceiptItemsByFolder, folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { koboToNaira } from '~/utils/money-kobo'
import { isV2Sale } from '~/utils/payments-v2-tenders'
import { useSalesApi } from '~/composables/useSalesApi'
import { isDemoModeActive } from '~/utils/demo-mode'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'

interface Props {
  modelValue: boolean
  receipt: Receipt | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  returned: [receipt: Receipt]
}>()

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const { formatCurrency } = usePreferences()
const { confirm: confirmSensitive } = useSensitiveAction()
const haptics = useHaptics()

const returnReason = ref('')
const confirmed = ref(false)
const isProcessing = ref(false)

const paymentsV2 = usePaymentsV2()
const salesApi = useSalesApi()
const v2 = computed(
  () => !!props.receipt && paymentsV2.access.value.enabled && isV2Sale(props.receipt)
)
const moneyHeldKobo = computed(() => {
  const s = props.receipt?.paymentSummary
  return s ? s.netPaidKobo + s.awaitingKobo + s.pendingKobo : 0
})
const canSubmit = computed(
  () =>
    confirmed.value &&
    !isProcessing.value &&
    (!v2.value || (moneyHeldKobo.value === 0 && returnReason.value.trim().length >= 3))
)

const formatDate = (date: Date | string | any) => {
  if (!date) return 'N/A'
  try {
    const dateObj = date?.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'N/A'
  }
}

const handleCancel = () => {
  returnReason.value = ''
  confirmed.value = false
  emit('update:modelValue', false)
}

/** Demo mode: put the stock back and mark the sale refunded on this device only. */
async function refundLocally(receipt: Receipt) {
  const grouped = groupReceiptItemsByFolder(receipt.items || [], receipt.folderId)
  for (const [folderId, lines] of grouped) {
    const itemIds = lines.map((line) => line.itemId).filter(Boolean)
    if (itemIds.length === 0) continue
    const folder =
      inventoryStore.getFolderById(folderId) ?? (await inventoryStore.fetchFolder(folderId))
    if (folderHasSerialNumbers(folder ?? undefined)) {
      await inventoryStore.returnItemsToStock(itemIds)
    } else {
      const restoreQuantities: Record<string, number> = {}
      for (const line of lines) {
        if (line.itemId)
          restoreQuantities[line.itemId] =
            (restoreQuantities[line.itemId] ?? 0) + (line.quantity ?? 0)
      }
      await inventoryStore.returnItemsToStock(itemIds, {
        folderId,
        hasSerialNumbers: false,
        restoreQuantities,
      })
    }
  }
  await receiptsStore.updateReceipt(receipt.id, {
    status: 'refunded',
    notes: returnReason.value ? `Returned: ${returnReason.value}` : 'Returned',
    refundReason: returnReason.value || undefined,
  })
}

const handleConfirmReturn = async () => {
  if (!props.receipt || !canSubmit.value) return

  isProcessing.value = true
  if (!(await confirmSensitive('refund'))) {
    isProcessing.value = false
    return
  }

  try {
    const receipt = props.receipt
    if (isDemoModeActive()) {
      await refundLocally(receipt)
    } else {
      // The server closes the sale (Payments V2 refuses while money is held) and returns the
      // stock in the same step, once.
      await salesApi.refundSale(receipt.id, returnReason.value.trim())
      const index = receiptsStore.receipts.findIndex((r) => r.id === receipt.id)
      if (index > -1) {
        receiptsStore.receipts[index] = {
          ...receiptsStore.receipts[index]!,
          status: 'refunded',
          refundReason: returnReason.value.trim() || undefined,
          updatedAt: new Date(),
        }
      }
      for (const folderId of receipt.folderIds?.length ? receipt.folderIds : [receipt.folderId]) {
        if (!folderId) continue
        invalidateFolderItemCaches(folderId)
        delete inventoryStore.items[folderId]
      }
    }

    // 3. Update customer (if needed - this might be handled elsewhere)
    // The receipt status change should be sufficient

    void haptics.notify('success')
    emit('returned', receipt)
    handleCancel()
  } catch (error: any) {
    alert(error.message || 'Failed to process return/refund. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

// Reset form when modal opens/closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      returnReason.value = ''
      confirmed.value = false
      isProcessing.value = false
      void paymentsV2.loadAccess()
    }
  }
)
</script>
