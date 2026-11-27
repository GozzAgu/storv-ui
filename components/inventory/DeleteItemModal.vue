<template>
  <SDialog
    :open="props.modelValue"
    role="alertdialog"
    size="sm"
    :title="`Delete ${itemName || 'this product'}?`"
    description="The product is removed from inventory. A copy is kept in Returns so it can be traced or restored."
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="s-confirm">
      <dl v-if="item" class="s-record-summary s-record-summary--stack">
        <div v-if="item.brand || item.model" class="s-record-row">
          <dt>Product model</dt>
          <dd class="s-record-row__value">
            {{ item.brand || '' }}{{ item.brand && item.model ? ' ' : '' }}{{ item.model || '' }}
          </dd>
        </div>
        <div v-if="item.serialNo || item.serialNumber" class="s-record-row">
          <dt>Serial number</dt>
          <dd class="s-record-row__value">{{ item.serialNo || item.serialNumber }}</dd>
        </div>
        <div v-if="item.quantity !== undefined" class="s-record-row">
          <dt>Quantity</dt>
          <dd class="s-record-row__value">{{ item.quantity }}</dd>
        </div>
        <div v-if="item.price" class="s-record-row">
          <dt>Unit price</dt>
          <dd class="s-record-row__value">{{ formatCurrency(item.price) }}</dd>
        </div>
      </dl>

      <DeleteReasonFields v-model="why" :count="1" />

      <div class="s-confirm__ack">
        <SCheckbox
          v-model="confirmed"
          label="I understand this product will be removed from inventory."
        />
      </div>
    </div>

    <template #footer>
      <SDialogActions
        primary-variant="danger"
        :primary-label="isProcessing ? 'Deleting…' : 'Delete product'"
        :primary-icon="Trash2"
        :primary-disabled="!confirmed || isProcessing || !isDeleteWhyComplete(why)"
        @cancel="handleCancel"
        @primary="handleConfirmDelete"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import { ref, watch } from 'vue'
import { Trash2 } from '~/icons'
import { usePreferences } from '~/composables/usePreferences'
import DeleteReasonFields from '~/components/inventory/DeleteReasonFields.vue'
import { isDeleteWhyComplete, type DeleteWhy } from '~/types/stock-removals'

interface Props {
  modelValue: boolean
  item: any | null
  itemName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: [item: any, why: DeleteWhy]
}>()

const { formatCurrency: formatCurrencyUtil } = usePreferences()

const confirmed = ref(false)
const isProcessing = ref(false)
const why = ref<DeleteWhy>({ reason: 'entered_by_mistake', note: '' })

const formatCurrency = (value: number) => {
  return formatCurrencyUtil(value)
}

const handleCancel = () => {
  confirmed.value = false
  emit('update:modelValue', false)
}

const handleConfirmDelete = async () => {
  if (!props.item || !confirmed.value || isProcessing.value) return

  isProcessing.value = true

  try {
    emit('deleted', props.item, {
      reason: why.value.reason,
      note: why.value.note?.trim() || undefined,
    })
    handleCancel()
  } catch (error: any) {
    console.error('Delete error:', error)
  } finally {
    isProcessing.value = false
  }
}

// Reset form when modal opens/closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      confirmed.value = false
      isProcessing.value = false
      why.value = { reason: 'entered_by_mistake', note: '' }
    }
  }
)
</script>
