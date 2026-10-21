<template>
  <section class="mkh" :class="{ 'is-paused': paused }" aria-labelledby="home-title">
    <div class="mk-container">
      <div class="mkh__copy">
        <NuxtLink to="/features?area=sales#explore" class="mkh__announce mkh-in" style="--i: 0">
          <span class="mkh__announce-dot" aria-hidden="true" />
          Receipts on WhatsApp, straight from the till
          <ChevronRight :size="14" aria-hidden="true" />
        </NuxtLink>

        <h1 id="home-title" class="mkh__title mkh-in" style="--i: 1">
          <span class="mkh__line">Sell and track stock</span>
          <span class="mkh__line mkh__line--soft">in every branch.</span>
        </h1>

        <p class="mkh__lede mkh-in" style="--i: 2">
          The point of sale and inventory system for gadget stores, electronics shops, supermarkets
          and dealers. Ring up a sale and your stock, receipts and customer balances update at once.
        </p>

        <div class="mkh__actions mkh-in" style="--i: 3">
          <NuxtLink :to="signupUrl" class="mk-cta-btn" data-mk-primary>
            Create your free store
          </NuxtLink>
          <NuxtLink to="/demo/dashboard" class="mkh__demo">or try the live demo</NuxtLink>
        </div>
      </div>

      <div class="mkh__stage mkh-in" style="--i: 4">
        <div class="mkh__aura" aria-hidden="true">
          <span class="mk-tint--peach" />
          <span class="mk-tint--sky" />
          <span class="mk-tint--lilac" />
          <span class="mk-tint--sage" />
        </div>

        <MkFrame
          src="/marketing/app/overview.webp"
          alt="The Storvv dashboard showing today's revenue, sales, top products and low-stock alerts"
          url="app.storvv.com/dashboard"
          eager
        />

        <div class="mkh__note mkh__note--sale mk-tint--sage" aria-hidden="true">
          <span class="mkh__note-icon"><ReceiptText :size="18" /></span>
          <span class="mkh__note-stack">
            <Transition name="mkh-swap">
              <span :key="sale.amount" class="mkh__note-body">
                <span class="mkh__note-title">Sale completed · {{ sale.amount }}</span>
                <span class="mkh__note-text">{{ sale.detail }}</span>
              </span>
            </Transition>
          </span>
        </div>

        <div class="mkh__note mkh__note--stock mk-tint--peach" aria-hidden="true">
          <span class="mkh__note-icon"><PackageMinus :size="18" /></span>
          <span class="mkh__note-body">
            <span class="mkh__note-title">Low stock · AirPods Pro</span>
            <span class="mkh__note-text">2 left at Ikeja branch</span>
          </span>
        </div>

        <div class="mkh__note mkh__note--receipt mk-tint--sky" aria-hidden="true">
          <span class="mkh__note-icon"><MessageCircle :size="18" /></span>
          <span class="mkh__note-body">
            <span class="mkh__note-title">Receipt sent</span>
            <span class="mkh__note-text">
              On WhatsApp to Ada <CheckCheck :size="14" class="mkh__ticks" />
            </span>
          </span>
        </div>
      </div>

      <div class="mkh__proof">
        <p class="mkh__proof-label">Built for shops that sell</p>

        <div class="mkh__marquee" role="region" aria-label="Businesses Storvv is built for">
          <ul v-for="copy in 2" :key="copy" class="mkh__row" :aria-hidden="copy === 2">
            <li
              v-for="trade in trades"
              :key="trade.label"
              class="mkh__chip mkh__chip--trade"
              :class="`mk-tint--${trade.tint}`"
            >
              <component :is="trade.icon" :size="18" :stroke-width="1.75" aria-hidden="true" />
              {{ trade.label }}
            </li>
          </ul>
        </div>

        <p class="mkh__proof-label">Record every way you get paid</p>

        <div
          class="mkh__marquee mkh__marquee--reverse"
          role="region"
          aria-label="Payment methods you can record"
        >
          <ul v-for="copy in 2" :key="copy" class="mkh__row" :aria-hidden="copy === 2">
            <li v-for="method in payments" :key="method" class="mkh__chip">{{ method }}</li>
          </ul>
        </div>

        <button
          type="button"
          class="mkh__pause"
          :aria-pressed="paused"
          :aria-label="paused ? 'Play animations' : 'Pause animations'"
          @click="toggle"
        >
          <Play v-if="paused" :size="14" aria-hidden="true" />
          <Pause v-else :size="14" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Car,
  CheckCheck,
  ChevronRight,
  MessageCircle,
  PackageCheck,
  PackageMinus,
  Pause,
  Play,
  ReceiptText,
  ShoppingBasket,
  Smartphone,
  Tv,
} from '@lucide/vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import { useMarketingMotion } from '~/composables/useMarketingMotion'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'

const signupUrl = useMarketingSignupUrl()

const trades = [
  { icon: Smartphone, label: 'Gadget stores', tint: 'sky' },
  { icon: Tv, label: 'Electronics', tint: 'lilac' },
  { icon: ShoppingBasket, label: 'Supermarkets', tint: 'sage' },
  { icon: Car, label: 'Car dealers', tint: 'peach' },
  { icon: PackageCheck, label: 'Procurement', tint: 'sand' },
]

const payments = [
  'Cash',
  'Bank transfer',
  'Card',
  'OPay',
  'Moniepoint',
  'Palmpay',
  'Kuda',
  'USSD',
  'Mobile money',
  'Split payments',
]

/** The sale note cycles through a few recent sales so the product feels in use */
const sales = [
  { amount: '₦485,000', detail: 'iPhone 13 128GB · Transfer' },
  { amount: '₦25,000', detail: 'Phone case and charger · Cash' },
  { amount: '₦210,000', detail: 'AirPods Pro · Card' },
]
const { paused, toggle } = useMarketingMotion()
const tick = ref(0)
const sale = computed(() => sales[tick.value % sales.length]!)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => {
    if (!document.hidden && !paused.value) tick.value += 1
  }, 3200)
})

onBeforeUnmount(() => clearInterval(timer))
</script>
