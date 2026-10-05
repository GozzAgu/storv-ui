<template>
  <div v-if="visible" class="s-c s-banner s-banner--warning" role="status">
    <div class="s-banner__lead">
      <WifiOff class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>You're offline.</strong> Sales and inventory changes will sync when your
        connection returns.<span v-if="hasPendingSync"> ({{ pendingCount }} pending)</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WifiOff } from '@lucide/vue'
import { useNetworkStatus } from '~/composables/useNetworkStatus'

const { isOffline, hasPendingSync, pendingCount } = useNetworkStatus()
const visible = isOffline
</script>
