<template>
  <SDialog
    :open="modelValue"
    size="md"
    :title="receipt ? `Edit sale #${receipt.receiptNumber}` : 'Edit sale'"
    @update:open="emit('update:modelValue', $event)"
  >
    <template #default>
      <form v-if="receipt" class="s-form" @submit.prevent="submit">
        <p class="s-field__hint s-receipt-edit__intro">
          You can correct the customer’s details and the note. Items, prices and payments stay as
          recorded; refund and sell again to change those. The receipt will show it was edited.
        </p>

        <SInput
          v-model="form.customerName"
          label="Customer name"
          autocomplete="off"
          :maxlength="RECEIPT_EDIT_LIMITS.customerName"
          required
        />
        <div class="s-receipt-edit__row">
          <SInput
            v-model="form.customerPhone"
            label="Phone"
            hint="Optional"
            type="tel"
            inputmode="tel"
            autocomplete="off"
            :maxlength="RECEIPT_EDIT_LIMITS.customerPhone"
          />
          <SInput
            v-model="form.customerEmail"
            label="Email"
            hint="Optional"
            type="email"
            inputmode="email"
            autocomplete="off"
            :maxlength="RECEIPT_EDIT_LIMITS.customerEmail"
          />
        </div>
        <SInput
          v-model="form.customerAddress"
          label="Address"
          hint="Optional"
          autocomplete="off"
          :maxlength="RECEIPT_EDIT_LIMITS.customerAddress"
        />
        <STextarea
          v-model="form.notes"
          label="Note"
          hint="Optional"
          :rows="2"
          :maxlength="RECEIPT_EDIT_LIMITS.notes"
        />

        <div v-if="changes.length" class="s-record-summary s-receipt-edit__diff">
          <h4 class="s-record-history__title">What will change</h4>
          <ul class="s-record-rows">
            <li v-for="change in changes" :key="change.field" class="s-receipt-edit__change">
              <span class="s-receipt-edit__field">{{
                RECEIPT_EDIT_FIELD_LABELS[change.field]
              }}</span>
              <span class="s-receipt-edit__values">
                <del>{{ change.from || 'Empty' }}</del>
                <span aria-hidden="true">→</span>
                <ins>{{ change.to || 'Empty' }}</ins>
              </span>
            </li>
          </ul>
        </div>

        <STextarea
          v-model="reason"
          label="Reason for this edit"
          hint="Kept with the sale’s history so everyone can see why it changed."
          placeholder="e.g. Customer’s phone number was mistyped"
          :rows="2"
          :maxlength="RECEIPT_EDIT_LIMITS.reason"
          :error="reasonError"
          required
        />
      </form>
    </template>

    <template #footer>
      <SDialogActions
        primary-label="Save changes"
        :primary-loading="submitting"
        :primary-disabled="!canSubmit"
        @cancel="emit('update:modelValue', false)"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SInput from '~/components/s/SInput.vue'
import STextarea from '~/components/s/STextarea.vue'
import type { Receipt } from '~/stores/receipts'
import { useReceiptsStore } from '~/stores/receipts'
import { useSalesApi } from '~/composables/useSalesApi'
import { useAppToast } from '~/composables/useAppToast'
import { isDemoModeActive } from '~/utils/demo-mode'
import {
  RECEIPT_EDITABLE_FIELDS,
  RECEIPT_EDIT_FIELD_LABELS,
  RECEIPT_EDIT_LIMITS,
  type ReceiptEditableField,
  type ReceiptEditChange,
} from '~/utils/receipt-edit'

const props = defineProps<{
  modelValue: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  edited: [receiptId: string]
}>()

const salesApi = useSalesApi()
const receiptsStore = useReceiptsStore()
const toast = useAppToast()

const form = reactive<Record<ReceiptEditableField, string>>({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  notes: '',
})
const reason = ref('')
const reasonTouched = ref(false)
const submitting = ref(false)

function original(field: ReceiptEditableField): string {
  return String(props.receipt?.[field] ?? '').trim()
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.receipt) return
    for (const field of RECEIPT_EDITABLE_FIELDS) form[field] = original(field)
    reason.value = ''
    reasonTouched.value = false
  },
  { immediate: true }
)

const changes = computed<ReceiptEditChange[]>(() =>
  RECEIPT_EDITABLE_FIELDS.flatMap((field) => {
    const to = form[field].trim()
    const from = original(field)
    return to === from ? [] : [{ field, from, to }]
  })
)

watch(reason, () => (reasonTouched.value = true))

const reasonError = computed(() =>
  reasonTouched.value && reason.value.trim().length > 0 && reason.value.trim().length < 3
    ? 'Add a few words about why'
    : undefined
)

const canSubmit = computed(
  () =>
    !submitting.value &&
    changes.value.length > 0 &&
    form.customerName.trim().length > 0 &&
    reason.value.trim().length >= 3
)

async function submit() {
  if (!props.receipt || !canSubmit.value) return
  submitting.value = true
  const receiptId = props.receipt.id
  const patch = Object.fromEntries(changes.value.map((c) => [c.field, c.to])) as Partial<
    Record<ReceiptEditableField, string>
  >
  try {
    if (isDemoModeActive()) {
      await receiptsStore.updateReceipt(receiptId, {
        ...patch,
        edited: true,
        editCount: (props.receipt.editCount ?? 0) + 1,
        lastEditedAt: new Date(),
        lastEditedByName: 'You',
        lastEditReason: reason.value.trim(),
      })
      toast.success('Sale updated.')
      emit('edited', receiptId)
      emit('update:modelValue', false)
      return
    }
    const result = await salesApi.editSale(receiptId, patch, reason.value.trim())
    receiptsStore.applyReceiptEdit(receiptId, result.changes, {
      editCount: result.editCount,
      reason: reason.value.trim(),
    })
    toast.success('Sale updated. The edit is recorded in its history.')
    emit('edited', receiptId)
    emit('update:modelValue', false)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not save the changes')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.s-receipt-edit__intro {
  margin: 0;
}

.s-receipt-edit__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-space-1-5);
}

@media (max-width: 520px) {
  .s-receipt-edit__row {
    grid-template-columns: 1fr;
  }
}

.s-receipt-edit__diff {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
}

.s-receipt-edit__diff .s-record-history__title {
  margin: 0;
}

.s-receipt-edit__change {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
  font: var(--s-text-small);
}

.s-receipt-edit__field {
  color: var(--s-text-muted);
}

.s-receipt-edit__values {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-space-1);
  min-width: 0;
  overflow-wrap: anywhere;
}

.s-receipt-edit__values del {
  color: var(--s-text-muted);
}

.s-receipt-edit__values ins {
  color: var(--s-text);
  font-weight: 500;
  text-decoration: none;
}
</style>
