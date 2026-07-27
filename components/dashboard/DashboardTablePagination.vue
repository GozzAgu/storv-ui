<template>
  <DashboardFixedFooter
    v-if="effectivePinToViewport && total > 0"
    :sidebar-collapsed="sidebarCollapsed"
  >
    <Pagination
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total="total"
      @page-change="$emit('page-change', $event)"
    />
  </DashboardFixedFooter>
  <div v-else-if="total > 0" v-bind="attrs" :class="paginationBarClass">
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

const props = withDefaults(
  defineProps<{
    currentPage: number
    itemsPerPage?: number
    total: number
    /** Pin to viewport bottom on dashboard pages (off for fullscreen overlays). */
    pinToViewport?: boolean
  }>(),
  {
    itemsPerPage: 100,
    pinToViewport: true,
  }
)

defineEmits<{
  'page-change': [page: number]
}>()

const attrs = useAttrs()
const { paginationBarClass } = useDashboardPageChrome()
const { sidebarCollapsed } = useDashboardSidebarCollapsed()
const { isCapacitorIos } = useIsCapacitorIos()

/** iOS: pagination flows with page content (not pinned above bottom nav). */
const effectivePinToViewport = computed(
  () => props.pinToViewport && !isCapacitorIos.value
)
</script>
