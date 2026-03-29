<template>
  <div 
    :class="['rounded-sm bg-gray-50 transition-colors duration-200 ease-out dark:!bg-dashboard-card/55', paddingClass, extraClass]"
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
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6'
  }
  const basePadding = paddingMap[props.padding] || paddingMap.md
  return props.extraClass ? `${basePadding} ${props.extraClass}` : basePadding
})
</script>

