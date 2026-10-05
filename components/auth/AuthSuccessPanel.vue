<template>
  <div class="s-auth-status s-auth-status--success" role="status">
    <span class="s-auth-status__icon">
      <component :is="icon" :size="24" :stroke-width="1.75" aria-hidden="true" />
    </span>
    <p class="s-auth-status__title">
      <slot name="title" />
    </p>
    <p class="s-auth-status__body">
      <slot />
    </p>
    <p v-if="$slots.footer" class="s-auth-status__hint">
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
