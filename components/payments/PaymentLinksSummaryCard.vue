<template>
  <section :class="cardClass">
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <p
          class="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400"
        >
          Payment links
        </p>
        <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          Money collected through shareable links
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          v-if="payout.connected && isNativeShell"
          type="button"
          class="rounded-full bg-primary-600 px-2.5 py-1 text-[10px] font-semibold text-white"
          @click="openCreate"
        >
          New link
        </button>
        <NuxtLink
          to="/dashboard/payment-links"
          class="text-[11px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Open
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && links.length === 0" class="space-y-2">
      <div class="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
      <div class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
    </div>

    <!-- Not connected -->
    <div
      v-else-if="!payout.connected"
      class="rounded-lg bg-gray-50/80 px-3 py-4 text-center dark:bg-white/[0.03]"
    >
      <p class="text-xs text-gray-600 dark:text-gray-300">
        Connect a payout account to start collecting payments online.
      </p>
      <NuxtLink
        to="/dashboard/payment-links"
        class="mt-1.5 inline-block text-[11px] font-medium text-primary-700 underline underline-offset-2 dark:text-primary-400"
      >
        Set up payment links
      </NuxtLink>
    </div>

    <!-- Connected -->
    <template v-else>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div class="rounded-lg bg-gray-50/80 px-3 py-2 dark:bg-white/[0.03]">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Collected</p>
          <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ formatNaira(stats.collected) }}
          </p>
        </div>
        <div class="rounded-lg bg-gray-50/80 px-3 py-2 dark:bg-white/[0.03]">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Paid</p>
          <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ stats.paid }}
          </p>
        </div>
        <div class="rounded-lg bg-gray-50/80 px-3 py-2 dark:bg-white/[0.03]">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Unpaid</p>
          <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ stats.unpaid }}
          </p>
        </div>
        <div class="rounded-lg bg-gray-50/80 px-3 py-2 dark:bg-white/[0.03]">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">Failed</p>
          <p
            class="mt-0.5 text-sm font-semibold tabular-nums"
            :class="
              stats.failed > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-gray-50'
            "
          >
            {{ stats.failed }}
          </p>
        </div>
      </div>

      <p
        v-if="settlementSummary.settledTotal > 0 || settlementSummary.pendingTotal > 0"
        class="mt-2 text-[11px] text-gray-500 dark:text-gray-400"
      >
        {{ formatNaira(settlementSummary.settledTotal) }} settled to bank
        <template v-if="settlementSummary.pendingTotal > 0">
          · {{ formatNaira(settlementSummary.pendingTotal) }} pending</template
        >
      </p>

      <div class="mt-3 border-t border-gray-100/90 pt-2.5 dark:border-gray-800/70">
        <div v-if="recentLinks.length === 0" class="py-1 text-xs text-gray-500 dark:text-gray-400">
          No payment links yet.
        </div>
        <ul v-else class="space-y-0">
          <li
            v-for="inv in recentLinks"
            :key="inv.token"
            class="flex items-center justify-between gap-3 border-b border-gray-100/90 py-2 last:border-0 dark:border-gray-800/70"
          >
            <div class="min-w-0">
              <p class="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                {{ inv.customerName }}
              </p>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">
                #{{ inv.invoiceNumber }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{
                formatNaira(inv.total)
              }}</span>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  statusClass(inv.status),
                ]"
              >
                {{ statusLabel(inv.status) }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { formatNaira } from '~/utils/naira'
import { usePaymentLinks, type PaymentLinkListItem } from '~/composables/usePaymentLinks'
import { useStoresStore } from '~/stores/stores'
import { isCapacitorNative } from '~/utils/capacitor-env'

const emit = defineEmits<{ 'create-link': [] }>()

const props = withDefaults(defineProps<{ cardClass?: string; limit?: number }>(), {
  cardClass: 'rounded-xl bg-white p-4 dark:bg-dashboard-card',
  limit: 4,
})

const storesStore = useStoresStore()
const { payout, links, stats, settlementSummary, loading, loadAll } = usePaymentLinks()
const isNativeShell = computed(() => isCapacitorNative())

function openCreate() {
  emit('create-link')
}

const recentLinks = computed(() => links.value.slice(0, props.limit))

const statusLabel = (s: PaymentLinkListItem['status']) =>
  ({ unpaid: 'Unpaid', paid: 'Paid', failed: 'Failed', expired: 'Expired' }[s])

const statusClass = (s: PaymentLinkListItem['status']) =>
  ({
    unpaid: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    expired: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  }[s])

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
