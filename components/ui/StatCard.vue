<template>
  <div class="bg-white dark:bg-gray-800 rounded-md sm:rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-[0.98] transition-all duration-200 group">
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{{ label }}</p>
        <p class="mt-1 text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{{ value }}</p>
        <p v-if="subtext" :class="['mt-0.5 text-[10px] sm:text-xs truncate', subtextClass || 'text-gray-600 dark:text-gray-400']">{{ subtext }}</p>
      </div>
      <div :class="['w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ml-2 transition-transform duration-200 group-hover:scale-110', iconBgClass]">
        <component :is="icon" :class="['w-4 h-4 sm:w-5 sm:h-5', iconClass]" />
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


