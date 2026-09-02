<template>
  <div
    class="ios-quick-actions ios-quick-actions--card ios-quick-action-skeleton"
    aria-hidden="true"
  >
    <div class="ios-quick-actions__scroll">
      <div v-for="i in count" :key="i" class="ios-quick-action-skeleton__item">
        <div class="ios-skeleton ios-skeleton--circle" />
        <div class="ios-skeleton ios-skeleton--line ios-skeleton--line-xs" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  { count: 4 }
)
</script>
