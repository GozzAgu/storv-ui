<template>
 <article
 class="inv-category-card app-card group relative flex w-full cursor-pointer flex-col rounded-xl border-0 bg-white p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-dashboard-card! dark:shadow-none"
 @click="$emit('click')"
 >
 <!-- Header: folder · pill · menu -->
 <div class="mb-2 flex items-center gap-1.5">
 <FolderIcon
 class="h-4 w-4 shrink-0 text-gray-800 dark:text-gray-200"
 stroke-width="1.5"
 aria-hidden="true"
 />
 <span
 class="ml-auto inline-flex min-w-0 max-w-[50%] items-center gap-1 rounded-full px-1.5 py-px text-[9px] font-semibold leading-tight ring-1 ring-inset"
 :class="trackingPill.pillClass"
 >
 <span class="h-1 w-1 shrink-0 rounded-full" :class="trackingPill.dotClass" aria-hidden="true" />
 <span class="truncate">{{ trackingPill.label }}</span>
 </span>
 <div
 v-if="hasOverlays"
 class="-mr-0.5 shrink-0"
 @click.stop
 >
 <slot name="menu" />
 </div>
 </div>

 <h3
 class="line-clamp-1 text-[13px] font-semibold leading-tight text-gray-900 dark:text-gray-50"
 :title="displayName"
 >
 {{ displayName }}
 </h3>
 <p
 class="mt-0.5 line-clamp-1 text-[10px] leading-snug text-gray-500 dark:text-gray-400"
 :title="descriptionText"
 >
 {{ descriptionText }}
 </p>

 <div class="mt-2 space-y-1 border-t border-gray-100/90 pt-2 dark:border-white/[0.06]">
 <div class="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
 <TagIcon class="h-3 w-3 shrink-0 text-gray-400" stroke-width="1.5" aria-hidden="true" />
 <span class="min-w-0 truncate">{{ typeLabel }} · {{ trackingShort }}</span>
 </div>
 <div class="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
 <BuildingOffice2Icon class="h-3 w-3 shrink-0 text-gray-400" stroke-width="1.5" aria-hidden="true" />
 <span class="min-w-0 truncate" :title="departmentLabel">{{ departmentLabel }}</span>
 </div>
 </div>

 <div class="mt-2 border-t border-gray-100/90 pt-2 dark:border-white/[0.06]">
 <div class="flex items-center gap-1.5">
 <div
 class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-white/[0.04] dark:ring-white/10"
 >
 <svg
 class="absolute inset-0 h-7 w-7 -rotate-90"
 viewBox="0 0 36 36"
 aria-hidden="true"
 >
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="none"
 class="stroke-gray-200/90 dark:stroke-white/10"
 stroke-width="3"
 />
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="none"
 class="stroke-primary-500 dark:stroke-primary-400"
 stroke-width="3"
 stroke-linecap="round"
 :stroke-dasharray="ringCircumference"
 :stroke-dashoffset="ringOffset"
 />
 </svg>
 <span
 class="relative z-10 flex h-full w-full items-center justify-center text-[9px] font-bold leading-none tabular-nums text-gray-800 dark:text-gray-100"
 >
 {{ percentLabel }}
 </span>
 </div>
 <div class="min-w-0 flex-1">
 <p class="text-[11px] font-semibold tabular-nums leading-tight text-gray-900 dark:text-gray-100">
 {{ itemCount }}
 <span class="font-medium text-gray-500 dark:text-gray-400">
 {{ itemCount === 1 ? 'item' : 'items' }}
 </span>
 </p>
 <p
 v-if="availabilityHint"
 class="truncate text-[9px] font-medium text-gray-500 dark:text-gray-400"
 :title="availabilityHint"
 >
 {{ availabilityHint }}
 </p>
 <p
 v-else-if="lowStockCount > 0"
 class="truncate text-[9px] font-medium text-amber-600 dark:text-amber-400"
 >
 {{ lowStockCount }} low
 </p>
 </div>
 <p
 class="shrink-0 text-[10px] font-semibold tabular-nums text-gray-800 dark:text-gray-200"
 :title="`Value ${formattedValue}`"
 >
 {{ formattedValue }}
 </p>
 <div
 v-if="hasOverlays"
 class="shrink-0 self-center"
 @click.stop
 >
 <slot name="checkbox" />
 </div>
 </div>
 </div>
 </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BuildingOffice2Icon, FolderIcon, TagIcon } from '@heroicons/vue/24/outline'
import {
 categoryDepartmentAccessLabel,
 categoryDescriptionText,
 categoryTrackingPill,
 formatCategoryDisplayName,
 formatCategoryTypeLabel,
} from '~/utils/inventory-category-card'
import {
 folderAvailabilityPercent,
 type FolderAvailabilityStats,
} from '~/utils/inventory-folder-availability'

const props = withDefaults(
 defineProps<{
 name: string
 description?: string
 type?: string
 itemCount: number
 lowStockCount?: number
 totalValue?: number
 hasSerialNumbers?: boolean
 allowedDepartmentIds?: string[]
 resolveDepartmentName?: (id: string) => string | undefined
 availabilityStats?: FolderAvailabilityStats | null
 statsLoading?: boolean
 hasOverlays?: boolean
 }>(),
 {
 description: '',
 type: undefined,
 lowStockCount: 0,
 totalValue: 0,
 hasSerialNumbers: false,
 allowedDepartmentIds: undefined,
 resolveDepartmentName: () => undefined,
 availabilityStats: null,
 statsLoading: false,
 hasOverlays: true,
 }
)

defineEmits<{
 click: []
}>()

const ringCircumference = 2 * Math.PI * 14

const displayName = computed(() => formatCategoryDisplayName(props.name))

const descriptionText = computed(() => categoryDescriptionText(props.description))

const typeLabel = computed(() => formatCategoryTypeLabel(props.type))

const trackingShort = computed(() => (props.hasSerialNumbers ? 'Serial' : 'Qty'))

const trackingPill = computed(() =>
 categoryTrackingPill(props.hasSerialNumbers, props.lowStockCount ?? 0)
)

const departmentLabel = computed(() =>
 categoryDepartmentAccessLabel(props.allowedDepartmentIds, props.resolveDepartmentName)
)

const availabilityPercent = computed(() => {
 const stats = props.availabilityStats
 if (stats && stats.total > 0) {
 return folderAvailabilityPercent(stats)
 }
 if (!props.statsLoading && stats && stats.total === 0 && props.itemCount > 0) {
 return 100
 }
 if (props.itemCount <= 0) return 0
 const healthy = Math.max(0, props.itemCount - (props.lowStockCount ?? 0))
 return Math.round((healthy / props.itemCount) * 100)
})

const percentLabel = computed(() => {
 if (props.statsLoading && !props.availabilityStats) return '…'
 return `${availabilityPercent.value}%`
})

const ringOffset = computed(() => {
 const pct = Math.min(100, Math.max(0, availabilityPercent.value)) / 100
 return ringCircumference * (1 - pct)
})

const availabilityHint = computed(() => {
 const s = props.availabilityStats
 if (!s || s.total <= 0) return null
 const parts: string[] = []
 if (s.sold > 0) parts.push(`${s.sold} sold`)
 if (s.onLoan > 0) parts.push(`${s.onLoan} on loan`)
 if (s.awaitingPayment > 0) parts.push(`${s.awaitingPayment} awaiting pay`)
 return parts.length ? parts.join(' · ') : null
})

const formattedValue = computed(() => {
 const v = props.totalValue ?? 0
 if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
 if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
 return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v)
})
</script>
