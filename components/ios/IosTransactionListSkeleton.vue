<template>
  <div
    class="ios-transaction-list-skeleton"
    :aria-busy="ariaBusy"
    :aria-label="ariaLabel"
  >
    <div v-for="i in count" :key="i" class="ios-transaction-list-skeleton__row">
      <div class="ios-skeleton ios-skeleton--circle ios-transaction-list-skeleton__icon" />
      <div class="ios-transaction-list-skeleton__body">
        <div
          class="ios-skeleton ios-skeleton--line ios-transaction-list-skeleton__line ios-transaction-list-skeleton__line--title"
        />
        <div
          class="ios-skeleton ios-skeleton--line ios-transaction-list-skeleton__line ios-transaction-list-skeleton__line--subtitle"
        />
      </div>
      <div class="ios-skeleton ios-transaction-list-skeleton__amount" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
    ariaBusy?: boolean
    ariaLabel?: string
  }>(),
  {
    count: 8,
    ariaBusy: true,
    ariaLabel: 'Loading list',
  }
)
</script>
