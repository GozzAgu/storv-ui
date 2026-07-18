<template>
  <nav
    aria-label="Breadcrumb"
    class="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3"
  >
    <template v-for="(crumb, index) in items" :key="index">
      <ChevronRightIcon
        v-if="index > 0"
        class="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <NuxtLink
        v-if="crumb.href"
        :to="crumb.href"
        class="inline-flex items-center gap-1.5 transition-colors truncate max-w-[180px] sm:max-w-[240px] hover:text-primary-500 dark:hover:text-primary-400"
      >
        <component
          v-if="crumb.icon"
          :is="crumb.icon"
          class="w-3.5 h-3.5 flex-shrink-0 text-current"
        />
        <span class="truncate">{{ crumb.label }}</span>
      </NuxtLink>
      <span
        v-else
        class="inline-flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-[240px] font-medium text-gray-900 dark:text-gray-100"
      >
        <component
          v-if="crumb.icon"
          :is="crumb.icon"
          class="w-3.5 h-3.5 flex-shrink-0 text-current"
        />
        <span class="truncate">{{ crumb.label }}</span>
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: any
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>
