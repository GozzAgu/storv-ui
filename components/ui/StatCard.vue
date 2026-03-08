<template>
  <div class="bg-gray-50 dark:bg-gray-800/80 rounded-md p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 active:scale-[0.98] transition-all duration-200 group">
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate">{{ label }}</p>
        <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{{ value }}</p>
        <p v-if="subtext" :class="['mt-0.5 text-[10px] truncate', subtextClass || 'text-gray-600 dark:text-gray-400']">{{ subtext }}</p>
      </div>
      <div :class="['w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ml-2 transition-transform duration-200 group-hover:scale-110', iconBgClass]">
        <component :is="icon" :class="['w-4 h-4', iconClass]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  subtext?: string
  subtextClass?: string
  icon: any
  iconBgClass: string
  iconClass: string
}>()
</script>


