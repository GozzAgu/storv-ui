<template>
  <section class="mk-section mk-section--alt mku" aria-labelledby="mku-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mku-title"
        eyebrow="Who it's for"
        title="One workspace,"
        accent="however you sell."
      />

      <div class="mku__tabs-wrap mk-reveal">
        <div class="mku__tabs" role="tablist" aria-label="Businesses" @keydown="onKeydown">
          <button
            v-for="(trade, i) in trades"
            :id="`mku-tab-${trade.id}`"
            :key="trade.id"
            ref="tabEls"
            type="button"
            role="tab"
            class="mku__tab"
            :aria-selected="active === i"
            aria-controls="mku-panel"
            :tabindex="active === i ? 0 : -1"
            @click="active = i"
          >
            <component :is="trade.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
            {{ trade.label }}
          </button>
        </div>
      </div>

      <div
        id="mku-panel"
        class="mku__panel mk-reveal"
        role="tabpanel"
        :aria-labelledby="`mku-tab-${current.id}`"
      >
        <Transition name="mk-fade" mode="out-in">
          <div :key="current.id" class="mku__inner">
            <div class="mku__copy">
              <h3 class="mku__title">{{ current.title }}</h3>
              <p class="mku__text">{{ current.text }}</p>
              <ul class="mk-checks">
                <li v-for="point in current.points" :key="point">
                  <Check :size="16" aria-hidden="true" />
                  <span>{{ point }}</span>
                </li>
              </ul>
              <NuxtLink to="/demo/dashboard" class="mk-link mku__link">
                Try it in the live demo
                <ArrowRight :size="16" aria-hidden="true" />
              </NuxtLink>
            </div>
            <img
              class="mku__photo"
              :src="current.src"
              :alt="current.alt"
              width="864"
              height="1152"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Car, Check, PackageCheck, ShoppingBasket, Smartphone, Tv } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const trades = [
  {
    id: 'gadgets',
    label: 'Gadget stores',
    icon: Smartphone,
    title: 'Every phone, by IMEI',
    text: 'Track each device by IMEI or serial number, take trade-ins as part of the price, and send the receipt before the customer leaves the counter.',
    points: ['IMEI and serial tracking', 'Trade-ins and buybacks', 'Deposits and part payments'],
    src: '/marketing/people/gadget-store.webp',
    alt: 'A gadget store attendant showing a smartwatch to a customer across a table of phones',
  },
  {
    id: 'electronics',
    label: 'Electronics',
    icon: Tv,
    title: 'Big tickets, paid in parts',
    text: 'Sell TVs, speakers and appliances by serial number, let customers pay over time, and always know who still owes you.',
    points: ['Serial numbers on every unit', 'Customer balances', 'Stock across showrooms'],
    src: '/marketing/people/electronics.webp',
    alt: 'An electronics store owner holding a tablet beside shelves of TVs and boxed speakers',
  },
  {
    id: 'supermarkets',
    label: 'Supermarkets',
    icon: ShoppingBasket,
    title: 'Fast checkout, full shelves',
    text: 'Scan items with a phone camera, ring up a basket in seconds, and get a heads-up before popular lines run out.',
    points: ['Camera barcode scan', 'Low-stock alerts', 'Roles for every shift'],
    src: '/marketing/people/supermarket.webp',
    alt: 'A supermarket manager scanning stock on a shelf of fresh produce',
  },
  {
    id: 'dealers',
    label: 'Car dealers',
    icon: Car,
    title: 'Deposits and leads in one place',
    text: 'Record deposits against each car, follow up on interested buyers, and see the balance left on every deal.',
    points: ['Deposits and balances', 'Sales leads', 'Each car tracked by serial number'],
    src: '/marketing/people/car-dealer.webp',
    alt: 'A smiling car dealer holding up a key fob and a tablet in front of a white SUV in his showroom',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: PackageCheck,
    title: 'Stock that moves between sites',
    text: 'Move stock between locations with approvals, lend stock out and get it back, and keep one count across every site.',
    points: ['Branch-to-branch transfers', 'Stock loans', 'Reorder list export'],
    src: '/marketing/people/procurement.webp',
    alt: 'A procurement officer checking an order on a tablet beside pallets of cartons in a warehouse',
  },
]

const active = ref(0)
const current = computed(() => trades[active.value]!)
const tabEls = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent) {
  const last = trades.length - 1
  const next: Record<string, number> = {
    ArrowRight: active.value === last ? 0 : active.value + 1,
    ArrowLeft: active.value === 0 ? last : active.value - 1,
    Home: 0,
    End: last,
  }
  const target = next[event.key]
  if (target === undefined) return
  event.preventDefault()
  active.value = target
  tabEls.value[target]?.focus()
}
</script>
