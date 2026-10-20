<template>
  <section class="mk-section mku" aria-labelledby="mku-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mku-title"
        eyebrow="Who it's for"
        title="One workspace,"
        accent="however you sell."
        align="start"
      />

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
          {{ trade.label }}
        </button>
      </div>

      <div
        id="mku-panel"
        class="mku__panel"
        role="tabpanel"
        :aria-labelledby="`mku-tab-${current.id}`"
      >
        <Transition name="mk-fade" mode="out-in">
          <div :key="current.id" class="mku__inner">
            <div class="mku__copy">
              <component
                :is="current.icon"
                :size="32"
                :stroke-width="1.5"
                class="mku__icon"
                aria-hidden="true"
              />
              <h3 class="mku__title">{{ current.title }}</h3>
              <p class="mku__text">{{ current.text }}</p>
              <ul class="mku__points">
                <li v-for="point in current.points" :key="point.label">
                  <component :is="point.icon" :size="18" :stroke-width="2" aria-hidden="true" />
                  {{ point.label }}
                </li>
              </ul>
            </div>
            <div class="mku__media">
              <img
                class="mku__photo"
                :src="current.src"
                :alt="current.alt"
                width="864"
                height="1152"
                loading="lazy"
                decoding="async"
              />
              <ul class="mku__notes" aria-hidden="true">
                <li v-for="note in current.notes" :key="note.title" class="mku__note">
                  <span class="mku__note-title">{{ note.title }}</span>
                  <span class="mku__note-text">{{ note.text }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowLeftRight,
  BellRing,
  Car,
  ClipboardList,
  Handshake,
  HandCoins,
  PackageCheck,
  Repeat,
  ScanBarcode,
  ShoppingBasket,
  Smartphone,
  Tv,
  UserCog,
  Wallet,
} from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const trades = [
  {
    id: 'gadgets',
    label: 'Gadget stores',
    icon: Smartphone,
    title: 'Track every phone by its IMEI',
    text: 'Know exactly which device sold, take trade-ins as part of the price, and send the receipt before the customer leaves the counter.',
    points: [
      { icon: ScanBarcode, label: 'IMEI and serial tracking' },
      { icon: Repeat, label: 'Trade-ins and buybacks' },
    ],
    notes: [
      { title: 'iPhone 13 · 128GB', text: 'IMEI saved · Ikeja branch' },
      { title: 'Trade-in priced', text: 'iPhone 11 · ₦180,000' },
    ],
    src: '/marketing/people/gadget-store.webp',
    alt: 'A gadget store attendant showing a smartwatch to a customer across a table of phones',
  },
  {
    id: 'electronics',
    label: 'Electronics',
    icon: Tv,
    title: 'Sell big-ticket items in parts',
    text: 'Sell TVs, speakers and appliances by serial number, let customers pay over time, and always know who still owes you.',
    points: [
      { icon: Wallet, label: 'Deposits and part payments' },
      { icon: ScanBarcode, label: 'Serial numbers on every unit' },
    ],
    notes: [
      { title: 'Part payment received', text: '₦150,000 of ₦420,000' },
      { title: '55" TV · Serial saved', text: 'Showroom 2' },
    ],
    src: '/marketing/people/electronics.webp',
    alt: 'An electronics store owner holding a tablet beside shelves of TVs and boxed speakers',
  },
  {
    id: 'supermarkets',
    label: 'Supermarkets',
    icon: ShoppingBasket,
    title: 'Fast checkout and full shelves',
    text: 'Scan items with a phone camera, ring up a basket in seconds, and get a heads-up before popular lines run out.',
    points: [
      { icon: ScanBarcode, label: 'Camera barcode scanning' },
      { icon: BellRing, label: 'Low-stock alerts' },
    ],
    notes: [
      { title: 'Low stock', text: 'Milk 400g · 6 left' },
      { title: 'Receipt sent', text: '₦12,450 on WhatsApp' },
    ],
    src: '/marketing/people/supermarket.webp',
    alt: 'A supermarket manager scanning stock on a shelf of fresh produce',
  },
  {
    id: 'dealers',
    label: 'Car dealers',
    icon: Car,
    title: 'Deposits and buyers in one place',
    text: 'Record deposits against each car, follow up on interested buyers, and see the balance left on every deal.',
    points: [
      { icon: HandCoins, label: 'Deposits and balances' },
      { icon: ClipboardList, label: 'Sales leads' },
    ],
    notes: [
      { title: 'Deposit recorded', text: '₦2,000,000 · Toyota Camry' },
      { title: 'New lead', text: 'Asking about a 2018 SUV' },
    ],
    src: '/marketing/people/car-dealer.webp',
    alt: 'A smiling car dealer holding up a key fob and a tablet in front of a white SUV in his showroom',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: PackageCheck,
    title: 'Keep one count across every site',
    text: 'Move stock between locations with approvals, lend stock out and get it back, and see who has what at any time.',
    points: [
      { icon: ArrowLeftRight, label: 'Branch-to-branch transfers' },
      { icon: Handshake, label: 'Stock loans' },
      { icon: UserCog, label: 'Roles for every team' },
    ],
    notes: [
      { title: 'Transfer approved', text: '40 cartons · Apapa → Ikeja' },
      { title: 'Stock loan', text: '12 units out to Musa Bello' },
    ],
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
