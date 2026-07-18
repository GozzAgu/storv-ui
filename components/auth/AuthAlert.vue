<template>
  <div role="alert" class="auth-alert">
    <p class="auth-alert__title">{{ title }}</p>
    <div class="auth-alert__body whitespace-pre-line text-left">
      <slot>{{ message }}</slot>
    </div>
    <NuxtLink
      v-if="showFirestoreGuide"
      to="/QUICK_FIX.md"
      target="_blank"
      class="auth-link mt-2 inline-block text-[11px] underline underline-offset-2"
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
