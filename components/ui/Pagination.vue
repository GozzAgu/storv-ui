<template>
  <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4">
    <!-- Results summary -->
    <p class="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
      <span class="font-medium text-gray-700 dark:text-gray-300">{{ startIndex + 1 }}</span>
      <span class="mx-1">–</span>
      <span class="font-medium text-gray-700 dark:text-gray-300">{{ endIndex }}</span>
      <span class="mx-1">of</span>
      <span class="font-medium text-gray-700 dark:text-gray-300">{{ total }}</span>
    </p>

    <!-- Page controls -->
    <div class="flex items-center gap-1.5 order-1 sm:order-2">
      <button
        type="button"
        @click="$emit('page-change', currentPage - 1)"
        :disabled="currentPage === 1"
        :aria-label="'Previous page'"
        :class="[
          'flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-200',
          currentPage === 1
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-100'
        ]"
      >
        <ChevronLeftIcon class="w-5 h-5" stroke-width="2" />
      </button>

      <div class="flex items-center gap-1">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== -1"
            type="button"
            @click="$emit('page-change', page)"
            :aria-label="`Page ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
            :class="[
              'min-w-[2.25rem] h-9 px-3 text-sm font-medium rounded-full transition-all duration-200',
              page === currentPage
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25 dark:shadow-primary-400/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-100'
            ]"
          >
            {{ page }}
          </button>
          <span v-else class="flex items-center justify-center w-9 h-9 text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">…</span>
        </template>
      </div>

      <button
        type="button"
        @click="$emit('page-change', currentPage + 1)"
        :disabled="currentPage === totalPages"
        :aria-label="'Next page'"
        :class="[
          'flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-200',
          currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-100'
        ]"
      >
        <ChevronRightIcon class="w-5 h-5" stroke-width="2" />
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
