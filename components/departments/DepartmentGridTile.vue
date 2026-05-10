<template>
  <div
    class="dept-grid-tile group relative flex h-full min-h-[78px] w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200/60 bg-white/95 shadow-none backdrop-blur-sm transition-[transform,background-color] duration-300 ease-out hover:border-primary-200/50 hover:bg-white active:scale-[0.98] dark:border-gray-700/45 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] dark:hover:border-primary-800/40 sm:min-h-[82px]"
    :class="{ 'opacity-60': inactive }"
    @click="$emit('click')"
  >
    <slot name="checkbox" />
    <slot name="menu" />

    <div
      class="flex min-h-0 flex-1 flex-col justify-between gap-0.5 px-2 pb-1 text-left"
      :class="hasOverlays ? 'pt-4 sm:pt-5' : 'pt-2'"
    >
      <div class="flex min-h-0 flex-1 items-center gap-1.5">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary-500/10 ring-1 ring-primary-500/15 dark:bg-primary-500/12 dark:ring-primary-500/25"
        >
          <BuildingOfficeIcon
            class="h-4 w-4 text-primary-600 dark:text-primary-400"
            :stroke-width="1.75"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50"
            :title="name"
          >
            {{ name }}
          </p>
          <p
            class="mt-0.5 text-[10px] font-semibold tabular-nums tracking-tight text-gray-500 dark:text-gray-400"
          >
            {{ staffCount }} {{ staffCount === 1 ? 'member' : 'members' }}
          </p>
          <p
            v-if="inactive"
            class="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400"
          >
            Inactive
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BuildingOfficeIcon } from '@heroicons/vue/24/outline'

withDefaults(
  defineProps<{
    name: string
    staffCount: number
    /** When true, less top padding (no checkbox / menu) */
    hasOverlays?: boolean
    inactive?: boolean
  }>(),
  { hasOverlays: true, inactive: false }
)

defineEmits<{
  click: []
}>()
</script>
