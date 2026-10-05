<template>
  <SCard
    class="s-paylinks-card"
    :class="cardClass"
    title="Payment links"
    description="Money collected through shareable links"
  >
    <template #actions>
      <NuxtLink to="/dashboard/payment-links" class="s-link s-paylinks-card__open">Open</NuxtLink>
    </template>

    <dl v-if="loading && links.length === 0" class="s-metrics s-metrics--inline s-paylinks-card__metrics" aria-busy="true">
      <div v-for="i in 4" :key="i" class="s-metrics__item" aria-hidden="true">
        <SSkeleton width="56px" height="12px" />
        <SSkeleton width="72px" height="20px" />
      </div>
    </dl>

    <div v-else-if="!payout.connected" class="s-paylinks-card__setup">
      <p>Connect a payout account to start collecting payments online.</p>
      <NuxtLink to="/dashboard/payment-links" class="s-link">Set up payment links</NuxtLink>
    </div>

    <template v-else>
      <dl class="s-metrics s-metrics--inline s-paylinks-card__metrics">
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Collected</dt>
          <dd class="s-metrics__value">{{ formatNaira(stats.collected) }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Paid</dt>
          <dd class="s-metrics__value">{{ stats.paid }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Unpaid</dt>
          <dd class="s-metrics__value">{{ stats.unpaid }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Failed</dt>
          <dd class="s-metrics__value" :class="{ 's-metrics__value--error': stats.failed > 0 }">
            {{ stats.failed }}
          </dd>
        </div>
      </dl>

      <p
        v-if="settlementSummary.settledTotal > 0 || settlementSummary.pendingTotal > 0"
        class="s-form-meta"
      >
        {{ formatNaira(settlementSummary.settledTotal) }} settled to bank
        <template v-if="settlementSummary.pendingTotal > 0">
          · {{ formatNaira(settlementSummary.pendingTotal) }} pending
        </template>
      </p>

      <p v-if="recentLinks.length === 0" class="s-list__empty s-paylinks-card__empty">No payment links yet.</p>
      <ul v-else class="s-list s-paylinks-card__list">
        <li v-for="inv in recentLinks" :key="inv.token" class="s-list__item">
          <span class="s-list__main">
            <span class="s-list__primary">{{ inv.customerName }}</span>
            <span class="s-list__secondary">#{{ inv.invoiceNumber }}</span>
          </span>
          <span class="s-paylinks-card__end">
            <span class="s-list__value">{{ formatNaira(inv.total) }}</span>
            <SBadge :tone="statusTone(inv.status)">{{ statusLabel(inv.status) }}</SBadge>
          </span>
        </li>
      </ul>
    </template>
  </SCard>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SCard from '~/components/s/SCard.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import { formatNaira } from '~/utils/naira'
import { usePaymentLinks, type PaymentLinkListItem } from '~/composables/usePaymentLinks'
import { useStoresStore } from '~/stores/stores'

const props = withDefaults(defineProps<{ cardClass?: string; limit?: number }>(), {
  cardClass: '',
  limit: 4,
})

const storesStore = useStoresStore()
const { payout, links, stats, settlementSummary, loading, loadAll } = usePaymentLinks()

const recentLinks = computed(() => links.value.slice(0, props.limit))

const statusLabel = (s: PaymentLinkListItem['status']) =>
  ({ unpaid: 'Unpaid', paid: 'Paid', failed: 'Failed', expired: 'Expired' }[s])

const statusTone = (s: PaymentLinkListItem['status']) =>
  ({ unpaid: 'neutral', paid: 'success', failed: 'error', expired: 'warning' } as const)[s]

const load = () => {
  loadAll().catch(() => {})
}

onMounted(load)
watch(
  () => storesStore.currentStoreId,
  (id, prev) => {
    if (id && id !== prev) load()
  }
)
</script>
