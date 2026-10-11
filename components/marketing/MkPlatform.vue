<template>
  <section
    id="product"
    ref="sectionRef"
    class="mk-section mk-section--alt mkp"
    aria-labelledby="mk-platform-title"
  >
    <div class="mk-container mkp__grid">
      <div class="mkp__copy">
        <MkSectionHead
          title-id="mk-platform-title"
          align="start"
          eyebrow="The platform"
          title="Everything the counter needs."
          accent="Nothing it doesn't."
          lede="Ring up one sale and Storvv does the rest. Stock, the customer's balance, the receipt and today's numbers all update on their own."
        />

        <ul class="mkp__questions">
          <li
            v-for="(node, i) in nodes"
            :key="node.id"
            class="mkp__question mk-reveal"
            :class="{ 'is-active': litIndex === i }"
            :style="{ '--i': i }"
          >
            <span class="mkp__q-icon"
              ><component :is="node.icon" :size="16" aria-hidden="true"
            /></span>
            <span>
              <span class="mkp__q-title">{{ node.q }}</span>
              <span class="mkp__q-text">{{ node.a }}</span>
            </span>
          </li>
        </ul>

        <NuxtLink to="/features" class="mk-link">
          See every feature
          <ArrowRight :size="16" aria-hidden="true" />
        </NuxtLink>
      </div>

      <div class="mkp__stage mk-reveal" aria-hidden="true">
        <svg class="mkp__wires" viewBox="0 0 560 480" preserveAspectRatio="none" focusable="false">
          <path
            v-for="(node, i) in nodes"
            :key="node.id"
            class="mkp__wire"
            :class="{ 'is-lit': phase > i }"
            :d="node.wire"
          />
        </svg>

        <div class="mkp__sale" :class="{ 'is-pop': phase === 0 }">
          <span class="mkp__sale-head">
            <span class="mkp__sale-icon"><ReceiptText :size="16" /></span>
            New sale
            <span class="mkp__chip mkp__chip--success">Paid</span>
          </span>
          <span class="mkh__stack">
            <Transition name="mkh-swap">
              <span :key="sale.amount" class="mkp__sale-body">
                <span class="mkp__sale-amount">{{ sale.amount }}</span>
                <span class="mkp__sale-item">{{ sale.item }}</span>
              </span>
            </Transition>
          </span>
        </div>

        <div
          v-for="(node, i) in nodes"
          :key="node.id"
          class="mkp__node"
          :class="[`mkp__node--${node.id}`, { 'is-lit': phase > i }]"
        >
          <span class="mkp__node-icon"><component :is="node.icon" :size="16" /></span>
          <span class="mkp__node-body">
            <span class="mkp__node-label">{{ node.label }}</span>
            <span class="mkp__node-value">{{ node.value(sale) }}</span>
          </span>
          <Check :size="14" class="mkp__node-check" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  HandCoins,
  MessageCircle,
  ReceiptText,
} from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

interface Sale {
  amount: string
  item: string
  left: number
  customer: string
}

const sales: Sale[] = [
  { amount: '₦25,000', item: 'iPhone 13 case · Cash', left: 5, customer: 'Chidi Okeke' },
  { amount: '₦485,000', item: 'iPhone 13 128GB · Transfer', left: 2, customer: 'Bisi Adeyemi' },
  { amount: '₦210,000', item: 'AirPods Pro · Card', left: 11, customer: 'Musa Bello' },
]

const nodes = [
  {
    id: 'stock',
    icon: Boxes,
    label: 'Stock',
    value: (s: Sale) => `−1 · ${s.left} left`,
    q: 'Where did that stock go?',
    a: 'Every unit in every branch, counted the moment it sells.',
    wire: 'M280 240 C 200 240, 170 90, 110 90',
  },
  {
    id: 'customer',
    icon: HandCoins,
    label: 'Customer',
    value: (s: Sale) => `${s.customer.split(' ')[0]} · +1 visit`,
    q: 'Who still owes me?',
    a: 'Balances and part-payments on every customer, always current.',
    wire: 'M280 240 C 360 240, 390 90, 450 90',
  },
  {
    id: 'receipt',
    icon: MessageCircle,
    label: 'Receipt',
    value: () => 'Sent on WhatsApp',
    q: 'Did they get a receipt?',
    a: 'Branded receipts on WhatsApp or print, sent in one tap.',
    wire: 'M280 240 C 200 240, 170 390, 110 390',
  },
  {
    id: 'report',
    icon: BarChart3,
    label: 'Today',
    value: (s: Sale) => `+${s.amount}`,
    q: 'How much did we make today?',
    a: 'Revenue, profit and best sellers, live, per branch.',
    wire: 'M280 240 C 360 240, 390 390, 450 390',
  },
]

const PHASES = nodes.length + 3
const sectionRef = ref<HTMLElement | null>(null)
const phase = ref(nodes.length + 1)
const round = ref(0)
const sale = computed(() => sales[round.value % sales.length]!)
const litIndex = computed(() => Math.min(phase.value, nodes.length) - 1)

let timer: ReturnType<typeof setInterval> | undefined
let observer: IntersectionObserver | null = null

function step() {
  if (document.hidden) return
  if (phase.value + 1 >= PHASES) {
    phase.value = 0
    round.value += 1
  } else {
    phase.value += 1
  }
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  phase.value = 0
  observer = new IntersectionObserver(
    ([entry]) => {
      clearInterval(timer)
      timer = entry?.isIntersecting ? setInterval(step, 900) : undefined
    },
    { threshold: 0.2 }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  observer?.disconnect()
})
</script>
