<template>
  <div v-if="visible" class="s-c s-banner s-banner--warning" role="status">
    <div class="s-banner__lead">
      <Zap class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>Offline Mode</strong> — Sales queued locally and sync when you’re back online.
      </p>
    </div>
    <SBadge v-if="hasPendingSync" tone="warning">{{ pendingCount }} queued</SBadge>
  </div>
</template>

<script setup lang="ts">
import { Zap } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import { useNetworkStatus } from '~/composables/useNetworkStatus'

const { isOffline, hasPendingSync, pendingCount } = useNetworkStatus()
const visible = isOffline
</script>
