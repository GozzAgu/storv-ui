<template>
  <div class="dash-page-metrics" aria-hidden="true">
    <div v-for="i in count" :key="i" class="dash-page-metric">
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-label" />
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-metric" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 4,
  }
)
</script>
