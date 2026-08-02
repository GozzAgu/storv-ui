<template>
  <article class="dash-grid-card inv-category-card" @click="$emit('click')">
    <div class="dash-grid-card__head">
      <FolderIcon class="dash-grid-card__icon" stroke-width="1.5" aria-hidden="true" />
      <span :class="trackingPill.pillClass">
        <span class="dash-grid-card__pill-dot" aria-hidden="true" />
        <span class="truncate">{{ trackingPill.label }}</span>
      </span>
      <div v-if="hasOverlays" class="-mr-0.5 shrink-0" @click.stop>
        <slot name="menu" />
      </div>
    </div>

    <div class="dash-grid-card__intro">
      <h3 class="dash-grid-card__title">
        {{ displayName }}
      </h3>
      <p class="dash-grid-card__desc">
        {{ descriptionText }}
      </p>
    </div>

    <div class="dash-grid-card__meta-block">
      <div class="dash-grid-card__meta-row">
        <TagIcon class="dash-grid-card__meta-icon" stroke-width="1.5" aria-hidden="true" />
        <span class="min-w-0 truncate">{{ typeLabel }} · {{ trackingShort }}</span>
      </div>
      <div class="dash-grid-card__meta-row">
        <BuildingOffice2Icon
          class="dash-grid-card__meta-icon"
          stroke-width="1.5"
          aria-hidden="true"
        />
        <span class="min-w-0 truncate">{{ departmentLabel }}</span>
      </div>
    </div>

    <div class="dash-grid-card__footer">
      <div class="dash-grid-card__footer-row">
        <div class="dash-grid-card__ring">
          <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle class="dash-grid-card__ring-track" cx="18" cy="18" r="14" />
            <circle
              class="dash-grid-card__ring-fill"
              cx="18"
              cy="18"
              r="14"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
          <span class="dash-grid-card__ring-label">{{ percentLabel }}</span>
        </div>
        <div class="dash-grid-card__stat">
          <p class="dash-grid-card__stat-value">
            {{ itemCount }}
            <span class="dash-grid-card__stat-muted">
              {{ itemCount === 1 ? 'item' : 'items' }}
            </span>
          </p>
          <p
            v-if="availabilityHint"
            class="dash-grid-card__stat-hint"
          >
            {{ availabilityHint }}
          </p>
          <p
            v-else-if="lowStockCount > 0"
            class="dash-grid-card__stat-hint dash-grid-card__stat-hint--warning"
          >
            {{ lowStockCount }} low
          </p>
        </div>
        <div class="dash-grid-card__metrics shrink-0 text-right">
          <p class="dash-grid-card__value">
            {{ formattedValue }}
          </p>
          <p
            v-if="showProfit && formattedProfit"
            class="dash-grid-card__profit"
            :class="profitClass"
          >
            {{ formattedProfit }}
          </p>
        </div>
        <div v-if="hasOverlays" class="shrink-0 self-center" @click.stop>
          <slot name="checkbox" />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BuildingOffice2Icon,
  FolderIcon,
  TagIcon,
} from '~/utils/app-icons'
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
    trackProfit?: boolean
    grossProfitOnHand?: number | null
    showProfit?: boolean
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
    trackProfit: false,
    grossProfitOnHand: null,
    showProfit: false,
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

const formattedProfit = computed(() => {
  if (!props.showProfit || !props.trackProfit) return null
  const profit = props.grossProfitOnHand
  if (profit === null || profit === undefined) {
    return props.itemCount <= 0 ? '+0' : '…'
  }
  const abs = Math.abs(profit)
  if (abs >= 1_000_000) {
    const sign = profit < 0 ? '−' : '+'
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    const sign = profit < 0 ? '−' : '+'
    return `${sign}${(abs / 1_000).toFixed(1)}k`
  }
  const prefix = profit >= 0 ? '+' : '−'
  return `${prefix}${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(abs)}`
})

const profitClass = computed(() => {
  const profit = props.grossProfitOnHand
  if (profit === null || profit === undefined || profit === 0) return ''
  return profit > 0 ? 'dash-grid-card__profit--positive' : 'dash-grid-card__profit--negative'
})

const profitTitle = computed(() => {
  if (props.grossProfitOnHand === null || props.grossProfitOnHand === undefined) {
    return 'Gross profit on available stock'
  }
  return `Gross profit on available stock: ${props.grossProfitOnHand}`
})
</script>
