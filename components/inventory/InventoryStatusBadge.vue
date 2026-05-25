<template>
 <div class="inline-flex min-w-0 max-w-full flex-col items-start gap-0.5">
 <span
 :class="badge.class"
 :title="badgeTitle"
 >
 <span
 class="h-1.5 w-1.5 shrink-0 rounded-full"
 :class="badge.dotClass"
 aria-hidden="true"
 />
 <span class="truncate">{{ badge.label }}</span>
 <span
 v-if="badge.meta && inlineMeta"
 class="truncate font-mono text-[9px] font-normal tabular-nums text-current/55"
 >
 · {{ badge.meta }}
 </span>
 </span>
 <span
 v-if="badge.meta && !inlineMeta"
 class="max-w-full truncate font-mono text-[9px] tabular-nums text-gray-500 dark:text-gray-400"
 :title="badge.meta"
 >
 {{ badge.meta }}
 </span>
 </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryAvailabilityBadge } from '~/utils/inventory-availability'

const props = withDefaults(
 defineProps<{
 badge: InventoryAvailabilityBadge
 /** Show receipt ref inside the pill (table cells); below the pill on tight layouts */
 inlineMeta?: boolean
 }>(),
 { inlineMeta: true }
)

const badgeTitle = computed(() => {
 if (!props.badge.meta) return props.badge.label
 return `${props.badge.label} · ${props.badge.meta}`
})
</script>
