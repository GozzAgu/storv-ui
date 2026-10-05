<template>
  <article class="s-c s-category-card" :class="{ 's-category-card--selected': selected }">
    <div class="s-category-card__head">
      <span class="s-category-card__mark" aria-hidden="true">
        <component
          :is="childCount > 0 ? FolderTree : FolderClosed"
          :size="16"
          :stroke-width="1.75"
          fill="currentColor"
          fill-opacity="0.14"
        />
      </span>
      <div v-if="hasOverlays" class="s-category-card__controls">
        <slot name="checkbox" />
        <slot name="menu" />
      </div>
    </div>

    <div class="s-category-card__body">
      <h3 class="s-category-card__title">
        <button type="button" class="s-category-card__link" @click="$emit('click')">
          {{ displayName }}
        </button>
      </h3>
      <p class="s-category-card__meta">{{ metaLabel }}</p>
    </div>

    <div class="s-category-card__foot">
      <div v-if="valueLabel" class="s-category-card__stat">
        <span class="s-category-card__stat-label">Stock value</span>
        <span class="s-category-card__value">{{ valueLabel }}</span>
      </div>
      <div v-if="lowStockCount > 0 || hasSerialNumbers" class="s-category-card__badges">
        <SBadge v-if="lowStockCount > 0" tone="warning" size="sm" dot>{{ lowStockCount }} low</SBadge>
        <SBadge v-if="hasSerialNumbers" size="sm">Serial</SBadge>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FolderClosed, FolderTree } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import { formatCategoryDisplayName } from '~/utils/inventory-category-format'
import type { FolderAvailabilityStats } from '~/utils/inventory-folder-availability'

const props = withDefaults(
  defineProps<{
    name: string
    description?: string
    type?: string
    itemCount: number
    childCount?: number
    lowStockCount?: number
    totalValue?: number
    /** Pre-formatted stock value shown next to the item count. */
    valueLabel?: string
    selected?: boolean
    hasSerialNumbers?: boolean
    allowedDepartmentIds?: string[]
    resolveDepartmentName?: (id: string) => string | undefined
    availabilityStats?: FolderAvailabilityStats | null
    statsLoading?: boolean
    hasOverlays?: boolean
    trackProfit?: boolean
    grossProfitOnHand?: number | null
    showProfit?: boolean
    showDepartments?: boolean
  }>(),
  {
    description: '',
    type: undefined,
    childCount: 0,
    lowStockCount: 0,
    totalValue: 0,
    valueLabel: '',
    selected: false,
    hasSerialNumbers: false,
    allowedDepartmentIds: undefined,
    resolveDepartmentName: () => undefined,
    availabilityStats: null,
    statsLoading: false,
    hasOverlays: true,
    trackProfit: false,
    grossProfitOnHand: null,
    showProfit: false,
    showDepartments: true,
  }
)

defineEmits<{
  click: []
}>()

const displayName = computed(() => formatCategoryDisplayName(props.name))

const metaLabel = computed(() => {
  if ((props.childCount ?? 0) > 0) {
    const n = props.childCount ?? 0
    return `${n} subcategor${n === 1 ? 'y' : 'ies'}`
  }
  const n = props.itemCount
  return `${n} ${n === 1 ? 'item' : 'items'}`
})
</script>
