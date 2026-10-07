<template>
  <SDialog
      placement="right"
    :open="modelValue"
    :title="receipt ? `Sale #${receipt.receiptNumber}` : 'Sale details'"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div v-if="receipt" class="s-form">
        <div class="s-record-meta">
          <SBadge :tone="statusTone" size="md">{{ statusLabel }}</SBadge>
          <span class="s-record-meta__date">{{ formatDate(receipt.date) }}</span>
        </div>

        <section class="s-form-section">
          <h3 class="s-form-section__title">Customer</h3>
          <div class="s-record-party s-record-party--avatar">
            <SAvatar :name="receipt.customerName || 'Walk-in customer'" size="sm" />
            <div class="s-record-party__text">
              <p class="s-record-party__name">{{ receipt.customerName || 'Walk-in customer' }}</p>
              <p v-if="receipt.customerPhone || receipt.customerEmail" class="s-record-party__meta">
                {{ [receipt.customerPhone, receipt.customerEmail].filter(Boolean).join(' · ') }}
              </p>
            </div>
          </div>
        </section>

        <section class="s-form-section">
          <h3 class="s-form-section__title">
            Items <span class="s-form-section__count">{{ itemCount }}</span>
          </h3>
          <ReceiptTableLineItems :items="receipt.items" :items-count-fallback="receipt.itemsCount" />
        </section>

        <PaymentTimeline
          v-if="v2Sale"
          :receipt="receipt"
          @record-payment="emit('record-payment', receipt!)"
        />

        <!-- Balance-due: paid/balance summary + payment history -->
        <div v-else-if="isOutstanding" class="s-record-summary s-record-summary--warning">
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
          <div v-if="receipt.payments?.length" class="s-record-history">
            <h4 class="s-record-history__title">Payment history</h4>
            <ul class="s-record-rows">
              <li v-for="(p, idx) in receipt.payments" :key="idx" class="s-record-row">
                <span>{{ p.method }} · {{ formatDate(p.paidAt) }}</span>
                <span class="s-record-row__value">{{ formatCurrency(p.amount) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Completed/other: simple total + payment method -->
        <dl v-if="!isOutstanding || v2Sale" class="s-record-summary s-record-summary--stack">
          <div class="s-record-row">
            <dt>Payment</dt>
            <dd class="s-record-row__value">{{ receipt.paymentMethod }}</dd>
          </div>
          <template v-if="showCommission">
            <div class="s-record-row">
              <dt>Items</dt>
              <dd class="s-record-row__value">
                {{ formatCurrency(receipt.total - (receipt.commissionAmount ?? 0)) }}
              </dd>
            </div>
            <div class="s-record-row">
              <dt>
                Commission<template v-if="receipt.commissionOwedToName">
                  · {{ receipt.commissionOwedToName }}</template>
              </dt>
              <dd class="s-record-row__value">{{ formatCurrency(receipt.commissionAmount ?? 0) }}</dd>
            </div>
          </template>
          <div v-if="receipt.notes" class="s-record-row">
            <dt>Note</dt>
            <dd class="s-record-row__value">{{ receipt.notes }}</dd>
          </div>
          <div class="s-record-row s-record-row--total">
            <dt>Total</dt>
            <dd class="s-record-row__value">{{ formatCurrency(receipt.total) }}</dd>
          </div>
        </dl>

        <p v-if="isOutstanding && !v2Sale && receipt.notes" class="s-form-meta">
          <strong>Note:</strong> {{ receipt.notes }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="s-dialog__foot-start">
        <SButton @click="emit('preview', receipt!)">
          <template #leading>
            <EyeIcon :size="16" :stroke-width="2" aria-hidden="true" />
          </template>
          Preview receipt
        </SButton>
        <SButton @click="emit('print', receipt!)">
          <template #leading>
            <PrinterIcon :size="16" :stroke-width="2" aria-hidden="true" />
          </template>
          Print / PDF
        </SButton>
      </div>
      <SButton
        v-if="isOutstanding && canClose"
        variant="danger"
        @click="emit('cancel', receipt!)"
      >
        Cancel order
      </SButton>
      <SButton
        v-if="receipt?.status === 'completed' && canClose"
        @click="emit('refund', receipt!)"
      >
        Refund
      </SButton>
      <SButton
        v-if="isOutstanding && !v2Sale"
        variant="primary"
        @click="emit('record-payment', receipt!)"
      >
        Record payment
      </SButton>
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import { computed } from 'vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import ReceiptTableLineItems from '~/components/receipts/ReceiptTableLineItems.vue'
import { EyeIcon, PrinterIcon } from '~/utils/app-icons'
import type { Receipt } from '~/stores/receipts'
import { receiptAmountPaid, receiptBalanceDue } from '~/utils/receipt-balance'
import { getReceiptStatusLabel, getReceiptStatusTone } from '~/utils/receipt-status'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
import PaymentTimeline from '~/components/payments/PaymentTimeline.vue'
import { isV2Sale } from '~/utils/payments-v2-tenders'

const props = defineProps<{
  modelValue: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  preview: [receipt: Receipt]
  print: [receipt: Receipt]
  'record-payment': [receipt: Receipt]
  cancel: [receipt: Receipt]
  refund: [receipt: Receipt]
}>()

const { canEditReceipts, canViewProfitAndCost } = usePermissions()

const showCommission = computed(
  () => canViewProfitAndCost.value && (props.receipt?.commissionAmount ?? 0) > 0
)
const { formatCurrency } = usePreferences()
const { access: paymentsAccess } = usePaymentsV2()

const v2Sale = computed(
  () => !!props.receipt && paymentsAccess.value.enabled && isV2Sale(props.receipt)
)
/** V2 sales close through the server, which allows the owner or payments.refund holders. */
const canClose = computed(() =>
  v2Sale.value ? paymentsAccess.value.canRefund : canEditReceipts.value
)

const isOutstanding = computed(() => props.receipt?.status === 'balance_due')
const amountPaid = computed(() => (props.receipt ? receiptAmountPaid(props.receipt) : 0))
const balanceDue = computed(() => (props.receipt ? receiptBalanceDue(props.receipt) : 0))

const statusLabel = computed(() => (props.receipt ? getReceiptStatusLabel(props.receipt.status) : ''))
const itemCount = computed(() =>
  props.receipt
    ? (props.receipt.items ?? []).reduce((sum, item) => sum + (item.quantity || 0), 0) ||
      props.receipt.itemsCount ||
      0
    : 0
)

const statusTone = computed(() =>
  props.receipt ? getReceiptStatusTone(props.receipt.status) : 'neutral'
)

function formatDate(d: Date | { toDate?: () => Date } | string | undefined) {
  if (!d) return ''
  const date =
    d && typeof d === 'object' && 'toDate' in d && typeof d.toDate === 'function'
      ? d.toDate()
      : d instanceof Date
      ? d
      : new Date(d as string)
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
</script>
