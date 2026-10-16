<template>
  <section id="product" ref="sectionRef" class="mk-section mkp" aria-labelledby="mk-platform-title">
    <div class="mk-container">
      <div class="mkp__panel mkp__panel--tight">
        <div class="mkp__grid">
          <div class="mkp__copy">
            <MkSectionHead
              title-id="mk-platform-title"
              align="start"
              eyebrow="The platform"
              title="One sale."
              accent="Everything updates."
              lede="Stock, balance, receipt and today's numbers, the moment you ring it up."
            />

            <NuxtLink to="/features" class="mkp__link">
              See every feature
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>

          <div class="mkp__stage mk-reveal" aria-hidden="true">
            <span class="mkp__orbit" />
            <svg
              class="mkp__wires"
              viewBox="0 0 560 480"
              preserveAspectRatio="none"
              focusable="false"
            >
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
                <span class="mkp__sale-icon"><ReceiptText :size="14" /></span>
                New sale
                <span class="mkp__chip">Paid</span>
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
              <span class="mkp__node-icon"><component :is="node.icon" :size="15" /></span>
              <span class="mkp__node-body">
                <span class="mkp__node-label">{{ node.label }}</span>
                <span class="mkp__node-value">{{ node.value(sale) }}</span>
              </span>
              <Check :size="14" class="mkp__node-check" />
            </div>
          </div>
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
    wire: 'M280 240 C 200 240, 170 90, 110 90',
  },
  {
    id: 'customer',
    icon: HandCoins,
    label: 'Customer',
    value: (s: Sale) => `${s.customer.split(' ')[0]} · +1 visit`,
    wire: 'M280 240 C 360 240, 390 90, 450 90',
  },
  {
    id: 'receipt',
    icon: MessageCircle,
    label: 'Receipt',
    value: () => 'Sent on WhatsApp',
    wire: 'M280 240 C 200 240, 170 390, 110 390',
  },
  {
    id: 'report',
    icon: BarChart3,
    label: 'Today',
    value: (s: Sale) => `+${s.amount}`,
    wire: 'M280 240 C 360 240, 390 390, 450 390',
  },
]

const PHASES = nodes.length + 3
const sectionRef = ref<HTMLElement | null>(null)
const phase = ref(nodes.length + 1)
const round = ref(0)
const sale = computed(() => sales[round.value % sales.length]!)

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
