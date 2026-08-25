<template>
  <span :class="badgeClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SocialLeadStatus } from '~/types/social-sales'
import { socialLeadStatusLabel } from '~/types/social-sales'

const props = defineProps<{
  status: SocialLeadStatus
}>()

const label = computed(() => socialLeadStatusLabel(props.status))

const badgeClass = computed(() => {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'
  switch (props.status) {
    case 'new':
      return `${base} bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200`
    case 'contacted':
      return `${base} bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200`
    case 'negotiating':
      return `${base} bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200`
    case 'payment_pending':
      return `${base} bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200`
    case 'won':
      return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200`
    case 'lost':
      return `${base} bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300`
    default:
      return `${base} bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300`
  }
})
</script>
