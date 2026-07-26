<template>
  <span :class="badge.class">
    <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="badge.dotClass" aria-hidden="true" />
    <span class="truncate">{{ badge.label }}</span>
  </span>
</template>

<script setup lang="ts">
import type { ReceiptStatusBadge } from '~/utils/receipt-status'

defineProps<{
  badge: ReceiptStatusBadge
}>()
</script>
