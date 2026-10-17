<template>
  <section class="s-sales__section s-today" aria-label="Today's sales">
    <div class="s-today__bar">
      <div class="s-today__day">
        <SIconButton label="Previous day" size="sm" @click="shiftDay(-1)">
          <ChevronLeft :size="16" :stroke-width="2" aria-hidden="true" />
        </SIconButton>
        <span class="s-today__day-label" aria-live="polite">{{ dayLabel }}</span>
        <SIconButton label="Next day" size="sm" :disabled="isToday" @click="shiftDay(1)">
          <ChevronRight :size="16" :stroke-width="2" aria-hidden="true" />
        </SIconButton>
      </div>
      <div class="s-today__actions">
        <STabs
          v-if="canViewStoreTotals"
          v-model="mode"
          :tabs="modeTabs"
          label="Whose sales"
          class="s-today__mode"
        />
        <SButton size="sm" :disabled="!hasActivity" :loading="sharing" @click="shareSummary">
          <template #leading><Share2 :size="14" :stroke-width="2" aria-hidden="true" /></template>
          Share
        </SButton>
      </div>
    </div>

    <SCard v-if="!hasActivity">
      <SEmptyState
        :title="isToday ? 'No sales yet today' : `No sales on ${dayLabel}`"
        :description="
          mode === 'mine' ? 'Sales you record show up here.' : 'Sales recorded show up here.'
        "
      >
        <template #icon><ReceiptText :size="24" :stroke-width="1.75" /></template>
        <template v-if="isToday && canCreate" #actions>
          <SButton variant="primary" @click="$emit('new-sale')">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            New sale
          </SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <SCard class="s-today__headline">
        <p class="s-today__label">{{ mode === 'mine' ? 'You sold' : 'Sold' }}</p>
        <p class="s-today__amount" data-figure>{{ formatCurrency(summary.sold) }}</p>
        <p class="s-today__meta">
          {{ summary.count }} {{ summary.count === 1 ? 'sale' : 'sales' }}
          <span
            v-if="comparison"
            class="s-today__compare"
            :class="`s-today__compare--${comparison.tone}`"
            data-figure
          >
            · {{ comparison.text }}
          </span>
        </p>
        <dl class="s-metrics s-metrics--line s-today__totals" aria-label="Money for the day">
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Collected</dt>
            <dd class="s-metrics__value">{{ formatCurrency(summary.collected) }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Still owed</dt>
            <dd class="s-metrics__value" :class="{ 's-metrics__value--warning': summary.owed > 0 }">
              {{ formatCurrency(summary.owed) }}
            </dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Refunds</dt>
            <dd class="s-metrics__value">
              {{ summary.refunds.count }}
              <template v-if="summary.refunds.count > 0">
                · {{ formatCurrency(summary.refunds.amount) }}
              </template>
            </dd>
          </div>
        </dl>
      </SCard>

      <div class="s-today__grid">
        <SCard v-if="summary.tenders.length > 0" title="How it was paid">
          <div class="s-today__split" aria-hidden="true">
            <span
              v-for="(tender, i) in summary.tenders"
              :key="tender.method"
              class="s-today__split-part"
              :class="`s-today__tone-${Math.min(i, 5)}`"
              :style="{ width: `${share(tender.amount)}%` }"
            />
          </div>
          <ul class="s-today__rows">
            <li v-for="(tender, i) in summary.tenders" :key="tender.method" class="s-today__row">
              <span
                class="s-today__dot"
                :class="`s-today__tone-${Math.min(i, 5)}`"
                aria-hidden="true"
              />
              <span class="s-today__row-name">{{ tender.method }}</span>
              <span class="s-today__row-meta">{{ share(tender.amount) }}%</span>
              <span class="s-today__row-value" data-figure>{{
                formatCurrency(tender.amount)
              }}</span>
            </li>
          </ul>
        </SCard>

        <SCard v-if="summary.sellers.length > 0" title="Who sold">
          <ul class="s-today__rows">
            <li v-for="seller in summary.sellers" :key="seller.uid" class="s-today__row">
              <span class="s-today__row-name">{{ sellerName(seller) }}</span>
              <span class="s-today__row-meta">
                {{ seller.count }} {{ seller.count === 1 ? 'sale' : 'sales' }}
              </span>
              <span class="s-today__row-value" data-figure>{{
                formatCurrency(seller.amount)
              }}</span>
            </li>
          </ul>
        </SCard>
      </div>

      <SCard v-if="summary.products.length > 0" title="What sold">
        <ul class="s-today__rows">
          <li v-for="product in visibleProducts" :key="product.key" class="s-today__row">
            <span class="s-today__row-name">
              {{ product.name }}
              <details v-if="product.serials.length > 0" class="s-today__serials">
                <summary>
                  {{ product.serials.length }}
                  {{ product.serials.length === 1 ? 'serial' : 'serials' }}
                </summary>
                <span v-for="serial in product.serials" :key="serial">{{ serial }}</span>
              </details>
            </span>
            <span class="s-today__row-meta">×{{ product.quantity }}</span>
            <span class="s-today__row-value" data-figure>{{ formatCurrency(product.amount) }}</span>
          </li>
          <li v-if="summary.reductions > 0" class="s-today__row s-today__row--muted">
            <span class="s-today__row-name">Discounts and trade-ins at checkout</span>
            <span class="s-today__row-value" data-figure
              >−{{ formatCurrency(summary.reductions) }}</span
            >
          </li>
        </ul>
        <template v-if="summary.products.length > PRODUCT_PREVIEW" #footer>
          <SButton variant="ghost" size="sm" @click="showAllProducts = !showAllProducts">
            {{ showAllProducts ? 'Show fewer' : `Show all ${summary.products.length}` }}
          </SButton>
        </template>
      </SCard>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Plus, ReceiptText, Share2 } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import STabs from '~/components/s/STabs.vue'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useStoresStore } from '~/stores/stores'
