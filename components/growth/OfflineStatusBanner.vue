<template>
  <div v-if="isOffline" class="s-c s-banner s-banner--warning" role="status">
    <div class="s-banner__lead">
      <Zap class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>You’re offline.</strong> Sales you make are saved on this device and recorded when
        you’re back online.
      </p>
    </div>
    <SBadge v-if="waiting" tone="warning">{{ waiting }} waiting</SBadge>
  </div>
  <div v-else-if="failedCount" class="s-c s-banner s-banner--warning" role="status">
    <div class="s-banner__lead">
      <WifiOff class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong
          >{{ failedCount }} sale{{ failedCount === 1 ? '' : 's' }} saved offline
          {{ failedCount === 1 ? 'wasn’t' : 'weren’t' }} recorded.</strong
        >
        Check the reason and re-enter {{ failedCount === 1 ? 'it' : 'them' }}.
      </p>
    </div>
    <NuxtLink to="/dashboard/receipts" class="s-banner__link">Review</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WifiOff, Zap } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import { useNetworkStatus } from '~/composables/useNetworkStatus'
import { useSalesOutbox } from '~/composables/useSalesOutbox'

const { isOffline, pendingCount } = useNetworkStatus()
const { queuedCount, failedCount } = useSalesOutbox()

/** Sales and other changes on this device that the server hasn't seen yet. */
const waiting = computed(() => pendingCount.value + queuedCount.value)
</script>

<style scoped>
.s-banner__link {
  flex: none;
  min-height: var(--s-touch, 44px);
  display: inline-flex;
  align-items: center;
  padding-inline: var(--s-space-1);
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
