<template>
  <div
    data-testid="pagination"
    class="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-3 py-2"
  >
    <!-- Results summary -->
    <p
      data-testid="pagination-summary"
      class="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 order-2 sm:order-1 tabular-nums tracking-tight"
    >
      <span class="font-medium text-gray-600 dark:text-gray-300">{{ startIndex + 1 }}</span>
      <span class="mx-1 text-gray-300 dark:text-gray-600" aria-hidden="true">–</span>
      <span class="font-medium text-gray-600 dark:text-gray-300">{{ endIndex }}</span>
      <span class="mx-1.5 text-gray-400 dark:text-gray-500">of</span>
      <span class="font-medium text-gray-600 dark:text-gray-300">{{ total }}</span>
    </p>

    <!-- Page controls: compact pill group -->
    <div
      data-testid="pagination-controls"
      class="inline-flex items-center gap-0.5 rounded-xl border border-gray-200/80 bg-white/80 px-1 py-1 shadow-sm shadow-gray-200/40 backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-900/60 dark:shadow-none order-1 sm:order-2"
    >
      <button
        type="button"
        @click="$emit('page-change', currentPage - 1)"
        :disabled="currentPage === 1"
        aria-label="Previous page"
        :class="[
          'flex items-center justify-center size-8 shrink-0 rounded-lg text-xs font-medium transition-all duration-200',
          currentPage === 1
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/90 hover:text-gray-900 dark:hover:bg-gray-800/90 dark:hover:text-gray-100 active:scale-[0.97]'
        ]"
      >
        <ChevronLeftIcon class="w-4 h-4" stroke-width="2" />
      </button>

      <div class="flex items-center gap-0.5 px-0.5">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== -1"
            type="button"
            @click="$emit('page-change', page)"
            :aria-label="`Page ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
            :class="[
              'min-w-[2rem] h-8 px-2 rounded-lg text-xs font-semibold transition-all duration-200',
              page === currentPage
                ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30 ring-1 ring-primary-600/10 dark:bg-primary-500 dark:text-white dark:shadow-primary-500/25 dark:ring-primary-400/20'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/90 hover:text-gray-900 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 active:scale-[0.97]'
            ]"
          >
            {{ page }}
          </button>
          <span
            v-else
            class="flex size-8 items-center justify-center rounded-lg text-xs font-medium text-gray-300 dark:text-gray-600 select-none"
            aria-hidden="true"
          >…</span>
        </template>
      </div>

      <button
        type="button"
        @click="$emit('page-change', currentPage + 1)"
        :disabled="currentPage === totalPages"
        aria-label="Next page"
        :class="[
          'flex items-center justify-center size-8 shrink-0 rounded-lg text-xs font-medium transition-all duration-200',
          currentPage === totalPages
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/90 hover:text-gray-900 dark:hover:bg-gray-800/90 dark:hover:text-gray-100 active:scale-[0.97]'
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
import {
  getPaginationIndices,
  getTotalPages,
  getVisiblePageNumbers,
} from '~/utils/pagination'

interface Props {
  currentPage: number
  itemsPerPage: number
  total: number
}

const props = defineProps<Props>()

defineEmits<{
  'page-change': [page: number]
}>()

const totalPages = computed(() => getTotalPages(props.total, props.itemsPerPage))

const startIndex = computed(() => getPaginationIndices(props.currentPage, props.itemsPerPage, props.total).startIndex)

const endIndex = computed(() => getPaginationIndices(props.currentPage, props.itemsPerPage, props.total).endIndex)

const visiblePages = computed(() => getVisiblePageNumbers(props.currentPage, totalPages.value))
</script>
