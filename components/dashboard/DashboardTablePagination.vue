<template>
  <DashboardFixedFooter
    v-if="shouldShow && effectivePinToViewport"
    :sidebar-collapsed="sidebarCollapsed"
  >
    <Pagination
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total="total"
      @page-change="$emit('page-change', $event)"
    />
  </DashboardFixedFooter>
  <div v-else-if="shouldShow" v-bind="attrs" :class="paginationBarClass">
    <Pagination
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total="total"
      @page-change="$emit('page-change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import Pagination from '~/components/ui/Pagination.vue'
import DashboardFixedFooter from '~/components/ui/DashboardFixedFooter.vue'
import { getTotalPages } from '~/utils/pagination'

const props = withDefaults(
  defineProps<{
    currentPage: number
    itemsPerPage?: number
    total: number
    /** Pin to viewport bottom on dashboard pages (off for fullscreen overlays). */
    pinToViewport?: boolean
    /** Hide when everything fits on one page (default on iOS). */
    hideWhenSinglePage?: boolean
  }>(),
  {
    itemsPerPage: 100,
    pinToViewport: true,
    hideWhenSinglePage: undefined,
  }
)

defineEmits<{
  'page-change': [page: number]
}>()

const attrs = useAttrs()
const { paginationBarClass } = useDashboardPageChrome()
const { sidebarCollapsed } = useDashboardSidebarCollapsed()
const { isCapacitorIos } = useIsCapacitorIos()

const totalPages = computed(() => getTotalPages(props.total, props.itemsPerPage))

const hideWhenSinglePage = computed(() =>
  props.hideWhenSinglePage ?? isCapacitorIos.value
)

const shouldShow = computed(() => {
  if (props.total <= 0) return false
  if (hideWhenSinglePage.value && totalPages.value <= 1) return false
  return true
})

/** iOS uses the floating pill above the tab bar; inline pagination floats awkwardly mid-page. */
const effectivePinToViewport = computed(() => {
  if (isCapacitorIos.value && props.pinToViewport) return true
  return props.pinToViewport
})
</script>
