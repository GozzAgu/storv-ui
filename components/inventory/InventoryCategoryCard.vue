<template>
  <article class="dash-grid-card inv-category-card dash-folder-card" @click="$emit('click')">
    <div v-if="hasOverlays" class="dash-folder-card__chrome">
      <div class="dash-folder-card__check" @click.stop>
        <slot name="checkbox" />
      </div>
      <div class="dash-folder-card__menu" @click.stop>
        <slot name="menu" />
      </div>
    </div>

    <GlassFolderMark class="dash-folder-card__mark" />

    <div class="dash-folder-card__copy">
      <h3 class="dash-folder-card__title">{{ displayName }}</h3>
      <p class="dash-folder-card__meta">{{ metaLabel }}</p>
      <p
        v-if="lowStockCount > 0"
        class="dash-folder-card__hint dash-folder-card__hint--warning"
      >
        {{ lowStockCount }} low stock
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GlassFolderMark from '~/components/ui/GlassFolderMark.vue'
import { formatCategoryDisplayName } from '~/utils/inventory-category-card'
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
