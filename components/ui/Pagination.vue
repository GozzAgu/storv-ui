<template>
  <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <span>Showing</span>
      <span class="font-medium">{{ startIndex + 1 }}</span>
      <span>to</span>
      <span class="font-medium">{{ endIndex }}</span>
      <span>of</span>
      <span class="font-medium">{{ total }}</span>
      <span>results</span>
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="$emit('page-change', currentPage - 1)"
        :disabled="currentPage === 1"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          currentPage === 1
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <ChevronLeftIcon class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-1">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== -1"
            @click="$emit('page-change', page)"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
          >
            {{ page }}
          </button>
          <span v-else class="px-2 text-gray-400 dark:text-gray-600">...</span>
        </template>
      </div>

      <button
        @click="$emit('page-change', currentPage + 1)"
        :disabled="currentPage === totalPages"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <ChevronRightIcon class="w-5 h-5" />
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
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current <= 3) {
      // Near the start
      for (let i = 2; i <= 4; i++) {
        pages.push(i)
      }
      pages.push(-1) // Ellipsis
      pages.push(total)
    } else if (current >= total - 2) {
      // Near the end
      pages.push(-1) // Ellipsis
      for (let i = total - 3; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // In the middle
      pages.push(-1) // Ellipsis
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1) // Ellipsis
      pages.push(total)
    }
  }

  return pages
})
</script>

