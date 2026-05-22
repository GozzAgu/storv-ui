<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="md"
    title="Record payment"
  >
    <div v-if="receipt" class="space-y-4">
      <div class="rounded-sm border border-gray-200/90 bg-gray-50/80 px-3 py-2.5 text-xs dark:border-gray-700/80 dark:bg-gray-800/40">
        <p class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.receiptNumber }}</p>
        <p class="mt-0.5 text-gray-600 dark:text-gray-400">{{ receipt.customerName }}</p>
        <dl class="mt-2 grid grid-cols-3 gap-2 tabular-nums">
          <div>
            <dt class="text-[10px] uppercase tracking-wide text-gray-500">Total</dt>
            <dd class="font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(receipt.total) }}</dd>
          </div>
          <div>
            <dt class="text-[10px] uppercase tracking-wide text-gray-500">Paid</dt>
            <dd class="font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(amountPaid) }}</dd>
          </div>
          <div>
            <dt class="text-[10px] uppercase tracking-wide text-gray-500">Balance</dt>
            <dd class="font-semibold text-amber-800 dark:text-amber-200">{{ formatCurrency(balanceDue) }}</dd>
          </div>
        </dl>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment amount</label>
        <input
          v-model.number="paymentAmount"
          type="number"
          min="0"
          step="0.01"
          :max="balanceDue"
          class="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums dark:border-gray-600 dark:!bg-dashboard-card dark:text-gray-100"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment method</label>
        <select
          v-model="paymentMethod"
          class="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:!bg-dashboard-card dark:text-gray-100"
        >
          <option value="">Select method</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Mobile Money">Mobile Money</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>

      <div v-if="paymentHistory.length > 0">
        <p class="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
          Payment history
        </p>
        <ul class="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
          <li
            v-for="(entry, idx) in paymentHistory"
            :key="idx"
            class="flex justify-between gap-2 rounded-sm border border-gray-200/80 px-2 py-1.5 dark:border-gray-700/80"
          >
            <span>{{ entry.method }} · {{ formatPaymentDate(entry.date) }}</span>
            <span class="tabular-nums font-medium">{{ formatCurrency(entry.amount) }}</span>
          </li>
        </ul>
      </div>

      <p v-if="errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="rounded-sm border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
          :disabled="isSubmitting"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-sm bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-500 disabled:opacity-50"
          :disabled="isSubmitting || !canSubmit"
          @click="handleSubmit"
        >
          {{
            willComplete
              ? 'Complete & move to receipts'
              : 'Record payment'
          }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import type { Receipt } from '~/stores/receipts'
import { useReceiptsStore } from '~/stores/receipts'
import { usePreferences } from '~/composables/usePreferences'
import {
  receiptAmountPaid,
  receiptBalanceDue,
  isReceiptFullyPaid,
} from '~/utils/receipt-outstanding'

const props = defineProps<{
  modelValue: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  recorded: [receipt: Receipt]
}>()

const receiptsStore = useReceiptsStore()
const preferences = usePreferences()

const paymentAmount = ref(0)
const paymentMethod = ref('Cash')
const isSubmitting = ref(false)
const errorMessage = ref('')

const amountPaid = computed(() => (props.receipt ? receiptAmountPaid(props.receipt) : 0))
const balanceDue = computed(() => (props.receipt ? receiptBalanceDue(props.receipt) : 0))
const paymentHistory = computed(() => props.receipt?.paymentHistory ?? [])

const willComplete = computed(() => {
  if (!props.receipt) return false
  const after = amountPaid.value + (paymentAmount.value || 0)
  return isReceiptFullyPaid({ ...props.receipt, amountPaid: after })
})

const canSubmit = computed(() => {
  const amt = paymentAmount.value
  return (
    !!props.receipt &&
    !!paymentMethod.value &&
    Number.isFinite(amt) &&
    amt > 0 &&
    amt <= balanceDue.value + 0.01
  )
})

const formatCurrency = (value: number) => preferences.formatCurrency(value)

function formatPaymentDate(date: Date | string | { toDate?: () => Date } | undefined) {
  if (!date) return ''
  try {
    const d =
      typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function'
        ? date.toDate()
        : new Date(date as string | Date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

watch(
  () => [props.modelValue, props.receipt] as const,
  ([open, receipt]) => {
    if (open && receipt) {
      paymentAmount.value = Math.max(0, receiptBalanceDue(receipt))
      paymentMethod.value = 'Cash'
      errorMessage.value = ''
      isSubmitting.value = false
    }
  },
)

async function handleSubmit() {
  if (!props.receipt || !canSubmit.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const updated = await receiptsStore.recordReceiptPayment(props.receipt.id, {
      amount: paymentAmount.value,
      method: paymentMethod.value,
    }, { storeId: props.receipt.storeId })
    emit('recorded', updated)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : 'Failed to record payment'
  } finally {
    isSubmitting.value = false
  }
}
</script>