import { buildDaySalesShareText, shareDaySalesText } from '~/utils/day-sales-share'
import {
  summarizeDaySales,
  type DaySalesMode,
  type DaySalesSeller,
} from '~/utils/day-sales-summary'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

const props = defineProps<{
  receipts: Receipt[]
  viewerUid: string
  /** Owner, or staff with the Financial figures grant. */
  canViewStoreTotals: boolean
  canCreate?: boolean
  /** Fallback for sales saved without the seller's name. */
  resolveSellerName?: (uid: string) => string
}>()

defineEmits<{ 'new-sale': [] }>()

const PRODUCT_PREVIEW = 8

const { formatCurrency } = usePreferences()
const receiptsStore = useReceiptsStore()
const storesStore = useStoresStore()

const now = ref(new Date())
const day = ref(new Date())
const chosenMode = ref<DaySalesMode | null>(null)
const showAllProducts = ref(false)

/** Owners start on everyone's sales, staff on their own, until they pick. Permissions load late. */
const mode = computed<DaySalesMode>({
  get: () => chosenMode.value ?? (props.canViewStoreTotals ? 'everyone' : 'mine'),
  set: (value) => {
    chosenMode.value = value
  },
})

const modeTabs = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'mine', label: 'My sales' },
]

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const isToday = computed(() => startOfDay(day.value).getTime() === startOfDay(now.value).getTime())

const dayLabel = computed(() => {
  if (isToday.value) return 'Today'
  const yesterday = startOfDay(now.value)
  yesterday.setDate(yesterday.getDate() - 1)
  if (startOfDay(day.value).getTime() === yesterday.getTime()) return 'Yesterday'
  return day.value.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
})

function shiftDay(by: number) {
  const next = new Date(day.value)
  next.setDate(next.getDate() + by)
  if (startOfDay(next) > startOfDay(now.value)) return
  day.value = next
  showAllProducts.value = false
}

const summary = computed(() =>
  summarizeDaySales(props.receipts, {
    day: day.value,
    now: now.value,
    viewerUid: props.viewerUid,
    mode: mode.value,
    canViewStoreTotals: props.canViewStoreTotals,
  })
)

const hasActivity = computed(() => summary.value.count > 0 || summary.value.refunds.count > 0)

const toast = useAppToast()
const sharing = ref(false)

async function shareSummary() {
  const name = storesStore.currentStore?.name ?? ''
  const text = buildDaySalesShareText(
    {
      ...summary.value,
      sellers: summary.value.sellers.map((s) => ({ ...s, name: sellerName(s) })),
    },
    {
      storeName: getStoreBranchShortLabel(name) || name || 'Storvv',
      day: day.value,
      formatCurrency,
    }
  )
  sharing.value = true
  try {
    const result = await shareDaySalesText(text)
    if (result === 'clipboard') toast.success('Summary copied. Paste it into WhatsApp.')
  } finally {
    sharing.value = false
  }
}

const visibleProducts = computed(() =>
  showAllProducts.value ? summary.value.products : summary.value.products.slice(0, PRODUCT_PREVIEW)
)

function share(amount: number) {
  const total = summary.value.collected
  return total > 0 ? Math.round((amount / total) * 100) : 0
}

function sellerName(seller: DaySalesSeller) {
  if (seller.name !== 'Unknown') return seller.name
  return props.resolveSellerName?.(seller.uid) || 'Unknown'
}

const comparison = computed(() => {
  const { previousSold, change, sameTimeCutoff } = summary.value.comparison
  const versus = sameTimeCutoff
    ? `yesterday by ${now.value.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : 'the day before'
  if (previousSold === 0) {
    if (summary.value.sold === 0) return null
    return { text: `nothing sold ${versus}`, tone: 'neutral' }
  }
  const sign = change >= 0 ? '+' : '−'
  return {
    text: `${sign}${formatCurrency(Math.abs(change))} vs ${versus}`,
    tone: change >= 0 ? 'up' : 'down',
  }
})

let stopLive: (() => void) | null = null
let clock: ReturnType<typeof setInterval> | undefined

async function startLive() {
  stopLive?.()
  stopLive = null
  if (!isToday.value) return
  stopLive = await receiptsStore.watchReceiptsSince(startOfDay(now.value))
}

function onVisible() {
  if (document.visibilityState === 'visible') now.value = new Date()
}

watch([isToday, () => storesStore.currentStoreId], () => void startLive())

onMounted(() => {
  void startLive()
  clock = setInterval(() => (now.value = new Date()), 60_000)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  stopLive?.()
  clearInterval(clock)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>
