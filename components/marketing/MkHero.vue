<template>
  <section ref="heroRef" class="mkh" aria-labelledby="home-title">
    <div class="mkh__bg" aria-hidden="true">
      <span class="mkh__grid" />
      <span class="mkh__aura mkh__aura--a" />
      <span class="mkh__aura mkh__aura--b" />
    </div>

    <div class="mk-container mkh__copy">
      <NuxtLink to="/#assistant" class="mkh__announce mkh-in" style="--i: 0">
        <span class="mkh__announce-tag"><Sparkles :size="12" aria-hidden="true" />New</span>
        <span
          >Meet Storvv Assistant<span class="mkh__announce-more"
            >, your shop's AI analyst</span
          ></span
        >
        <ArrowRight :size="14" aria-hidden="true" class="mkh__announce-arrow" />
      </NuxtLink>

      <h1 id="home-title" class="mkh__title mkh-in" style="--i: 1">
        <span class="ds-sr-only">Run your shop without the guesswork.</span>
        <span aria-hidden="true" class="mkh__line">
          Run your
          <span class="mkh__rotator" :style="wordWidth ? { width: `${wordWidth}px` } : undefined">
            <span ref="sizerRef" class="mkh__sizer">{{ shopWord }}</span>
            <Transition name="mkh-word">
              <span :key="shopWord" class="mkh__word">{{ shopWord }}</span>
            </Transition>
          </span>
        </span>
        <span aria-hidden="true" class="mkh__line mkh__line--muted">without the guesswork.</span>
      </h1>

      <p class="mkh__lede mkh-in" style="--i: 2">
        Inventory, sales, receipts, customers and staff in one fast workspace. Know what's on every
        shelf and what came through the till, in real time, from any device.
      </p>

      <div class="mkh__actions mkh-in" style="--i: 3">
        <SButton variant="primary" size="lg" class="mk-btn mkh__cta" :to="appUrl">
          Start free
          <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
        </SButton>
        <SButton variant="secondary" size="lg" class="mk-btn" to="/demo/dashboard">
          <template #leading><Play :size="14" aria-hidden="true" /></template>
          Try the live demo
        </SButton>
      </div>

      <ul class="mkh__proof mkh-in" style="--i: 4" aria-label="Good to know">
        <li><Check :size="14" aria-hidden="true" />Free forever for one store</li>
        <li><Check :size="14" aria-hidden="true" />No card needed</li>
        <li><Check :size="14" aria-hidden="true" />Set up in minutes</li>
      </ul>
    </div>

    <div class="mk-container mkh__stage-wrap mkh-in" style="--i: 5">
      <div
        class="mkh__stage"
        :style="{ '--tilt': tilt.toFixed(4), '--px': px.toFixed(4), '--py': py.toFixed(4) }"
      >
        <div class="mkh__screen">
          <MkFrame
            src="/marketing/app/overview.webp"
            alt="The Storvv dashboard showing today's revenue, sales, top products and low-stock alerts"
            url="app.storvv.com/dashboard"
            eager
          />
        </div>

        <div class="mkh__card mkh__card--sale" style="--d: 1.2" aria-hidden="true">
          <span class="mkh__card-icon mkh__card-icon--success"><ReceiptText :size="16" /></span>
          <span class="mkh__stack">
            <Transition name="mkh-swap">
              <span :key="sale.amount" class="mkh__card-body">
                <span class="mkh__card-title">Sale completed · {{ sale.amount }}</span>
                <span class="mkh__card-text">{{ sale.detail }}</span>
              </span>
            </Transition>
          </span>
        </div>

        <div class="mkh__card mkh__card--revenue" style="--d: -0.8" aria-hidden="true">
          <div class="mkh__rev-head">
            <span class="mkh__live"><span class="mkh__live-dot" />Live · Lagos</span>
            <span class="mkh__chip mkh__chip--success"><TrendingUp :size="11" />+18%</span>
          </div>
          <p class="mkh__rev-value">₦{{ revenue.toLocaleString('en-NG') }}</p>
          <div class="mkh__bars">
            <span v-for="(h, i) in bars" :key="i" :style="{ '--h': h, '--bi': i }" />
          </div>
        </div>

        <div class="mkh__card mkh__card--stock" style="--d: 0.9" aria-hidden="true">
          <span class="mkh__card-icon mkh__card-icon--warning"><PackageMinus :size="16" /></span>
          <span class="mkh__card-body">
            <span class="mkh__card-title">Low stock · AirPods Pro</span>
            <span class="mkh__card-text">2 left at Ikeja branch</span>
          </span>
        </div>

        <div class="mkh__card mkh__card--assistant" style="--d: -1.3" aria-hidden="true">
          <span class="mkh__ai-q"><Sparkles :size="12" />What sold best this week?</span>
          <span class="mkh__ai-a">
            iPhone 13 cases. <strong>64 sold</strong>, up 22% on last week.
          </span>
        </div>
      </div>
    </div>

    <MkMarquee />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowRight,
  Check,
  PackageMinus,
  Play,
  ReceiptText,
  Sparkles,
  TrendingUp,
} from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkMarquee from '~/components/marketing/MkMarquee.vue'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'

