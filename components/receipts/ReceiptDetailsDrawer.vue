<template>
  <SidePanel
    :model-value="modelValue"
    :title="receipt ? `Sale #${receipt.receiptNumber}` : 'Sale details'"
    size="lg"
    dense
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div v-if="receipt" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span
            class="inline-flex items-center rounded px-2 py-1 text-[10px] font-medium"
            :class="statusPillClass"
          >
            {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1).replace('_', ' ') }}
          </span>
          <span class="text-[11px] text-gray-500 dark:text-gray-400">{{ formatDate(receipt.date) }}</span>
        </div>

        <div class="rounded-sm bg-gray-50/80 px-3 py-2.5 dark:bg-white/[0.03]">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
            {{ receipt.customerName }}
          </p>
          <p v-if="receipt.customerPhone || receipt.customerEmail" class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {{ [receipt.customerPhone, receipt.customerEmail].filter(Boolean).join(' · ') }}
          </p>
        </div>

        <div>
          <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Items
          </p>
          <ReceiptTableLineItems :items="receipt.items" :items-count-fallback="receipt.itemsCount" />
        </div>

        <!-- Balance-due: paid/balance summary + payment history -->
        <div
          v-if="isOutstanding"
          class="rounded-sm border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20"
        >
          <div class="grid grid-cols-3 gap-2 text-center">
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
          <div v-if="receipt.payments?.length" class="mt-3 border-t border-amber-200/60 pt-2.5 dark:border-amber-900/40">
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">Payment history</p>
            <ul class="space-y-1">
              <li
                v-for="(p, idx) in receipt.payments"
                :key="idx"
                class="flex justify-between text-xs text-gray-700 dark:text-gray-300"
              >
                <span>{{ p.method }} · {{ formatDate(p.paidAt) }}</span>
                <span class="font-medium tabular-nums">{{ formatCurrency(p.amount) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Completed/other: simple total + payment method -->
        <div v-else class="rounded-sm bg-gray-50/80 px-3 py-2.5 dark:bg-white/[0.03]">
          <div class="flex justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">Payment</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ receipt.paymentMethod }}</span>
          </div>
          <div class="mt-1.5 flex justify-between border-t border-gray-200/70 pt-1.5 text-sm font-semibold dark:border-white/10">
            <span>Total</span>
            <span class="tabular-nums">{{ formatCurrency(receipt.total) }}</span>
          </div>
        </div>

        <div v-if="receipt.notes" class="text-xs text-gray-600 dark:text-gray-400">
          <span class="font-medium text-gray-700 dark:text-gray-300">Notes:</span> {{ receipt.notes }}
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="md"
          :icon="EyeIcon"
          extra-class="!w-auto"
          @click="emit('preview', receipt!)"
        >
          Preview receipt
        </Button>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <Button
            v-if="isOutstanding"
            variant="primary"
            size="md"
            extra-class="!w-auto"
            @click="emit('record-payment', receipt!)"
          >
            Record payment
          </Button>
          <Button
            v-if="isOutstanding && canEditReceipts"
            variant="outline"
            size="md"
            extra-class="!w-auto !text-red-600 dark:!text-red-400"
            @click="emit('cancel', receipt!)"
          >
            Cancel order
          </Button>
          <Button
            v-if="receipt?.status === 'completed' && canEditReceipts"
            variant="outline"
            size="md"
            extra-class="!w-auto"
            @click="emit('refund', receipt!)"
          >
            Refund
          </Button>
        </div>
      </div>
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
import ReceiptTableLineItems from '~/components/receipts/ReceiptTableLineItems.vue'
import { EyeIcon } from '~/utils/app-icons'
import type { Receipt } from '~/stores/receipts'
import { receiptAmountPaid, receiptBalanceDue } from '~/utils/receipt-balance'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'

const props = defineProps<{
  modelValue: boolean
  receipt: Receipt | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  preview: [receipt: Receipt]
  'record-payment': [receipt: Receipt]
  cancel: [receipt: Receipt]
  refund: [receipt: Receipt]
}>()

const { canEditReceipts } = usePermissions()
const { formatCurrency } = usePreferences()

const isOutstanding = computed(() => props.receipt?.status === 'balance_due')
const amountPaid = computed(() => (props.receipt ? receiptAmountPaid(props.receipt) : 0))
const balanceDue = computed(() => (props.receipt ? receiptBalanceDue(props.receipt) : 0))

const statusPillClass = computed(() => {
  switch (props.receipt?.status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    case 'refunded':
      return 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
    case 'balance_due':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
    case 'cancelled':
      return 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
  }
})

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
