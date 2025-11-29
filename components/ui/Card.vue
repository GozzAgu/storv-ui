<template>
  <div 
    :class="['bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700', paddingClass, extraClass]"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  extraClass?: string
}>(), {
  padding: 'md'
})

const paddingClass = computed(() => {
  const paddingMap: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  const basePadding = paddingMap[props.padding] || paddingMap.md
  return props.extraClass ? `${basePadding} ${props.extraClass}` : basePadding
})
</script>

