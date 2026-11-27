<template>
  <span class="s-pay-method" :title="label">
    <component
      :is="icon"
      class="s-pay-method__icon"
      :size="14"
      :stroke-width="1.75"
      aria-hidden="true"
    />
    <span class="s-pay-method__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Banknote, CreditCard, Hash, Landmark, Smartphone, Split, Wallet } from '~/icons'
import { paymentKind } from '~/utils/sale-display'

const props = defineProps<{ method?: string | null }>()

const ICONS = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  mobile: Smartphone,
  ussd: Hash,
  split: Split,
  other: Wallet,
} as const

const label = computed(() => {
  const m = String(props.method ?? '').trim()
  return m ? m.charAt(0).toUpperCase() + m.slice(1) : '—'
})

const icon = computed(() => ICONS[paymentKind(props.method)])
</script>
