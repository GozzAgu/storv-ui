<template>
  <span class="s-c s-status-badge" :class="{ 's-status-badge--stacked': !inlineMeta }">
    <SBadge :tone="inventoryAvailabilityTone(badge.status)" dot>
      {{ badge.label }}<template v-if="badge.meta && inlineMeta"> · {{ badge.meta }}</template>
    </SBadge>
    <span v-if="badge.meta && !inlineMeta" class="s-status-badge__meta">{{ badge.meta }}</span>
  </span>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import {
  inventoryAvailabilityTone,
  type InventoryAvailabilityBadge,
} from '~/utils/inventory-availability'

withDefaults(
  defineProps<{
    badge: InventoryAvailabilityBadge
    /** Show the receipt ref inside the pill; below it on tight layouts. */
    inlineMeta?: boolean
  }>(),
  { inlineMeta: true }
)
</script>
