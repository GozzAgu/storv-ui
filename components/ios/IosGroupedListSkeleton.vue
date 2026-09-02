<template>
  <div
    class="ios-grouped-list ios-grouped-list-skeleton"
    :aria-busy="ariaBusy"
    :aria-label="ariaLabel"
  >
    <div v-for="i in count" :key="i" class="ios-grouped-list-skeleton__row">
      <div class="ios-skeleton ios-skeleton--icon" />
      <div class="ios-grouped-list-skeleton__body">
        <div class="ios-skeleton ios-skeleton--line ios-skeleton--line-lg" />
        <div class="ios-skeleton ios-skeleton--line ios-skeleton--line-sm" />
      </div>
      <div class="ios-skeleton ios-skeleton--value" />
      <div v-if="showMenu" class="ios-skeleton ios-skeleton--menu-dot" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
    showMenu?: boolean
    ariaBusy?: boolean
    ariaLabel?: string
  }>(),
  {
    count: 8,
    showMenu: true,
    ariaBusy: true,
    ariaLabel: 'Loading list',
  }
)
</script>
