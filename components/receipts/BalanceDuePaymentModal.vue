<template>
 <Modal
 :model-value="modelValue"
 size="md"
 title="Record payment"
 @update:model-value="emit('update:modelValue', $event)"
 >
 <template #default>
 <div v-if="receipt" class="space-y-4">
 <div class="rounded-sm border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
 <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
 {{ receipt.receiptNumber }} · {{ receipt.customerName }}
 </p>
 <div class="mt-2 grid grid-cols-3 gap-2 text-center">
 <div>
 <p class="text-[10px] uppercase tracking-wide text-gray-500">Total</p>
 <p class="text-sm font-semibold tabular-nums">{{ formatCurrency(receipt.total) }}</p>
 </div>
 <div>
 <p class="text-[10px] uppercase tracking-wide text-gray-500">Paid</p>
 <p class="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
 {{ formatCurrency(amountPaid) }}
 </p>
 </div>
 <div>
 <p class="text-[10px] uppercase tracking-wide text-gray-500">Balance</p>
 <p class="text-sm font-semibold tabular-nums text-amber-800 dark:text-amber-200">
 {{ formatCurrency(balanceDue) }}
 </p>
 </div>
 </div>
 </div>

 <div>
 <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
 Payment amount
 </label>
 <input
 v-model.number="paymentAmount"
 type="number"
 min="0"
 step="0.01"
 :max="balanceDue"
 class="w-full rounded-sm bg-white px-3 py-2 text-sm tabular-nums dark:!bg-dashboard-card dark:text-gray-100"
 />
 <div class="mt-2 flex flex-wrap gap-2">
 <button
 v-for="preset in amountPresets"
 :key="preset.label"
 type="button"
 class="rounded-sm px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
 @click="paymentAmount = preset.value"
 >
 {{ preset.label }}
 </button>
 </div>
 </div>

 <div>
 <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
 Payment method
 </label>
 <PaymentMethodSelect
 v-model="paymentMethod"
 select-class="w-full rounded-sm bg-white px-3 py-2 text-sm dark:!bg-dashboard-card dark:text-gray-100"
 />
 </div>

 <div v-if="receipt.payments?.length" class="border-t border-gray-100 pt-3 dark:border-gray-800">
 <p class="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-500">Payment history</p>
 <ul class="space-y-1.5">
 <li
 v-for="(p, idx) in receipt.payments"
 :key="idx"
 class="flex justify-between text-xs text-gray-700 dark:text-gray-300"
 >
 <span>{{ p.method }} · {{ formatPaymentDate(p.paidAt) }}</span>
 <span class="font-medium tabular-nums">{{ formatCurrency(p.amount) }}</span>
 </li>
 </ul>
 </div>
 </div>
 </template>

 <template #footer>
 <div class="flex w-full justify-end gap-2">
 <button
 type="button"
 class="btn-secondary"
 @click="emit('update:modelValue', false)"
 >
 Cancel
 </button>
 <button
 type="button"
 :disabled="!canSubmit || submitting"
 class="btn-primary"
 @click="submit"
 >
 {{ submitting ? 'Saving…' : submitLabel }}
 </button>
 </div>
 </template>
 </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import PaymentMethodSelect from '~/components/receipts/PaymentMethodSelect.vue'
import type { Receipt } from '~/stores/receipts'
import { receiptAmountPaid, receiptBalanceDue, roundMoney } from '~/utils/receipt-balance'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'

const props = defineProps<{
 modelValue: boolean
 receipt: Receipt | null
}>()

const emit = defineEmits<{
 'update:modelValue': [value: boolean]
 completed: [receiptId: string]
}>()

const receiptsStore = useReceiptsStore()
const toast = useAppToast()
const { formatCurrency } = usePreferences()

const paymentAmount = ref(0)
const paymentMethod = ref('Cash')
const submitting = ref(false)

const { paymentTenderOptions } = usePaymentTenders()

const amountPaid = computed(() => (props.receipt ? receiptAmountPaid(props.receipt) : 0))
const balanceDue = computed(() => (props.receipt ? receiptBalanceDue(props.receipt) : 0))

const amountPresets = computed(() => {
 const bal = balanceDue.value
 if (bal <= 0) return []
 const half = roundMoney(bal / 2)
 return [
 { label: `Pay balance (${formatCurrency(bal)})`, value: bal },
 ...(half > 0 && half < bal ? [{ label: `Half (${formatCurrency(half)})`, value: half }] : []),
 ]
})

const canSubmit = computed(() => {
 const amt = roundMoney(Number(paymentAmount.value) || 0)
 return amt > 0 && amt <= balanceDue.value + 0.01
})

const submitLabel = computed(() => {
 const amt = roundMoney(Number(paymentAmount.value) || 0)
 if (amt >= balanceDue.value - 0.01) return 'Complete & move to receipts'
 return 'Record payment'
})

watch(
 () => props.modelValue,
 (open) => {
 if (!open || !props.receipt) return
 paymentMethod.value = props.receipt.paymentMethod?.split(',')[0]?.trim() || 'Cash'
 paymentAmount.value = receiptBalanceDue(props.receipt)
 }
)

function formatPaymentDate(d: Date | { toDate?: () => Date } | string) {
 const date =
 d && typeof d === 'object' && 'toDate' in d && typeof d.toDate === 'function'
 ? d.toDate()
 : d instanceof Date
 ? d
 : new Date(d as string)
 return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

async function submit() {
 if (!props.receipt || !canSubmit.value) return
 submitting.value = true
 try {
 const { completed } = await receiptsStore.recordBalancePayment(props.receipt.id, {
 amount: paymentAmount.value,
 method: paymentMethod.value,
 })
 toast.success(
 completed
 ? 'Payment complete. Receipt is now in your sales list and stock is marked sold.'
 : 'Payment recorded.'
 )
 emit('completed', props.receipt.id)
 emit('update:modelValue', false)
 } catch (e: unknown) {
 toast.error(e instanceof Error ? e.message : 'Could not record payment')
 } finally {
 submitting.value = false
 }
}
</script>
