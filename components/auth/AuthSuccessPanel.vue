<template>
  <div
    class="auth-success-panel flex flex-col items-center rounded-lg bg-primary-50/90 px-4 py-6 text-center dark:bg-primary-950/40 sm:px-5"
    role="status"
  >
    <div
      class="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/15 ring-1 ring-primary-500/25 dark:bg-primary-500/12 dark:ring-primary-500/35"
    >
      <component :is="icon" class="h-6 w-6 text-primary-600 dark:text-primary-400" stroke-width="1.5" />
    </div>
    <p class="text-sm font-semibold text-gray-900 dark:text-gray-50">
      <slot name="title" />
    </p>
    <p class="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
      <slot />
    </p>
    <p v-if="$slots.footer" class="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
      <slot name="footer" />
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
}>()
</script>
