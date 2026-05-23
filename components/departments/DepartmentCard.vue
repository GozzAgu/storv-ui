<template>
  <article
    class="dept-grid-card group relative flex w-full flex-col rounded-xl bg-white p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-gray-200/70 transition-[ring-color] duration-200 dark:bg-[#141820] dark:shadow-none dark:ring-white/[0.07]"
    :class="[
      inactive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:ring-gray-300/90 dark:hover:ring-white/12',
      deleting && 'pointer-events-none',
    ]"
    role="button"
    tabindex="0"
    @click="!inactive && !deleting && $emit('open')"
    @keydown.enter.prevent="!inactive && !deleting && $emit('open')"
    @keydown.space.prevent="!inactive && !deleting && $emit('open')"
  >
    <div
      v-if="deleting"
      class="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-gray-900/55 backdrop-blur-[2px] dark:bg-gray-950/65"
    >
      <ArrowPathIcon class="h-5 w-5 animate-spin text-white" aria-hidden="true" />
    </div>

    <div class="mb-2 flex items-center gap-1.5">
      <BuildingOffice2Icon
        class="h-4 w-4 shrink-0 text-gray-800 dark:text-gray-200"
        stroke-width="1.5"
        aria-hidden="true"
      />
      <span
        class="ml-auto inline-flex min-w-0 max-w-[50%] items-center gap-1 rounded-full px-1.5 py-px text-[9px] font-semibold leading-tight ring-1 ring-inset"
        :class="statusPill.pillClass"
      >
        <span class="h-1 w-1 shrink-0 rounded-full" :class="statusPill.dotClass" aria-hidden="true" />
        <span class="truncate">{{ statusPill.label }}</span>
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
        <span class="min-w-0 truncate">{{ typeLabel }} · {{ storeLabel }}</span>
      </div>
      <div class="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
        <UserIcon class="h-3 w-3 shrink-0 text-gray-400" stroke-width="1.5" aria-hidden="true" />
        <span class="min-w-0 truncate" :title="managerLabel">{{ managerLabel }}</span>
      </div>
    </div>

    <div class="mt-2 border-t border-gray-100/90 pt-2 dark:border-white/[0.06]">
      <div class="flex items-center gap-1.5">
        <div
          class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-50 ring-1 ring-gray-200/80 dark:bg-white/[0.04] dark:ring-white/10"
          aria-hidden="true"
        >
          <svg class="h-7 w-7 -rotate-90" viewBox="0 0 36 36">
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
          <span class="absolute text-[8px] font-semibold tabular-nums text-gray-700 dark:text-gray-200">
            {{ staffCount }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-semibold tabular-nums leading-tight text-gray-900 dark:text-gray-100">
            {{ staffCount }}
            <span class="font-medium text-gray-500 dark:text-gray-400">
              {{ staffCount === 1 ? 'member' : 'members' }}
            </span>
          </p>
          <p
            v-if="inactive"
            class="truncate text-[9px] font-medium text-amber-600 dark:text-amber-400"
          >
            Inactive
          </p>
        </div>
        <p
          v-if="dateLabel"
          class="shrink-0 text-[10px] font-medium tabular-nums text-gray-500 dark:text-gray-400"
          :title="dateLabel"
        >
          {{ dateLabel }}
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
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  TagIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
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
