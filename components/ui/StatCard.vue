<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ label }}</p>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
        <p v-if="subtext" :class="['mt-1 text-sm', subtextClass || 'text-gray-600 dark:text-gray-400']">{{ subtext }}</p>
      </div>
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconBgClass]">
        <component :is="icon" :class="['w-6 h-6', iconClass]" />
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


