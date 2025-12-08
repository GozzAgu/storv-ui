<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-[0.98] transition-all duration-200">
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{{ label }}</p>
        <p class="mt-1 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{{ value }}</p>
        <p v-if="subtext" :class="['mt-0.5 sm:mt-1 text-[10px] sm:text-sm truncate', subtextClass || 'text-gray-600 dark:text-gray-400']">{{ subtext }}</p>
      </div>
      <div :class="['w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-2', iconBgClass]">
        <component :is="icon" :class="['w-5 h-5 sm:w-6 sm:h-6', iconClass]" />
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


