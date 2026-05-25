<template>
  <div
    role="alert"
    class="rounded-lg bg-red-50 px-3.5 py-3 ring-1 ring-red-200/80 dark:bg-red-950/35 dark:ring-red-800/45"
  >
    <p class="mb-0.5 text-xs font-semibold text-red-800 dark:text-red-200">{{ title }}</p>
    <div class="whitespace-pre-line text-left text-xs leading-relaxed text-red-700 dark:text-red-300">
      <slot>{{ message }}</slot>
    </div>
    <NuxtLink
      v-if="showFirestoreGuide"
      to="/QUICK_FIX.md"
      target="_blank"
      class="mt-2 inline-block text-[11px] font-medium text-red-600 underline underline-offset-2 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
    >
      View Quick Fix Guide →
    </NuxtLink>
    <div v-if="$slots.actions" class="mt-2.5 space-y-1.5">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    title?: string
    showFirestoreGuide?: boolean
  }>(),
  {
    title: 'Error',
    showFirestoreGuide: false,
  }
)
</script>
