<template>
  <article
    class="dash-grid-card dept-grid-card"
    :class="[
      inactive ? 'dash-grid-card--disabled' : '',
      deleting ? 'pointer-events-none' : '',
    ]"
    role="button"
    tabindex="0"
    @click="!inactive && !deleting && $emit('open')"
    @keydown.enter.prevent="!inactive && !deleting && $emit('open')"
    @keydown.space.prevent="!inactive && !deleting && $emit('open')"
  >
    <div v-if="deleting" class="dash-grid-card__overlay">
      <ArrowPathIcon class="h-5 w-5 animate-spin text-white" aria-hidden="true" />
    </div>

    <div class="dash-grid-card__head">
      <BuildingOffice2Icon class="dash-grid-card__icon" stroke-width="1.5" aria-hidden="true" />
      <span :class="statusPill.pillClass">
        <span class="dash-grid-card__pill-dot" aria-hidden="true" />
        <span class="truncate">{{ statusPill.label }}</span>
      </span>
      <div v-if="hasOverlays" class="-mr-0.5 shrink-0" @click.stop>
        <slot name="menu" />
      </div>
    </div>

    <h3 class="dash-grid-card__title" :title="displayName">
      {{ displayName }}
    </h3>
    <p class="dash-grid-card__desc" :title="descriptionText">
      {{ descriptionText }}
    </p>

    <div class="dash-grid-card__meta-block">
      <div class="dash-grid-card__meta-row">
        <TagIcon class="dash-grid-card__meta-icon" stroke-width="1.5" aria-hidden="true" />
        <span class="min-w-0 truncate">{{ typeLabel }} · {{ storeLabel }}</span>
      </div>
      <div class="dash-grid-card__meta-row">
        <UserIcon class="dash-grid-card__meta-icon" stroke-width="1.5" aria-hidden="true" />
        <span class="min-w-0 truncate" :title="managerLabel">{{ managerLabel }}</span>
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
          <span class="dash-grid-card__ring-label">{{ staffCount }}</span>
        </div>
        <div class="dash-grid-card__stat">
          <p class="dash-grid-card__stat-value">
            {{ staffCount }}
            <span class="dash-grid-card__stat-muted">
              {{ staffCount === 1 ? 'member' : 'members' }}
            </span>
          </p>
          <p
            v-if="inactive"
            class="dash-grid-card__stat-hint dash-grid-card__stat-hint--warning"
          >
            Inactive
          </p>
        </div>
        <p
          v-if="dateLabel"
          class="dash-grid-card__value"
          :title="dateLabel"
        >
          {{ dateLabel }}
        </p>
        <div v-if="hasOverlays" class="shrink-0 self-center" @click.stop>
          <slot name="checkbox" />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowPathIcon, BuildingOffice2Icon, TagIcon, UserIcon } from '@heroicons/vue/24/outline'
import { formatCategoryDate, formatCategoryDisplayName } from '~/utils/inventory-category-card'
import {
  departmentDescriptionText,
  departmentManagerLabel,
  departmentStaffRingPercent,
  departmentStatusPill,
  formatDepartmentTypeLabel,
} from '~/utils/department-card'

const props = withDefaults(
  defineProps<{
    name: string
    description?: string
    departmentType?: string
    staffCount?: number
    manager?: string
    storeName?: string
    inactive?: boolean
    deleting?: boolean
    hasOverlays?: boolean
    updatedAt?: unknown
    createdAt?: unknown
  }>(),
  {
    description: '',
    departmentType: '',
    staffCount: 0,
    manager: '',
    storeName: '',
    inactive: false,
    deleting: false,
    hasOverlays: false,
    updatedAt: undefined,
    createdAt: undefined,
  }
)

defineEmits<{
  open: []
}>()

const ringCircumference = 2 * Math.PI * 14

const displayName = computed(() => formatCategoryDisplayName(props.name))

const descriptionText = computed(() => departmentDescriptionText(props.description))

const typeLabel = computed(() => formatDepartmentTypeLabel(props.departmentType))

const storeLabel = computed(() => props.storeName?.trim() || 'This store')

const managerLabel = computed(() => departmentManagerLabel(props.manager))

const statusPill = computed(() => departmentStatusPill(props.inactive))

const dateLabel = computed(
  () => formatCategoryDate(props.updatedAt) ?? formatCategoryDate(props.createdAt)
)

const ringPercent = computed(() =>
  departmentStaffRingPercent(props.inactive, props.staffCount ?? 0)
)

const ringOffset = computed(() => ringCircumference * (1 - ringPercent.value / 100))
</script>
