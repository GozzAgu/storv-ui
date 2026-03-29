<template>
  <div
    data-testid="pagination"
    class="flex w-full min-w-0 max-w-full flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
  >
    <!-- Results summary — may shrink/truncate so page controls stay in view -->
    <p
      data-testid="pagination-summary"
      class="min-w-0 max-w-full truncate text-[10px] tabular-nums leading-none tracking-tight text-gray-500 dark:text-gray-400 sm:min-w-0 sm:flex-1 sm:text-[11px]"
    >
      <span class="font-medium text-gray-600 dark:text-gray-300">Results:</span>
      <span class="mx-1 font-semibold text-gray-900 dark:text-gray-100">{{ displayStart }}</span>
      <span class="text-gray-400 dark:text-gray-500">–</span>
      <span class="mx-1 font-semibold text-gray-900 dark:text-gray-100">{{ displayEnd }}</span>
      <span class="text-gray-400 dark:text-gray-500">of</span>
      <span class="ml-1 font-semibold text-gray-900 dark:text-gray-100">{{ total }}</span>
    </p>

    <div
      class="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end sm:gap-3"
    >
      <!-- Rows per page -->
      <div v-if="showPerPageSelect && mergedPerPageOptions.length > 0" class="flex shrink-0 items-center gap-2">
        <label :for="selectId" class="sr-only">Rows per page</label>
        <select
          :id="selectId"
          :value="itemsPerPage"
          class="cursor-pointer rounded-sm border border-gray-200/90 bg-white py-0.5 pl-1.5 pr-7 text-[10px] font-medium text-gray-800 shadow-sm focus:border-primary-400/50 focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:border-gray-700/80 dark:bg-[#12141c] dark:text-gray-200 dark:focus:border-primary-500/40 sm:text-[11px]"
          @change="onPerPageChange"
        >
          <option v-for="opt in mergedPerPageOptions" :key="opt" :value="opt">
            {{ opt }} / page
          </option>
        </select>
      </div>

      <!-- Page nav: flat chevrons + numbers (minimal, no heavy chrome) -->
      <div
        data-testid="pagination-controls"
        class="flex min-w-0 max-w-full items-center gap-px overflow-x-auto overscroll-x-contain [scrollbar-width:none] touch-pan-x sm:gap-0.5 [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          class="flex size-7 shrink-0 items-center justify-center rounded-sm text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06] dark:hover:text-gray-100 dark:disabled:hover:bg-transparent"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          @click="$emit('page-change', currentPage - 1)"
        >
          <ChevronLeftIcon class="h-3.5 w-3.5" stroke-width="2" />
        </button>

        <div class="flex min-h-7 items-center justify-center gap-px px-0.5 sm:gap-0.5 sm:px-0.5">
          <template v-for="(page, pageIdx) in visiblePages" :key="`${pageIdx}-${page}`">
            <button
              v-if="page !== -1"
              type="button"
              class="min-w-[1.75rem] shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] tabular-nums transition-colors sm:min-w-8 sm:px-2"
              :class="
                page === currentPage
                  ? 'font-semibold text-gray-900 dark:text-gray-50'
                  : 'font-medium text-gray-500 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100'
              "
              :aria-current="page === currentPage ? 'page' : undefined"
              :aria-label="`Page ${page}`"
              @click="$emit('page-change', page)"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center px-0.5 text-[11px] font-medium tabular-nums text-gray-400 select-none dark:text-gray-500"
              aria-hidden="true"
            >
              …
            </span>
          </template>
        </div>

        <button
          type="button"
          class="flex size-7 shrink-0 items-center justify-center rounded-sm text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06] dark:hover:text-gray-100 dark:disabled:hover:bg-transparent"
          :disabled="currentPage === totalPages || totalPages === 0"
          aria-label="Next page"
          @click="$emit('page-change', currentPage + 1)"
        >
          <ChevronRightIcon class="h-3.5 w-3.5" stroke-width="2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import {
  getPaginationIndices,
  getTotalPages,
  getVisiblePageNumbers,
} from '~/utils/pagination'

const props = withDefaults(
  defineProps<{
    currentPage: number
    itemsPerPage: number
    total: number
    /** Show “N / page” dropdown (Grovio / BluNest style) */
    showPerPageSelect?: boolean
    /** Allowed page sizes; current `itemsPerPage` is merged in if missing */
    perPageOptions?: number[]
  }>(),
  {
    showPerPageSelect: true,
    perPageOptions: () => [10, 25, 50, 100],
  },
)

const emit = defineEmits<{
  'page-change': [page: number]
  'items-per-page-change': [itemsPerPage: number]
}>()

const selectId = useId()

const totalPages = computed(() => getTotalPages(props.total, props.itemsPerPage))

const indices = computed(() =>
  getPaginationIndices(props.currentPage, props.itemsPerPage, props.total),
)

const displayStart = computed(() => {
  if (props.total === 0) return 0
  return indices.value.startIndex + 1
})

const displayEnd = computed(() => indices.value.endIndex)

const visiblePages = computed(() => getVisiblePageNumbers(props.currentPage, totalPages.value))

const mergedPerPageOptions = computed(() => {
  const base = [...(props.perPageOptions?.length ? props.perPageOptions : [10, 25, 50, 100])]
  if (!base.includes(props.itemsPerPage)) {
    base.push(props.itemsPerPage)
  }
  return [...new Set(base)].sort((a, b) => a - b)
})

function onPerPageChange(e: Event) {
  const el = e.target as HTMLSelectElement
  const v = Number(el.value)
  if (!Number.isFinite(v) || v <= 0) return
  emit('items-per-page-change', v)
}
</script>
