<template>
  <div class="auth-success-panel" role="status">
    <div class="auth-success-panel__icon">
      <component :is="icon" stroke-width="1.5" />
    </div>
    <p class="auth-success-panel__title">
      <slot name="title" />
    </p>
    <p class="auth-success-panel__body">
      <slot />
    </p>
    <p v-if="$slots.footer" class="auth-success-panel__foot">
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
