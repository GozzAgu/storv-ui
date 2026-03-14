<template>
  <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-2">
    <!-- Results summary -->
    <p class="text-xs text-gray-500 dark:text-gray-500 order-2 sm:order-1 tabular-nums">
      <span class="font-medium text-gray-600 dark:text-gray-400">{{ startIndex + 1 }}</span>
      <span class="mx-0.5">–</span>
      <span class="font-medium text-gray-600 dark:text-gray-400">{{ endIndex }}</span>
      <span class="mx-0.5">of</span>
      <span class="font-medium text-gray-600 dark:text-gray-400">{{ total }}</span>
    </p>

    <!-- Page controls -->
    <div class="flex items-center gap-0.5 order-1 sm:order-2">
      <button
        type="button"
        @click="$emit('page-change', currentPage - 1)"
        :disabled="currentPage === 1"
        aria-label="Previous page"
        :class="[
          'flex items-center justify-center w-7 h-7 rounded-none text-xs font-medium transition-colors duration-150',
          currentPage === 1
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/20'
        ]"
      >
        <ChevronLeftIcon class="w-4 h-4" stroke-width="2" />
      </button>

      <div class="flex items-center gap-0.5">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== -1"
            type="button"
            @click="$emit('page-change', page)"
            :aria-label="`Page ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
            :class="[
              'min-w-[1.75rem] h-7 px-2 text-xs font-medium transition-colors duration-150',
              page === currentPage
                ? 'rounded-md bg-primary-600 dark:bg-primary-500 text-white dark:text-white'
                : 'rounded-none text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400'
            ]"
          >
            {{ page }}
          </button>
          <span v-else class="flex items-center justify-center w-7 h-7 rounded-none text-xs text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">…</span>
        </template>
      </div>

      <button
        type="button"
        @click="$emit('page-change', currentPage + 1)"
        :disabled="currentPage === totalPages"
        aria-label="Next page"
        :class="[
          'flex items-center justify-center w-7 h-7 rounded-none text-xs font-medium transition-colors duration-150',
          currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/20'
        ]"
      >
        <ChevronRightIcon class="w-4 h-4" stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface Props {
  currentPage: number
  itemsPerPage: number
  total: number
}

const props = defineProps<Props>()

defineEmits<{
  'page-change': [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.itemsPerPage))

const startIndex = computed(() => (props.currentPage - 1) * props.itemsPerPage)

const endIndex = computed(() => {
  const end = startIndex.value + props.itemsPerPage
  return end > props.total ? props.total : end
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = props.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    if (current <= 3) {
      for (let i = 2; i <= 4; i++) pages.push(i)
      pages.push(-1)
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(-1)
      for (let i = total - 3; i <= total; i++) pages.push(i)
    } else {
      pages.push(-1)
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(-1)
      pages.push(total)
    }
  }
  return pages
})
</script>
