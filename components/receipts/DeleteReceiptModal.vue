<template>
  <SDialog
    :open="props.modelValue"
    role="alertdialog"
    size="sm"
    title="Delete sale?"
    :description="receipt ? `Receipt #${receipt.receiptNumber}` : undefined"
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div v-if="!receipt" class="s-receipt-view__loading">
      <SSpinner :size="24" />
      <p>Loading sale…</p>
    </div>

    <div v-else class="s-form">
      <div class="s-receipt-callout s-receipt-callout--error">
        <p class="s-receipt-callout__title">This can't be undone</p>
        <p>
          Deleting this sale also deletes the associated customer (if no other sales exist) and
          returns all items to inventory.
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
            <dt>Status</dt>
            <dd>
              <SBadge :tone="getReceiptStatusTone(receipt.status)">
                {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
              </SBadge>
            </dd>
          </div>
          <div class="s-record-row">
            <dt>Items</dt>
            <dd class="s-record-row__value">
              {{ receipt.itemsCount }} product{{ receipt.itemsCount !== 1 ? 's' : '' }}
            </dd>
          </div>
          <div class="s-record-row s-record-row--total">
            <dt>Total</dt>
            <dd class="s-record-row__value">{{ formatCurrency(receipt.total) }}</dd>
          </div>
        </dl>
      </section>

      <section class="s-form-section">
        <h3 class="s-form-section__title">Returned to inventory</h3>
        <ul class="s-record-rows s-receipt-items">
          <li v-for="(item, index) in receipt.items" :key="index" class="s-record-row">
            <span>{{ item.itemName }} × {{ item.quantity }}</span>
            <span class="s-record-row__value">
              {{ formatCurrency(item.price * item.quantity) }}
            </span>
          </li>
        </ul>
      </section>

      <div class="s-receipt-callout">
        <p class="s-receipt-callout__title">What will happen</p>
        <ul class="s-receipt-callout__list">
          <li>All items from this sale will be returned to inventory</li>
          <li>The associated customer will be removed (if this was their only sale)</li>
          <li>This sale will be permanently deleted</li>
        </ul>
      </div>

      <SCheckbox
        v-model="confirmed"
        label="I understand this permanently deletes this sale and its associated data."
      />
    </div>

    <template #footer>
      <SDialogActions
        primary-variant="danger"
        :primary-label="isProcessing ? 'Deleting…' : 'Delete sale'"
        :primary-icon="TrashIcon"
        :primary-loading="isProcessing"
        :primary-disabled="!confirmed || isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirmDelete"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SBadge from '~/components/s/SBadge.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { ref, watch } from 'vue'
import { TrashIcon } from '~/utils/app-icons'
import type { Receipt } from '~/stores/receipts'
import { getReceiptStatusTone } from '~/utils/receipt-status'
import { usePreferences } from '~/composables/usePreferences'

interface Props {
  modelValue: boolean
  receipt: Receipt | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirmDelete: [receipt: Receipt]
}>()

const confirmed = ref(false)
const isProcessing = ref(false)

const { formatCurrency } = usePreferences()

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
  confirmed.value = false
  emit('update:modelValue', false)
}

const handleConfirmDelete = () => {
  if (!props.receipt || !confirmed.value || isProcessing.value) return
  const receipt = props.receipt
  emit('confirmDelete', receipt)
  handleCancel()
}

// Reset form when modal opens/closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      confirmed.value = false
      isProcessing.value = false
    }
  }
)
</script>
