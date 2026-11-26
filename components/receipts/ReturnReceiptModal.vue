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
        <p class="s-receipt-callout__title">This refunds the whole sale</p>
        <p>
          The sale is marked as refunded and its items go back on sale, unless you hold them for
          checking in step 1.
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

      <div v-if="v2 && moneyHeldKobo > 0" class="s-receipt-callout s-receipt-callout--warning">
        <p class="s-receipt-callout__title">Refund the payments first</p>
        <p>
          {{ formatCurrency(koboToNaira(moneyHeldKobo)) }} is still held on this sale (confirmed,
          awaiting confirmation or pending). Refund or reject each payment in the sale's Payments
          section, then return the items here.
        </p>
      </div>

      <SStep
        :number="1"
        title="Check the items coming back"
        hint="Tick “Needs checking” for anything that might be faulty; a manager inspects it first."
      >
        <template v-if="heldItemIds.length" #aside>
          <span class="s-step__count">{{ heldItemIds.length }} to check</span>
        </template>
        <ul class="s-record-rows s-receipt-items">
          <li
            v-for="(item, index) in receipt.items"
            :key="index"
            class="s-record-row s-return-line"
          >
            <span class="s-return-line__main">
              <span>{{ item.itemName }} × {{ item.quantity }}</span>
              <SCheckbox
                v-if="item.itemId"
                :model-value="heldItemIds.includes(item.itemId)"
                label="Needs checking, hold it off sale"
                @update:model-value="(on: boolean) => toggleHeld(item.itemId, on)"
              />
            </span>
            <span class="s-record-row__value">
              {{ formatCurrency(item.price * item.quantity) }}
            </span>
          </li>
        </ul>
        <div class="s-record-row s-record-row--total">
          <span>Refund amount</span>
          <span class="s-record-row__value">{{ formatCurrency(receipt.total) }}</span>
        </div>
        <p v-if="heldItemIds.length" class="s-receipt-callout">
          {{ heldItemIds.length }} item{{ heldItemIds.length === 1 ? '' : 's' }} will be held for
          inspection. A manager decides from Returns → To inspect whether it goes back on sale or
          back to the supplier.
        </p>
      </SStep>

      <SStep
        :number="2"
        :title="heldItemIds.length ? 'Note what the customer said is wrong' : 'Give a reason'"
        :hint="
          reasonRequired
            ? 'Needed for this refund. A few words is enough.'
            : 'Helps you spot patterns in returns later.'
        "
        :optional="!reasonRequired"
        :done="reasonRequired && reasonValid"
      >
        <SField
          :label="heldItemIds.length ? 'What did the customer say is wrong?' : 'Return reason'"
          :hint="reasonRequired ? 'Required' : 'Optional'"
        >
          <STextarea
            v-model="returnReason"
            :rows="2"
            :placeholder="
              heldItemIds.length
                ? 'e.g. Screen flickers, battery drains overnight'
                : 'Enter reason for return/refund...'
            "
          />
        </SField>
      </SStep>

      <SStep
        :number="3"
        title="Confirm the refund"
        hint="Check the refund amount, then tick the box."
        :done="confirmed"
      >
        <SCheckbox v-model="confirmed" :label="confirmLabel" />
      </SStep>
    </div>

    <template #footer>
      <SStepSummary v-if="receipt">
        <template v-if="v2 && moneyHeldKobo > 0">
          Refund the payments in the sale's Payments section first.
        </template>
        <template v-else-if="reasonRequired && !reasonValid">
          Say why the {{ heldItemIds.length ? 'items need checking' : 'sale is being refunded' }}.
        </template>
        <template v-else-if="!confirmed">Tick the box in step 3 to confirm.</template>
        <template v-else>
          <strong>{{ formatCurrency(receipt.total) }}</strong> refund ·
          <strong>{{ restockLineCount }}</strong> back on sale
          <template v-if="heldItemIds.length">
            · <strong>{{ heldItemIds.length }}</strong> held for checking
          </template>
        </template>
      </SStepSummary>
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
import SStep from '~/components/s/SStep.vue'
import SStepSummary from '~/components/s/SStepSummary.vue'
import { computed, ref, watch } from 'vue'
import { ArrowPathIcon } from '~/utils/app-icons'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { usePreferences } from '~/composables/usePreferences'
import { useSensitiveAction } from '~/composables/useSensitiveAction'
import { useHaptics } from '~/composables/useHaptics'
import { koboToNaira } from '~/utils/money-kobo'
import { isV2Sale } from '~/utils/payments-v2-tenders'
import { useSalesApi } from '~/composables/useSalesApi'
import { isDemoModeActive } from '~/utils/demo-mode'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'
import { useInspectionHoldsStore } from '~/stores/inspectionHolds'
import { demoHoldsFromReceipt } from '~/utils/supplier-return-display'

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
const holdsStore = useInspectionHoldsStore()
const { formatCurrency } = usePreferences()
const { confirm: confirmSensitive } = useSensitiveAction()
const haptics = useHaptics()

