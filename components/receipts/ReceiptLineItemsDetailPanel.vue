<script setup lang="ts">
withDefaults(
  defineProps<{
    itemCount: number
    compact?: boolean
    title?: string
    /** Singular count unit in header, e.g. "item" or "receipt" */
    countNoun?: string
  }>(),
  {
    compact: false,
    title: 'Line items',
    countNoun: 'item',
  }
)
</script>

<template>
  <div
    class="receipt-line-items-panel overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-900/50 dark:shadow-none"
    :class="compact ? 'mt-2' : ''"
  >
    <div
      class="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/90 px-3 py-1.5 dark:border-gray-800/80 dark:bg-white/[0.03]"
    >
      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
        {{ title }}
      </p>
      <p class="text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
        {{ itemCount }} {{ itemCount === 1 ? countNoun : `${countNoun}s` }}
      </p>
    </div>
    <div class="px-1 py-1 sm:px-2 sm:py-1.5">
      <slot />
    </div>
  </div>
</template>
