<template>
  <SCard class="s-paylinks-soon" :class="{ 's-paylinks-soon--compact': compact }">
    <SEmptyState
      :title="compact ? 'Payment links are coming soon' : 'Payment links'"
      description="Pay-by-link checkout is on the way. You'll connect your bank, send secure links, and auto-create receipts when customers pay."
    >
      <template #icon><CreditCard :size="24" :stroke-width="1.75" /></template>
      <template v-if="!compact" #actions>
        <SBadge tone="accent" size="md">Coming soon</SBadge>
        <p class="s-form-meta">We're finishing the last pieces. Check back soon.</p>
      </template>
    </SEmptyState>
  </SCard>
</template>

<script setup lang="ts">
import { CreditCard } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false }
)
</script>
