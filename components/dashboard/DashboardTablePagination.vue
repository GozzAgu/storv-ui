<template>
  <div v-bind="$attrs" :class="paginationBarClass">
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

defineProps<{
  currentPage: number
  itemsPerPage?: number
  total: number
}>()

defineEmits<{
  'page-change': [page: number]
}>()

const { paginationBarClass } = useDashboardPageChrome()
</script>
