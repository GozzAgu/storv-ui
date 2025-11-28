<template>
  <div :class="['bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700', paddingClass, extraClass]">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  extraClass?: string
}>(), {
  padding: 'md'
})

const paddingClass = computed(() => {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  return paddingMap[props.padding] + (props.extraClass ? ` ${props.extraClass}` : '')
})
</script>

