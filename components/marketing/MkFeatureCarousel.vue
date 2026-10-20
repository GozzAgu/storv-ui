<template>
  <section class="mk-section mkc" aria-labelledby="mkc-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mkc-title"
        :level="level"
        title="Powerful tools,"
        accent="simple to use."
        lede="Built for busy counters: every screen does one job well, so new staff pick it up on their first shift."
        align="start"
      />

      <ul ref="trackEl" class="mkc__track" @scroll.passive="update">
        <li v-for="card in cards" :key="card.title" class="mkc__card">
          <div class="mkc__visual">
            <img
              :src="card.src"
              :alt="card.alt"
              width="1440"
              height="900"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="mkc__body">
            <h3 class="mkc__title">{{ card.title }}</h3>
            <p class="mkc__text">{{ card.text }}</p>
            <NuxtLink :to="card.to" class="mk-link mkc__link">
              Read more<span class="ds-sr-only"> about {{ card.title.toLowerCase() }}</span>
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </li>
      </ul>

      <div class="mkc__controls">
        <button
          type="button"
          class="mkc__arrow"
          aria-label="Previous features"
          :disabled="atStart"
          @click="scrollBy(-1)"
        >
          <ChevronLeft :size="20" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="mkc__arrow"
          aria-label="More features"
          :disabled="atEnd"
          @click="scrollBy(1)"
        >
          <ChevronRight :size="20" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, ChevronLeft, ChevronRight } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

withDefaults(defineProps<{ level?: 'h1' | 'h2' }>(), { level: 'h2' })

const cards = [
  {
    title: 'Inventory',
    text: "See what's on every shelf, by category, serial or IMEI, with low-stock alerts.",
    to: '/features?area=inventory#explore',
    src: '/marketing/app/inventory.webp',
    alt: 'Storvv inventory with categories, stock value and a low-stock flag',
  },
  {
    title: 'Sales and receipts',
    text: 'Ring up a sale in seconds, split the payment and send the receipt on WhatsApp.',
    to: '/features?area=sales#explore',
    src: '/marketing/app/sales.webp',
    alt: 'Storvv sales with receipts, totals, payment method and status',
  },
  {
    title: 'Customers and balances',
    text: 'Take deposits and part payments, and always know who still owes you.',
    to: '/features?area=sales#explore',
    src: '/marketing/app/customers.webp',
    alt: 'Storvv customers with orders, total spent and the balance owed',
  },
  {
    title: 'Reports',
    text: "Today's revenue, best sellers and stock value at a glance.",
    to: '/features?area=insights#explore',
    src: '/marketing/app/overview.webp',
    alt: 'Storvv overview with revenue, a 12-month chart and best-selling products',
  },
  {
    title: 'Team and roles',
    text: 'Group staff into departments and decide what each person can see and do.',
    to: '/features?area=team#explore',
    src: '/marketing/app/team.webp',
    alt: 'Storvv team screen with departments, staff counts and managers',
  },
  {
    title: 'Branches and transfers',
    text: 'Run every branch from one login and move stock between them with approvals.',
    to: '/features?area=branches#explore',
    src: '/marketing/app/branches.webp',
    alt: 'Storvv transfers with routes between branches and their approval status',
  },
]

const trackEl = ref<HTMLElement | null>(null)
const atStart = ref(true)
const atEnd = ref(false)

function update() {
  const el = trackEl.value
  if (!el) return
  atStart.value = el.scrollLeft <= 4
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
}

function scrollBy(direction: 1 | -1) {
  const el = trackEl.value
  const card = el?.querySelector<HTMLElement>('.mkc__card')
  if (!el || !card) return
  const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollBy({ left: direction * step, behavior: reduce ? 'auto' : 'smooth' })
}

onMounted(() => {
  update()
  window.addEventListener('resize', update, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('resize', update))
</script>
