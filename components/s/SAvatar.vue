<template>
  <span class="s-c s-avatar" :class="size !== 'md' && `s-avatar--${size}`" :aria-label="name" :role="name ? 'img' : undefined">
    <img v-if="src && !failed" :src="src" alt="" @error="failed = true" />
    <slot v-else>{{ initials }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    name?: string
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' }
)

const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  }
)

const initials = computed(() => {
  const parts = (props.name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
})
</script>
