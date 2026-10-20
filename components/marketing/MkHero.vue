<template>
  <section ref="heroRef" class="mkh" aria-labelledby="home-title">
    <div class="mkh__panel mkh-in" style="--i: 0">
      <div class="mkh__bg" aria-hidden="true">
        <span class="mkh__wash" />
        <span class="mkh__ring">
          <span class="mkh__emblem">
            <span class="mkh__emblem-wave" />
            <span class="mkh__emblem-wave" style="--wave: 1" />
            <span class="mkh__emblem-wave" style="--wave: 2" />
            <StorvvMark :size="56" />
            <span class="mkh__emblem-status" />
            <span class="mkh__live-tag">
              <span class="mkh__live-tag-title">Always online</span>
              <Transition name="mkh-live" mode="out-in">
                <span :key="liveLine" class="mkh__live-tag-line">{{ liveLine }}</span>
              </Transition>
            </span>
          </span>
        </span>
        <span class="mkh__grain" />
      </div>

      <div class="mkh__copy">
        <NuxtLink to="/features" class="mkh__announce mkh-in" style="--i: 1">
          <Sparkles :size="12" aria-hidden="true" />
          <span
            >New: keep selling when the internet drops<span class="mkh__announce-more"
              >, it syncs when you're back</span
            ></span
          >
        </NuxtLink>

        <h1 id="home-title" class="mkh__title mkh-in" style="--i: 2">
          <span class="mkh__line">Sell and track stock</span>
          <span class="mkh__line">in every <em class="mkh__serif">branch.</em></span>
        </h1>

        <p class="mkh__lede mkh-in" style="--i: 3">
          Storvv is the point of sale and inventory system for gadget stores, electronics shops,
          supermarkets and dealers. Ring up a sale and your stock, receipts and customer balances
          update at once.
        </p>

        <div class="mkh__actions mkh-in" style="--i: 4">
          <NuxtLink :to="signupUrl" class="mkh__btn mkh__btn--primary">
            Create your free store
          </NuxtLink>
          <NuxtLink to="/demo/dashboard" class="mkh__demo">
            or try the live demo <Play :size="12" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
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

        <div class="mkh__card mkh__card--transfer" style="--d: -1.3" aria-hidden="true">
          <span class="mkh__card-icon mkh__card-icon--accent"><ArrowLeftRight :size="16" /></span>
          <span class="mkh__card-body">
            <span class="mkh__card-title">Transfer received · 12 units</span>
            <span class="mkh__card-text">Ikeja → Lekki · stock updated</span>
          </span>
        </div>
      </div>
    </div>

    <MkMarquee />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeftRight, PackageMinus, Play, ReceiptText, Sparkles, TrendingUp } from '@lucide/vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkMarquee from '~/components/marketing/MkMarquee.vue'
import StorvvMark from '~/components/shell/StorvvMark.vue'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'

const signupUrl = useMarketingSignupUrl()

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

const liveLines = [
  '24/7 across every branch',
  'Syncing every branch',
  'Saving every sale',
  'Watching your stock',
]

const tick = ref(0)
const liveLine = computed(() => liveLines[tick.value % liveLines.length]!)
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
  heroRef.value?.removeEventListener('pointermove', onPointer)
})
</script>
