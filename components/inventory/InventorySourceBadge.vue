<template>
  <span class="s-c s-status-badge" :class="{ 's-status-badge--stacked': !inlineMeta }">
    <SBadge :tone="inventorySourceTone(badge.source)">
      {{ badge.label }}<template v-if="badge.meta && inlineMeta"> · {{ badge.meta }}</template>
    </SBadge>
    <span v-if="badge.meta && !inlineMeta" class="s-status-badge__meta">{{ badge.meta }}</span>
  </span>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import {
  inventorySourceTone,
  type InventorySourceBadge,
} from '~/utils/inventory-acquisition-source'

withDefaults(
  defineProps<{
    badge: InventorySourceBadge
    inlineMeta?: boolean
  }>(),
  { inlineMeta: true }
)
</script>
