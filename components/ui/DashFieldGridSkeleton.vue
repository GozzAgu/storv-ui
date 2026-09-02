<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
    <div v-for="i in count" :key="i" class="space-y-2">
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-label" />
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
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
