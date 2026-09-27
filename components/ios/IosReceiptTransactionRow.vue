<template>
  <div
    class="ios-receipt-transaction-row"
    :class="{
      'ios-receipt-transaction-row--nested': nested,
      'ios-receipt-transaction-row--last': last,
      'ios-receipt-transaction-row--with-menu': showMenu && !selectable,
      'ios-receipt-transaction-row--selected': selectable && selected,
      'ios-receipt-transaction-row--selectable': selectable,
    }"
  >
    <label
      v-if="selectable"
      class="ios-inventory-folder-row__select"
      @click.stop
    >
      <input
        type="checkbox"
        class="ios-inventory-folder-row__select-input"
        :checked="selected"
        @change="$emit('select', ($event.target as HTMLInputElement).checked)"
      />
      <span class="ios-inventory-folder-row__select-box" aria-hidden="true">
        <svg
          class="ios-inventory-folder-row__select-mark"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
      <span class="sr-only">Select {{ title }}</span>
    </label>
    <button type="button" class="ios-receipt-transaction-row__main" @click="$emit('click')">
      <div
        v-if="avatarUrl && !avatarFailed"
        class="ios-receipt-transaction-row__icon ios-receipt-transaction-row__icon--avatar"
        aria-hidden="true"
      >
        <img :src="avatarUrl" alt="" loading="lazy" @error="avatarFailed = true" />
      </div>
      <div
        v-else
        class="ios-receipt-transaction-row__icon"
        :class="`ios-receipt-transaction-row__icon--${variant}`"
        aria-hidden="true"
      >
        <UserCircleIcon v-if="variant === 'customer'" />
        <ReceiptPercentIcon v-else-if="variant === 'credit'" />
        <ClockIcon v-else-if="variant === 'pending'" />
        <ArrowUturnLeftIcon v-else-if="variant === 'debit'" />
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
      v-if="showMenu && !selectable"
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
import { computed, ref, watch } from 'vue'
import {
  ArrowUturnLeftIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ReceiptPercentIcon,
  UserCircleIcon,
  XMarkIcon,
} from '~/utils/app-icons'

/**
 * `credit` = completed sale / available stock, `pending` = awaiting payment/balance due,
 * `debit` = refunded, `cancelled` = cancelled, `customer` = a customer row
 * rather than a receipt. Credit uses the sales glyph (neutral), not a green check.
 */
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
  | 'inquiry'

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
  inquiry: 'data-inquiry-actions-anchor',
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
  inquiry: 'Inquiry actions',
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
    selectable?: boolean
    selected?: boolean
    /** Photo shown instead of the variant glyph (e.g. staff roster). */
    avatarUrl?: string
  }>(),
  {
    menuKind: 'receipt',
    selectable: false,
    selected: false,
  }
)

defineEmits<{
  click: []
  menu: []
  select: [checked: boolean]
}>()

const avatarFailed = ref(false)
watch(
  () => props.avatarUrl,
  () => {
    avatarFailed.value = false
  }
)

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

