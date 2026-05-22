<template>
  <div
    role="button"
    tabindex="0"
    class="group relative flex h-full min-h-[78px] w-full flex-col overflow-hidden rounded-sm bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] dark:bg-dashboard-card! dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] sm:min-h-[82px]"
    :class="[
      inactive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      deleting && 'pointer-events-none',
    ]"
    @click="!inactive && !deleting && $emit('open')"
    @keydown.enter.prevent="!inactive && !deleting && $emit('open')"
    @keydown.space.prevent="!inactive && !deleting && $emit('open')"
  >
    <div
      v-if="deleting"
      class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-900/55 backdrop-blur-[2px] dark:bg-gray-950/65"
    >
      <ArrowPathIcon class="h-5 w-5 animate-spin text-white" aria-hidden="true" />
    </div>

    <slot name="checkbox" />
    <slot name="menu" />

    <div
      class="flex min-h-0 flex-1 flex-col justify-between gap-0.5 px-2 pb-1 text-left"
      :class="hasOverlays ? 'pt-4 sm:pt-5' : 'pt-2'"
    >
      <div class="flex min-h-0 flex-1 items-center gap-1.5">
        <span
          class="flex h-8 w-7 shrink-0 items-center justify-center rounded-sm bg-primary-50 dark:bg-primary-500/10"
        >
          <BuildingOfficeIcon
            class="h-4 w-4 text-primary-600 dark:text-primary-400"
            stroke-width="1.5"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50"
            :title="name"
          >
            {{ name }}
          </p>
          <p class="mt-0.5 text-[10px] font-semibold tabular-nums tracking-tight text-gray-500 dark:text-gray-400">
            {{ staffCount }} {{ staffCount === 1 ? 'member' : 'members' }}
          </p>
          <p
            v-if="inactive"
            class="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400/90"
          >
            Inactive
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BuildingOfficeIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

withDefaults(
  defineProps<{
    name: string
    staffCount?: number
    departmentType?: string
    inactive?: boolean
    deleting?: boolean
    hasOverlays?: boolean
  }>(),
  {
    staffCount: 0,
    departmentType: '',
    inactive: false,
    deleting: false,
    hasOverlays: false,
  }
)

defineEmits<{
  open: []
}>()
</script>
