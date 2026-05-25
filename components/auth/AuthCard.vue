<template>
  <div
    :class="[
      authEntranceClass(entranceDelay),
      'auth-card overflow-hidden rounded-xl border-0 bg-white shadow-[0_1px_2px_rgba(15,53,122,0.04),0_12px_40px_rgba(15,53,122,0.06)] ring-1 ring-gray-200/80 dark:bg-dashboard-card dark:shadow-none dark:ring-white/[0.06]',
    ]"
  >
    <div class="relative px-5 py-6 sm:px-6 sm:py-7">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent dark:via-primary-500/30"
        aria-hidden="true"
      />
      <slot />
      <div
        v-if="$slots.footer"
        class="mt-6 border-t border-gray-200/90 pt-5 text-center text-xs text-gray-500 dark:border-white/[0.06] dark:text-gray-400"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authEntranceClass } from '~/utils/auth-entrance'

withDefaults(
  defineProps<{
    entranceDelay?: number
  }>(),
  {
    entranceDelay: 120,
  }
)
</script>
