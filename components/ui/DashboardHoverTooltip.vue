<script setup lang="ts">
/**
 * Dark flyout matching collapsed sidebar nav / profile / sign-out hovers.
 * Default: parent has `group relative`.
 * Nested hovers: set `namedGroup="remove"` and use `group/remove relative` on the immediate parent.
 */
withDefaults(
  defineProps<{
    placement?: 'right' | 'bottom'
    namedGroup?: 'remove' | ''
  }>(),
  { placement: 'right', namedGroup: '' }
)
</script>

<template>
  <div
    class="pointer-events-none invisible absolute z-[60] w-max min-w-max max-w-[min(18rem,calc(100vw-4rem))] opacity-0 transition-all duration-200 motion-reduce:transition-none"
    :class="[
      namedGroup === 'remove'
        ? 'group-hover/remove:visible group-hover/remove:opacity-100'
        : 'group-hover:visible group-hover:opacity-100',
      placement === 'right'
        ? 'left-full top-1/2 ml-2 -translate-y-1/2'
        : 'left-1/2 top-full mt-2 -translate-x-1/2',
    ]"
    role="tooltip"
  >
    <div
      class="relative inline-flex max-w-[min(18rem,calc(100vw-4rem))] flex-col items-start gap-0 rounded-sm border border-gray-700/40 bg-gray-900 px-2.5 py-1.5 text-left text-xs font-medium leading-snug text-white shadow-md/50 dark:bg-gray-950"
    >
      <slot />
      <div
        v-if="placement === 'right'"
        class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"
        aria-hidden="true"
      />
      <div
        v-else
        class="absolute bottom-full left-1/2 mb-[-1px] -translate-x-1/2 border-[5px] border-transparent border-b-gray-900 dark:border-b-gray-950"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