const returnReason = ref('')
const confirmed = ref(false)
const isProcessing = ref(false)
/** "Needs checking" lines: held off sale for inspection instead of restocked. */
const heldItemIds = ref<string[]>([])

function toggleHeld(itemId: string, on: boolean) {
  heldItemIds.value = on
    ? [...new Set([...heldItemIds.value, itemId])]
    : heldItemIds.value.filter((id) => id !== itemId)
}

const reasonRequired = computed(() => v2.value || heldItemIds.value.length > 0)
/** Same reason rule `canSubmit` uses; drives step 2's tick and the footer summary. */
const reasonValid = computed(() => returnReason.value.trim().length >= 3)
/** Sale lines that go straight back on sale (not held for checking). */
const restockLineCount = computed(
  () =>
    (props.receipt?.items ?? []).filter(
      (item) => !item.itemId || !heldItemIds.value.includes(item.itemId)
    ).length
)
const confirmLabel = computed(() =>
  heldItemIds.value.length
    ? 'I confirm this return/refund. Held items wait for inspection; the rest go back on sale.'
    : 'I confirm this return/refund. All items go back to inventory and the sale is marked as refunded.'
)

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
    (!reasonRequired.value || returnReason.value.trim().length >= 3) &&
    (!v2.value || moneyHeldKobo.value === 0)
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
  heldItemIds.value = []
  emit('update:modelValue', false)
}

/**
 * Demo mode: refund on this device only. The demo store puts the good lines back on sale and
 * keeps held lines off it (there is no cloud inventory to update here).
 */
async function refundLocally(receipt: Receipt) {
  const held = [...heldItemIds.value]
  const { applyDemoReceiptRefund } = await import('~/utils/demo-bridge')
  await applyDemoReceiptRefund(receipt.id, held)
  if (held.length) {
    holdsStore.addLocal(
      demoHoldsFromReceipt(
        receipt,
        held,
        returnReason.value.trim(),
        (id) => inventoryStore.getFolderById(id)?.name
      )
    )
  }
  await receiptsStore.updateReceipt(receipt.id, {
    status: 'refunded',
    ...(held.length && { inspectionPending: true }),
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
      await salesApi.refundSale(receipt.id, returnReason.value.trim(), heldItemIds.value)
      if (heldItemIds.value.length) holdsStore.markStale()
      const index = receiptsStore.receipts.findIndex((r) => r.id === receipt.id)
      if (index > -1) {
        receiptsStore.receipts[index] = {
          ...receiptsStore.receipts[index]!,
          status: 'refunded',
          ...(heldItemIds.value.length && { inspectionPending: true }),
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
      heldItemIds.value = []
      void paymentsV2.loadAccess()
    }
  }
)
</script>

<style scoped>
.s-return-line {
  align-items: flex-start;
}

.s-return-line__main {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
  min-width: 0;
}
</style>
