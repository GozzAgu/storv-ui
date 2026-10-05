<template>
  <SDialog
    :open="modelValue"
    size="md"
    title="Record payment"
    @update:open="emit('update:modelValue', $event)"
  >
    <template #default>
      <div v-if="receipt" class="s-form">
        <div class="s-record-summary s-record-summary--warning">
          <p class="s-receipt-pay__ref">
            {{ receipt.receiptNumber }} · {{ receipt.customerName }}
          </p>
          <dl class="s-record-totals">
            <div>
              <dt class="s-record-totals__label">Total</dt>
              <dd class="s-record-totals__value">{{ formatCurrency(receipt.total) }}</dd>
            </div>
            <div>
              <dt class="s-record-totals__label">Paid</dt>
              <dd class="s-record-totals__value s-record-totals__value--success">
                {{ formatCurrency(amountPaid) }}
              </dd>
            </div>
            <div>
              <dt class="s-record-totals__label">Balance</dt>
              <dd class="s-record-totals__value s-record-totals__value--warning">
                {{ formatCurrency(balanceDue) }}
              </dd>
            </div>
          </dl>
        </div>

        <SField label="Payment amount">
          <SInput
            v-model="paymentAmount"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            :max="balanceDue"
          />
          <div v-if="amountPresets.length" class="s-receipt-pay__presets">
            <SButton
              v-for="preset in amountPresets"
              :key="preset.label"
              size="sm"
              @click="paymentAmount = preset.value"
            >
              {{ preset.label }}
            </SButton>
          </div>
        </SField>

        <SField label="Payment method">
          <template #default="{ id: methodId }">
            <div class="s-control s-control--select">
              <PaymentMethodSelect :id="methodId" v-model="paymentMethod" />
              <ChevronDownIcon
                class="s-control__chevron"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
            </div>
          </template>
        </SField>

        <div v-if="receipt.payments?.length" class="s-record-history">
          <h4 class="s-record-history__title">Payment history</h4>
          <ul class="s-record-rows">
            <li v-for="(p, idx) in receipt.payments" :key="idx" class="s-record-row">
              <span>{{ p.method }} · {{ formatPaymentDate(p.paidAt) }}</span>
              <span class="s-record-row__value">{{ formatCurrency(p.amount) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #footer>
      <SDialogActions
        :primary-label="submitLabel"
        :primary-loading="submitting"
        :primary-disabled="!canSubmit"
        @cancel="emit('update:modelValue', false)"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SInput from '~/components/s/SInput.vue'
import SButton from '~/components/s/SButton.vue'
import { ref, computed, watch } from 'vue'
import { ChevronDownIcon } from '~/utils/app-icons'
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
  if (amt >= balanceDue.value - 0.01) return 'Complete & move to sales'
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
