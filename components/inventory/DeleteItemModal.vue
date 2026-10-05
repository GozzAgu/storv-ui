<template>
  <SDialog
    :open="props.modelValue"
    role="alertdialog"
    size="sm"
    :title="`Delete ${itemName || 'this product'}?`"
    description="This can't be undone. The product will be permanently removed from inventory."
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

      <ul class="s-confirm__consequences" aria-label="What will happen">
        <li>Product permanently deleted from inventory</li>
        <li>All associated data removed</li>
        <li>This action cannot be undone</li>
      </ul>

      <div class="s-confirm__ack">
        <SCheckbox
          v-model="confirmed"
          label="I understand that this action cannot be undone and will permanently delete this product."
        />
      </div>
    </div>

    <template #footer>
      <SDialogActions
        primary-variant="danger"
        :primary-label="isProcessing ? 'Deleting…' : 'Delete product'"
        :primary-icon="Trash2"
        :primary-disabled="!confirmed || isProcessing"
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
import { Trash2 } from '@lucide/vue'
import { usePreferences } from '~/composables/usePreferences'

interface Props {
  modelValue: boolean
  item: any | null
  itemName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: [item: any]
}>()

const { formatCurrency: formatCurrencyUtil } = usePreferences()

const confirmed = ref(false)
const isProcessing = ref(false)

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
    emit('deleted', props.item)
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
    }
  }
)
</script>
