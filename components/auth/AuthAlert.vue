<template>
  <div role="alert" class="s-auth-alert">
    <CircleAlert class="s-auth-alert__icon" :size="18" :stroke-width="1.75" aria-hidden="true" />
    <div class="s-auth-alert__text">
      <p class="s-auth-alert__title">{{ title }}</p>
      <div class="s-auth-alert__body">
        <slot>{{ message }}</slot>
      </div>
      <NuxtLink v-if="showFirestoreGuide" to="/QUICK_FIX.md" target="_blank" class="auth-link">
        View setup guide
      </NuxtLink>
      <div v-if="$slots.actions" class="s-auth-alert__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'

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
