<template>
  <div
    v-if="visible"
    class="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-xs text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/[0.08] dark:text-amber-100"
    role="status"
  >
    <p class="font-medium">You are offline</p>
    <p class="mt-0.5 leading-relaxed text-amber-900/80 dark:text-amber-100/80">
      Sales and inventory changes will sync when your connection returns.
      <span v-if="hasPendingSync"> ({{ pendingCount }} pending)</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '~/composables/useNetworkStatus'

const { isOffline, hasPendingSync, pendingCount } = useNetworkStatus()
const visible = isOffline
</script>
