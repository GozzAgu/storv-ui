<template>
  <div
    class="ios-receipt-transaction-row"
    :class="{
      'ios-receipt-transaction-row--nested': nested,
      'ios-receipt-transaction-row--last': last,
      'ios-receipt-transaction-row--with-menu': showMenu,
    }"
  >
    <button type="button" class="ios-receipt-transaction-row__main" @click="$emit('click')">
      <div
        class="ios-receipt-transaction-row__icon"
        :class="`ios-receipt-transaction-row__icon--${variant}`"
        aria-hidden="true"
      >
        <UserCircleIcon v-if="variant === 'customer'" />
        <ArrowDownIcon v-else-if="variant === 'credit' || variant === 'pending'" />
        <ArrowUpIcon v-else-if="variant === 'debit'" />
        <XMarkIcon v-else />
      </div>
      <div class="ios-receipt-transaction-row__body">
        <p class="ios-receipt-transaction-row__title">{{ title }}</p>
        <p v-if="subtitle" class="ios-receipt-transaction-row__subtitle">{{ subtitle }}</p>
      </div>
      <div class="ios-receipt-transaction-row__meta">
        <p
          class="ios-receipt-transaction-row__amount"
          :class="`ios-receipt-transaction-row__amount--${amountTone}`"
        >
          {{ amount }}
        </p>
        <p v-if="date" class="ios-receipt-transaction-row__date">{{ date }}</p>
      </div>
    </button>
    <button
      v-if="showMenu"
      type="button"
      class="ios-list-row-menu-btn ios-receipt-transaction-row__menu"
      v-bind="menuAnchorAttrs"
      :aria-label="resolvedMenuAriaLabel"
      @click.stop="$emit('menu')"
    >
      <EllipsisVerticalIcon aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  XMarkIcon,
} from '~/utils/app-icons'

export type ReceiptTransactionVariant =
  | 'credit'
  | 'debit'
  | 'pending'
  | 'cancelled'
  | 'customer'

export type ReceiptTransactionAmountTone = 'positive' | 'negative' | 'neutral' | 'warning'

export type ReceiptTransactionMenuKind =
  | 'receipt'
  | 'customer'
  | 'stock-loan'
  | 'item'
  | 'staff'
  | 'lead'
  | 'buyback'
  | 'payment-link'
  | 'transfer'

const MENU_KIND_ANCHORS: Record<ReceiptTransactionMenuKind, string> = {
  receipt: 'data-receipt-actions-anchor',
  customer: 'data-customer-actions-anchor',
  'stock-loan': 'data-stock-loan-actions-anchor',
  item: 'data-item-actions-anchor',
  staff: 'data-staff-actions-anchor',
  lead: 'data-lead-actions-anchor',
  buyback: 'data-buyback-actions-anchor',
  'payment-link': 'data-payment-link-actions-anchor',
  transfer: 'data-transfer-actions-anchor',
}

const MENU_KIND_ARIA: Record<ReceiptTransactionMenuKind, string> = {
  receipt: 'Sale actions',
  customer: 'Customer actions',
  'stock-loan': 'Stock loan actions',
  item: 'Product actions',
  staff: 'Staff actions',
  lead: 'Lead actions',
  buyback: 'Buyback actions',
  'payment-link': 'Payment link actions',
  transfer: 'Transfer actions',
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    amount: string
    amountTone: ReceiptTransactionAmountTone
    date?: string
    variant: ReceiptTransactionVariant
    nested?: boolean
    last?: boolean
    showMenu?: boolean
    menuId?: string
    menuKind?: ReceiptTransactionMenuKind
    /** Override anchor attribute (e.g. data-item-actions-anchor). */
    menuAnchor?: string
    menuAriaLabel?: string
  }>(),
  {
    menuKind: 'receipt',
  }
)

defineEmits<{
  click: []
  menu: []
}>()

const resolvedMenuAnchor = computed(
  () => props.menuAnchor ?? MENU_KIND_ANCHORS[props.menuKind]
)

const resolvedMenuAriaLabel = computed(
  () => props.menuAriaLabel ?? MENU_KIND_ARIA[props.menuKind]
)

const menuAnchorAttrs = computed(() => {
  if (!props.showMenu || !props.menuId) return {}
  return { [resolvedMenuAnchor.value]: props.menuId }
})
</script>