const appUrl = useMarketingAppUrl()

const shopWords = ['boutique', 'phone shop', 'mini-mart', 'pharmacy', 'supermarket', 'gadget store']
const sales = [
  { amount: '₦25,000', detail: 'Receipt sent on WhatsApp', add: 25000 },
  { amount: '₦485,000', detail: 'iPhone 13 · Paid by transfer', add: 485000 },
  { amount: '₦12,500', detail: 'Split between cash and card', add: 12500 },
]
const barSets = [
  [0.42, 0.55, 0.48, 0.7, 0.62, 0.84, 0.76],
  [0.5, 0.46, 0.66, 0.58, 0.8, 0.72, 0.92],
  [0.38, 0.6, 0.52, 0.74, 0.68, 0.78, 1],
]

const tick = ref(0)
const shopWord = computed(() => shopWords[tick.value % shopWords.length]!)
const sale = computed(() => sales[tick.value % sales.length]!)
const bars = computed(() => barSets[tick.value % barSets.length]!)
const revenue = computed(() => {
  let total = 1_240_000
  for (let i = 0; i < tick.value; i++) total += sales[i % sales.length]!.add
  return total
})

/** 1 = tilted back (page top), 0 = flat (scrolled into view). Lerped for a smooth glide. */
const tilt = ref(1)
const px = ref(0)
const py = ref(0)
const heroRef = ref<HTMLElement | null>(null)
const sizerRef = ref<HTMLElement | null>(null)
const wordWidth = ref(0)

function measureWord() {
  if (sizerRef.value) wordWidth.value = sizerRef.value.getBoundingClientRect().width
}

watch(shopWord, () => nextTick(measureWord))

let ticker: ReturnType<typeof setInterval> | undefined
let frame = 0
let targetTilt = 1
let targetPx = 0
let targetPy = 0

function kick() {
  if (!frame) frame = requestAnimationFrame(loop)
}

function onScroll() {
  targetTilt = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.55))
  kick()
}

function onPointer(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  targetPx = (e.clientX / window.innerWidth - 0.5) * 2
  targetPy = (e.clientY / window.innerHeight - 0.5) * 2
  kick()
}

function loop() {
  tilt.value += (targetTilt - tilt.value) * 0.12
  px.value += (targetPx - px.value) * 0.08
  py.value += (targetPy - py.value) * 0.08
  const settled =
    Math.abs(targetTilt - tilt.value) < 0.001 &&
    Math.abs(targetPx - px.value) < 0.001 &&
    Math.abs(targetPy - py.value) < 0.001
  frame = settled ? 0 : requestAnimationFrame(loop)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tilt.value = 0
    return
  }
  onScroll()
  tilt.value = targetTilt
  document.fonts?.ready.then(measureWord)
  window.addEventListener('resize', measureWord, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  heroRef.value?.addEventListener('pointermove', onPointer, { passive: true })
  ticker = setInterval(() => {
    if (!document.hidden) tick.value += 1
  }, 2800)
})

onBeforeUnmount(() => {
  clearInterval(ticker)
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measureWord)
  heroRef.value?.removeEventListener('pointermove', onPointer)
})
</script>
