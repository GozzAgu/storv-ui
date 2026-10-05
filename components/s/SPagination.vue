<template>
  <nav v-if="total > 0 && (totalPages > 1 || !hideWhenSinglePage)" class="s-c s-pagination" :aria-label="label">
    <p class="s-pagination__summary">
      {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
    </p>
    <div class="s-pagination__controls">
      <SIconButton
        label="Previous page"
        variant="secondary"
        size="sm"
        :disabled="currentPage <= 1"
        @click="go(currentPage - 1)"
      >
        <ChevronLeft :size="16" :stroke-width="2" aria-hidden="true" />
      </SIconButton>
      <span class="s-pagination__page" aria-live="polite">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <SIconButton
        label="Next page"
        variant="secondary"
        size="sm"
        :disabled="currentPage >= totalPages"
        @click="go(currentPage + 1)"
      >
        <ChevronRight :size="16" :stroke-width="2" aria-hidden="true" />
      </SIconButton>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import SIconButton from '~/components/s/SIconButton.vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    total: number
    pageSize?: number
    hideWhenSinglePage?: boolean
    label?: string
  }>(),
  { pageSize: 100, hideWhenSinglePage: true, label: 'Pagination' }
)

const emit = defineEmits<{ 'page-change': [page: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const rangeStart = computed(() => Math.min(props.total, (props.currentPage - 1) * props.pageSize + 1))
const rangeEnd = computed(() => Math.min(props.total, props.currentPage * props.pageSize))

function go(page: number) {
  const next = Math.min(totalPages.value, Math.max(1, page))
  if (next !== props.currentPage) emit('page-change', next)
}
</script>
