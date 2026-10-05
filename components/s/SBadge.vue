<template>
  <span
    class="s-c s-badge"
    :class="[tone !== 'neutral' && `s-badge--${tone}`, size === 'md' && 's-badge--md']"
  >
    <span v-if="dot" class="s-badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info'
    size?: 'sm' | 'md'
    dot?: boolean
  }>(),
  { tone: 'neutral', size: 'sm' }
)
</script>
