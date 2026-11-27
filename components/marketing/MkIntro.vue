<template>
  <section id="use-cases" class="mk-section mku" aria-labelledby="mku-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mku-title"
        eyebrow="Who it's for"
        title="One workspace,"
        accent="however you sell."
        align="start"
      />

      <div class="mkw">
        <!-- An index of trades: the open one shows what Storvv does for it -->
        <ol class="mkw__index">
          <li
            v-for="(trade, i) in trades"
            :key="trade.id"
            class="mkw__item"
            :class="{ 'is-open': active === i }"
          >
            <button
              :id="`mku-tab-${trade.id}`"
              type="button"
              class="mkw__head"
              :aria-expanded="active === i"
              :aria-controls="`mku-detail-${trade.id}`"
              @click="active = i"
            >
              <span class="mkw__num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="mkw__name">{{ trade.label }}</span>
              <ArrowUpRight class="mkw__arrow" :size="22" :stroke-width="1.5" aria-hidden="true" />
            </button>
            <div
              :id="`mku-detail-${trade.id}`"
              class="mkw__detail"
              role="region"
              :aria-labelledby="`mku-tab-${trade.id}`"
              :hidden="active !== i"
            >
              <h3 class="mkw__title">{{ trade.title }}</h3>
              <p class="mkw__text">{{ trade.text }}</p>
              <dl class="mkw__specs">
                <div v-for="point in trade.points" :key="point.label" class="mkw__spec">
                  <dt>{{ point.label }}</dt>
                  <dd>{{ point.detail }}</dd>
                </div>
              </dl>
              <NuxtLink :to="signupUrl" class="mkw__link">
                Start free
                <ArrowRight :size="16" :stroke-width="2" aria-hidden="true" />
              </NuxtLink>
            </div>
          </li>
        </ol>

        <!-- The photo, framed like a figure, with a live readout from the shop -->
        <figure class="mkw__figure">
          <div class="mkw__frame">
            <Transition name="mkw-photo">
              <img
                :key="current.id"
                class="mkw__photo"
                :src="current.src"
                :alt="current.alt"
                width="864"
                height="1152"
                loading="lazy"
                decoding="async"
              />
            </Transition>
            <span class="mkw__corner mkw__corner--tl" aria-hidden="true" />
            <span class="mkw__corner mkw__corner--tr" aria-hidden="true" />
            <span class="mkw__corner mkw__corner--bl" aria-hidden="true" />
            <span class="mkw__corner mkw__corner--br" aria-hidden="true" />
            <ul class="mkw__readout" aria-hidden="true">
              <li v-for="note in current.notes" :key="note.title">
                <span class="mkw__readout-dot" />
                <b>{{ note.title }}</b>
                <span>{{ note.text }}</span>
              </li>
            </ul>
          </div>
          <figcaption class="mkw__caption">
            <span>Fig. {{ String(active + 1).padStart(2, '0') }}</span>
            <span>{{ current.label }}</span>
            <span
              >{{ String(active + 1).padStart(2, '0') }} /
              {{ String(trades.length).padStart(2, '0') }}</span
            >
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
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
} from '~/icons'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'

const signupUrl = useMarketingSignupUrl()

const trades = [
  {
    id: 'gadgets',
    label: 'Gadget stores',
    icon: Smartphone,
    title: 'Track every phone by its IMEI',
    text: 'Know exactly which device sold, take trade-ins as part of the price, and send the receipt before the customer leaves the counter.',
    points: [
      {
        icon: ScanBarcode,
        label: 'IMEI and serial tracking',
        detail: 'Every phone saved by its IMEI, from stock-in to sale.',
      },
      {
        icon: Repeat,
        label: 'Trade-ins and buybacks',
        detail: 'Price the old phone and take it off the new one.',
      },
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
      {
        icon: Wallet,
        label: 'Deposits and part payments',
        detail: 'Customers pay over time, balances stay current.',
      },
      {
        icon: ScanBarcode,
        label: 'Serial numbers on every unit',
        detail: 'Find any TV or speaker by its serial.',
      },
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
      {
        icon: ScanBarcode,
        label: 'Camera barcode scanning',
        detail: 'Any phone camera works as the scanner.',
      },
      { icon: BellRing, label: 'Low-stock alerts', detail: 'Know before popular lines run out.' },
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
      {
        icon: HandCoins,
        label: 'Deposits and balances',
        detail: 'Each car shows what is paid and what is left.',
      },
      { icon: ClipboardList, label: 'Sales leads', detail: 'Every interested buyer in one list.' },
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
      {
        icon: ArrowLeftRight,
        label: 'Branch-to-branch transfers',
        detail: 'Move stock between sites, with approval.',
      },
      { icon: Handshake, label: 'Stock loans', detail: 'Lend stock out and track it back.' },
      {
        icon: UserCog,
        label: 'Roles for every team',
        detail: 'Everyone sees only what they need.',
      },
    ],
    notes: [
      { title: 'Transfer approved', text: '40 cartons · Apapa → Ikeja' },
      { title: 'Stock loan', text: '12 units out to Musa Bello' },
    ],
    src: '/marketing/people/procurement.webp',
    alt: 'A procurement officer checking an order on a tablet beside pallets of cartons in a warehouse',
  },
]

const route = useRoute()
/** `?trade=electronics` (from the header's Product menu) opens that tab */
const tradeFromQuery = () => trades.findIndex((trade) => trade.id === route.query.trade)
const active = ref(Math.max(0, tradeFromQuery()))
watch(
  () => route.query.trade,
  () => {
    const index = tradeFromQuery()
    if (index >= 0) active.value = index
  }
)
const current = computed(() => trades[active.value]!)

// Fetch every trade's photo once the section is near, so switching shows the new one at once
let observer: IntersectionObserver | null = null
onMounted(() => {
  const section = document.getElementById('use-cases')
  if (!section || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      for (const trade of trades) new Image().src = trade.src
      observer?.disconnect()
    },
    { rootMargin: '400px 0px' }
  )
  observer.observe(section)
})
onUnmounted(() => observer?.disconnect())
</script>
