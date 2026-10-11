<template>
  <section class="mk-section mk-section--tight-top" aria-labelledby="mk-intro-title">
    <div class="mk-container">
      <div class="mk-intro mk-reveal">
        <header class="mk-intro__title">
          <p class="mk-eyebrow mk-intro__eyebrow">Who it's for</p>
          <h2 id="mk-intro-title" class="mk-h2">
            One workspace,
            <em class="mk-serif">however you sell.</em>
          </h2>
        </header>
        <div class="mk-intro__aside">
          <p class="mk-intro__text">
            Stock, sales, receipts and customers in one dashboard, built for the way your trade
            actually works.
          </p>
          <NuxtLink to="/demo/dashboard" class="mk-link">
            Try the live demo
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <div ref="showRef" class="mk-show mk-reveal" :class="{ 'mk-show--live': inView }">
        <div class="mk-show__tabs" role="tablist" aria-label="Businesses that run on Storvv">
          <button
            v-for="(trade, i) in trades"
            :id="`mk-show-tab-${i}`"
            :key="trade.label"
            ref="tabRefs"
            type="button"
            role="tab"
            class="mk-show__tab"
            :class="{ 'mk-show__tab--active': active === i }"
            :aria-selected="active === i"
            aria-controls="mk-show-panel"
            :tabindex="active === i ? 0 : -1"
            @click="active = i"
            @keydown="onKeydown"
          >
            <span class="mk-show__index" aria-hidden="true">{{ pad(i + 1) }}</span>
            <span class="mk-show__icon" aria-hidden="true">
              <component :is="trade.icon" :size="16" :stroke-width="1.75" />
            </span>
            <span class="mk-show__copy">
              <span class="mk-show__label">{{ trade.label }}</span>
              <span class="mk-show__desc"
                ><span>{{ trade.desc }}</span></span
              >
            </span>
            <span class="mk-show__track" aria-hidden="true">
              <span v-if="active === i" :key="cycle" class="mk-show__fill" @animationend="next" />
            </span>
          </button>
        </div>

        <div
          id="mk-show-panel"
          class="mk-show__stage"
          role="tabpanel"
          :aria-labelledby="`mk-show-tab-${active}`"
        >
          <img
            v-for="(trade, i) in trades"
            :key="trade.src"
            class="mk-show__img"
            :class="{ 'mk-show__img--active': active === i }"
            :src="trade.src"
            :alt="active === i ? trade.alt : ''"
            :aria-hidden="active !== i"
            width="864"
            height="1152"
            loading="lazy"
            decoding="async"
          />

          <span class="mk-show__count" aria-hidden="true">
            {{ pad(active + 1) }} / {{ pad(trades.length) }}
          </span>

          <div class="mk-show__hud">
            <Transition name="mk-show-swap" mode="out-in">
              <div :key="current.label" class="mk-show__hud-inner">
                <span class="mk-show__hud-icon" aria-hidden="true">
                  <component :is="current.icon" :size="18" :stroke-width="1.75" />
                </span>
                <div class="mk-show__hud-body">
                  <p class="mk-show__hud-title">{{ current.label }}</p>
                  <ul class="mk-show__tags">
                    <li v-for="tag in current.tags" :key="tag">{{ tag }}</li>
                  </ul>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, Car, PackageCheck, ShoppingBasket, Smartphone, Tv } from '@lucide/vue'

const trades = [
  {
    src: '/marketing/people/car-dealer.webp',
    label: 'Car dealers',
    icon: Car,
    desc: 'Take deposits, track every vehicle and follow up on leads.',
    tags: ['Deposits', 'Sales leads'],
    alt: 'A smiling car dealer holding up a key fob and a tablet in front of a white SUV in his showroom',
  },
  {
    src: '/marketing/people/gadget-store.webp',
    label: 'Gadget stores',
    icon: Smartphone,
    desc: 'Track each phone by IMEI and handle trade-ins and buybacks.',
    tags: ['IMEI tracking', 'Buybacks'],
    alt: 'A gadget store attendant showing a smartwatch to a customer across a table of phones',
  },
  {
    src: '/marketing/people/electronics.webp',
    label: 'Electronics',
    icon: Tv,
    desc: 'Serial numbers on every unit and part payments that stay in sync.',
    tags: ['Serial numbers', 'Part payments'],
    alt: 'An electronics store owner holding a tablet beside shelves of TVs and boxed speakers',
  },
  {
    src: '/marketing/people/supermarket.webp',
    label: 'Supermarkets',
    icon: ShoppingBasket,
    desc: 'Fast checkout and alerts before the shelves run empty.',
    tags: ['Low-stock alerts', 'Fast checkout'],
    alt: 'A supermarket manager scanning stock on a shelf of fresh produce',
  },
  {
    src: '/marketing/people/procurement.webp',
    label: 'Procurement',
    icon: PackageCheck,
    desc: 'Move stock between branches and lend it out with a clear record.',
    tags: ['Transfers', 'Stock loans'],
    alt: 'A procurement officer checking an order on a tablet beside pallets of cartons in a warehouse',
  },
]

const active = ref(1)
const cycle = ref(0)
const inView = ref(false)
const showRef = ref<HTMLElement | null>(null)
const tabRefs = ref<HTMLButtonElement[]>([])
const current = computed(() => trades[active.value]!)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function next() {
  active.value = (active.value + 1) % trades.length
  cycle.value += 1
}

function onKeydown(event: KeyboardEvent) {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  active.value = (active.value + step + trades.length) % trades.length
  void nextTick(() => tabRefs.value[active.value]?.focus())
}

let observer: IntersectionObserver | undefined

onMounted(() => {
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(([entry]) => (inView.value = !!entry?.isIntersecting), {
    threshold: 0.35,
  })
  if (showRef.value) observer.observe(showRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>
