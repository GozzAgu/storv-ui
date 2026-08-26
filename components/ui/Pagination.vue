<template>
  <div data-testid="pagination" class="dash-pagination">
    <p
      data-testid="pagination-summary"
      class="dash-pagination__summary"
      :title="summaryTitle"
    >
      <span class="dash-pagination__summary-label">Showing</span>
      <span class="dash-pagination__summary-range dash-num">
        {{ displayStart }}<span class="dash-pagination__summary-sep">-</span>{{ displayEnd }}
      </span>
      <span class="dash-pagination__summary-of">of</span>
      <span class="dash-pagination__summary-total dash-num">{{ total }}</span>
    </p>

    <div class="dash-pagination__controls">
      <div data-testid="pagination-controls" class="dash-pagination__pager">
        <button
          type="button"
          class="dash-pagination__nav"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          @click="$emit('page-change', currentPage - 1)"
        >
          <ChevronLeftIcon class="dash-pagination__nav-icon" stroke-width="2" aria-hidden="true" />
        </button>

        <span class="dash-pagination__compact-status dash-num" aria-live="polite">
          {{ currentPage }} / {{ totalPages }}
        </span>

        <div class="dash-pagination__pages" role="group" aria-label="Page numbers">
          <template v-for="(page, pageIdx) in visiblePages" :key="`${pageIdx}-${page}`">
            <button
              v-if="page !== -1"
              type="button"
              class="dash-pagination__page dash-num"
              :class="{ 'dash-pagination__page--active': page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              :aria-label="`Page ${page}`"
              @click="$emit('page-change', page)"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="dash-pagination__ellipsis dash-num"
              aria-hidden="true"
            >
              …
            </span>
          </template>
        </div>

        <button
          type="button"
          class="dash-pagination__nav"
          :disabled="currentPage === totalPages || totalPages === 0"
          aria-label="Next page"
          @click="$emit('page-change', currentPage + 1)"
        >
          <ChevronRightIcon class="dash-pagination__nav-icon" stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '~/utils/app-icons'
import { getPaginationIndices, getTotalPages, getVisiblePageNumbers } from '~/utils/pagination'

const props = withDefaults(
  defineProps<{
    currentPage: number
    /** Page size used for range math (default 100; no UI to change) */
    itemsPerPage?: number
    total: number
  }>(),
  {
    itemsPerPage: 100,
  }
)

defineEmits<{
  'page-change': [page: number]
}>()

const totalPages = computed(() => getTotalPages(props.total, props.itemsPerPage))

const indices = computed(() =>
  getPaginationIndices(props.currentPage, props.itemsPerPage, props.total)
)

const displayStart = computed(() => {
  if (props.total === 0) return 0
  return indices.value.startIndex + 1
})

const displayEnd = computed(() => indices.value.endIndex)

const visiblePages = computed(() => getVisiblePageNumbers(props.currentPage, totalPages.value))

const summaryTitle = computed(() => {
  if (props.total === 0) return 'No results'
  return `Showing ${displayStart.value} to ${displayEnd.value} of ${props.total}`
})
</script>
