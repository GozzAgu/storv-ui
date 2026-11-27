<template>
  <section class="mkh" :class="{ 'is-paused': paused }" aria-labelledby="home-title">
    <!-- The stage: a matte shop photo that runs up behind the header -->
    <div class="mkh__stage">
      <img
        class="mkh__photo"
        :src="PHOTO(1600)"
        :srcset="`${PHOTO(1000)} 1000w, ${PHOTO(1600)} 1600w`"
        sizes="100vw"
        alt=""
        fetchpriority="high"
        decoding="async"
      />
      <div class="mk-container">
        <div class="mkh__copy">
          <!-- One real word in the heading for search engines and screen readers; it changes for the eye -->
          <h1 id="home-title" class="mkh__title mkh-in" style="--i: 0">
            <span class="mkh__title-line">Sell and track stock</span>
            <span class="mkh__title-line">
              in every
              <span
                class="mkh__word"
                :style="{ width: wordWidths[word] ? `${wordWidths[word]}px` : undefined }"
              >
                <Transition name="mkh-word" mode="out-in">
                  <span :key="word" class="mkh__word-text"
                    >{{ word }}.<svg
                      class="mkh__swash"
                      viewBox="0 0 200 16"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 11 C 45 4, 110 3, 197 8" pathLength="1" /></svg
                  ></span>
                </Transition>
              </span>
            </span>
          </h1>
          <!-- Invisible copies in the heading's type, measured so the word's slot eases to each width -->
          <div ref="measureEl" class="mkh__title mkh__word-measure" aria-hidden="true">
            <span v-for="w in words" :key="w" :data-word="w" class="mkh__word-text">{{ w }}.</span>
          </div>

          <p class="mkh__lede mkh-in" style="--i: 1">
            Point of sale and inventory for gadget stores, supermarkets and dealers. Every sale
            updates your <mark>stock</mark>, <mark>receipts</mark> and <mark>balances</mark> at
            once.
          </p>

          <div class="mkh__actions mkh-in" style="--i: 2">
            <NuxtLink :to="signupUrl" class="mk-cta-btn" data-mk-primary>
              Create your free store
            </NuxtLink>
          </div>
          <p class="mkh__walk mkh-in" style="--i: 3">
            Want a guided tour?
            <button type="button" @click="walkthrough.open('landing_hero')">
              Book a walkthrough
              <ArrowRight :size="14" :stroke-width="2" aria-hidden="true" />
            </button>
          </p>
          <MkTrustStrip class="mkh__trust mkh-in" style="--i: 3" />
        </div>
      </div>
    </div>

    <div class="mk-container">
      <!-- Everything a shop runs, wired into one place -->
      <div class="mkh__hub mkh-in" style="--i: 4">
        <p class="ds-sr-only">
          Storvv brings together cash, transfers, card and mobile money, barcode scanning, receipts
          on WhatsApp, printing, spreadsheet imports and every branch.
        </p>
        <div class="mkh__hub-canvas" aria-hidden="true">
          <svg class="mkh__lines" :viewBox="`0 0 ${W} ${H}`" focusable="false">
            <defs>
              <linearGradient
                id="mkh-line"
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="1200"
                y1="0"
                y2="0"
              >
                <stop offset="0" stop-color="currentColor" stop-opacity="0" />
                <stop offset="0.5" stop-color="currentColor" stop-opacity="0.55" />
                <stop offset="1" stop-color="currentColor" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path v-for="line in lines" :key="line.id" :d="line.d" class="mkh__line" />
            <path
              v-for="(line, index) in pulses"
              :key="`p${line.id}`"
              :d="line.d"
              pathLength="1"
              class="mkh__pulse"
              :style="{ '--pulse-delay': `${index * -0.9}s` }"
            />
          </svg>

          <span class="mkh__core" :style="{ left: '50%', top: `${(CY / H) * 100}%` }">
            <img src="/brand/storvv-symbol.png" alt="" width="44" height="44" />
          </span>

          <span
            v-for="tile in tiles"
            :key="tile.label"
            class="mkh__tile"
            :class="{ 'mkh__tile--outer': tile.outer }"
            :style="{
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              '--tile': tile.color,
              '--tile-size': `${tile.size}px`,
              '--tilt': `${tile.tilt}deg`,
              '--float-delay': `${tile.delay}s`,
            }"
            :title="tile.label"
          >
            <component :is="tile.icon" :size="Math.round(tile.size * 0.44)" :stroke-width="2.25" />
          </span>
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

      <!-- The trades Storvv is built for, as a numbered index -->
      <div class="mks">
        <div class="mks__head">
          <p id="mkh-proof-label" class="mks__label">Built for shops that sell</p>
          <p class="mks__count" aria-hidden="true">{{ trades.length }} trades · one workspace</p>
        </div>
        <ul class="mks__grid" aria-labelledby="mkh-proof-label">
          <li v-for="(trade, i) in trades" :key="trade.label" class="mks__item">
            <span class="mks__top" aria-hidden="true">
              <span class="mks__num">{{ String(i + 1).padStart(2, '0') }}</span>
              <StorvvIcon :name="trade.icon" :size="26" class="mks__icon" />
            </span>
            <span class="mks__name">{{ trade.label }}</span>
            <span class="mks__line">{{ trade.line }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Hero photo: a finger tapping a tablet point of sale (Unsplash, free licence), kept in
 * public/marketing. It sits under frosted glass, so 1600px covers even large screens.
 */
const PHOTO = (w: 1000 | 1600) => `/marketing/hero-pos-${w}.webp`

import {
  ArrowRight,
  Banknote,
  CreditCard,
  FileSpreadsheet,
  Landmark,
  MessageCircle,
  Pause,
  Play,
  Printer,
  ScanBarcode,
  Store,
  Wallet,
} from '~/icons'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import StorvvIcon from '~/components/brand/StorvvIcon.vue'
import type { StorvvIconName } from '~/utils/storvv-icons'
import { useMarketingMotion } from '~/composables/useMarketingMotion'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'
import { useWalkthrough } from '~/composables/useWalkthrough'
import MkTrustStrip from '~/components/marketing/MkTrustStrip.vue'

const signupUrl = useMarketingSignupUrl()
const walkthrough = useWalkthrough()
const { paused, toggle } = useMarketingMotion()

/* Every sector Storvv's category kinds cover (utils/category-kinds.ts), with real examples */
const trades = [
  {
    icon: 'phone' as StorvvIconName,
    label: 'Phones & gadgets',
    line: 'Phone shops, laptops, accessories, gaming',
  },
  {
    icon: 'tv' as StorvvIconName,
    label: 'Electronics & appliances',
    line: 'TVs, home appliances, solar and power',
  },
  {
    icon: 'basket' as StorvvIconName,
    label: 'Food & drink',
    line: 'Supermarkets, provisions, bakeries, restaurants',
  },
  {
    icon: 'shirt' as StorvvIconName,
    label: 'Fashion & beauty',
    line: 'Boutiques, shoes, cosmetics, perfumes, hair',
  },
  {
    icon: 'pill' as StorvvIconName,
    label: 'Pharmacy & health',
    line: 'Medicines, medical supplies, wellness',
  },
  {
    icon: 'hammer' as StorvvIconName,
    label: 'Building & hardware',
    line: 'Tools, paints, electrical, plumbing',
  },
  {
    icon: 'car' as StorvvIconName,
    label: 'Auto & transport',
    line: 'Car dealers, auto parts, motorcycles, fuel',
  },
  {
    icon: 'sofa' as StorvvIconName,
    label: 'Home & furniture',
    line: 'Furniture, decor, kitchen, bedding',
  },
  {
    icon: 'book' as StorvvIconName,
    label: 'Books, office & school',
    line: 'Bookshops, stationery, printing, uniforms',
  },
  {
    icon: 'gift' as StorvvIconName,
    label: 'Kids, sports & gifts',
    line: 'Toys, baby items, sports, music, gifts',
  },
  {
    icon: 'sprout' as StorvvIconName,
    label: 'Farm, pets & garden',
    line: 'Agro supplies, pet shops, plants',
  },
  {
    icon: 'boxes' as StorvvIconName,
    label: 'Wholesale & procurement',
    line: 'Distributors, bulk stock, multi-site supply',
  },
]

/*
 * The hub: lines fan out from Storvv in the middle to both edges, and each tool sits on one of
 * them. Everything is in viewBox units, so the tiles land on their lines at any width.
 */
const W = 1200
const H = 460
const CX = W / 2
const CY = 250
const SPOKES = 9

type Side = 'left' | 'right'

function spokeEnd(index: number) {
  return 24 + index * ((H - 48) / (SPOKES - 1))
}

function spokePath(side: Side, index: number) {
  const x = side === 'left' ? 0 : W
  const bend = side === 'left' ? -1 : 1
  const y = spokeEnd(index)
  return `M${CX} ${CY} C${CX + bend * 200} ${CY} ${CX + bend * 350} ${y} ${x} ${y}`
}

/** Point `t` (0 at Storvv, 1 at the edge) along a spoke, as percentages of the canvas. */
function spokePoint(side: Side, index: number, t: number) {
  const bend = side === 'left' ? -1 : 1
  const y = spokeEnd(index)
  const xs = [CX, CX + bend * 200, CX + bend * 350, side === 'left' ? 0 : W]
  const ys = [CY, CY, y, y]
  const u = 1 - t
  const at = (p: number[]) =>
    u * u * u * p[0]! + 3 * u * u * t * p[1]! + 3 * u * t * t * p[2]! + t * t * t * p[3]!
  return { x: (at(xs) / W) * 100, y: (at(ys) / H) * 100 }
}

const lines = (['left', 'right'] as const).flatMap((side) =>
  Array.from({ length: SPOKES }, (_, index) => ({
    id: `${side}${index}`,
    d: spokePath(side, index),
  }))
)

/** A few lines carry a spark running in to Storvv */
const pulses = lines.filter((_, index) => index % 3 === 1)

/*
 * Solid, saturated tiles in the colours people already know these tools by, at slightly
 * different sizes and tilts so the row reads as hand-placed rather than generated.
 */
const tiles = [
  {
    label: 'Cash',
    icon: Banknote,
    color: '#16a34a',
    side: 'left',
    spoke: 1,
    t: 0.78,
    size: 54,
    tilt: -8,
    outer: true,
  },
  {
    label: 'Bank transfer',
    icon: Landmark,
    color: '#2563eb',
    side: 'left',
    spoke: 2,
    t: 0.46,
    size: 60,
    tilt: 4,
  },
  {
    label: 'Barcode scanning',
    icon: ScanBarcode,
    color: '#7c3aed',
    side: 'left',
    spoke: 7,
    t: 0.52,
    size: 56,
    tilt: -5,
  },
  {
    label: 'Spreadsheet import',
    icon: FileSpreadsheet,
    color: '#0f7b45',
    side: 'left',
    spoke: 8,
    t: 0.8,
    size: 50,
    tilt: 7,
    outer: true,
  },
  {
    label: 'Receipt printing',
    icon: Printer,
    color: '#1f2937',
    side: 'left',
    spoke: 4,
    t: 0.9,
    size: 48,
    tilt: -3,
    outer: true,
  },
  {
    label: 'Card payments',
    icon: CreditCard,
    color: '#f97316',
    side: 'right',
    spoke: 0,
    t: 0.82,
    size: 52,
    tilt: 6,
    outer: true,
  },
  {
    label: 'WhatsApp receipts',
    icon: MessageCircle,
    color: '#22c55e',
    side: 'right',
    spoke: 2,
    t: 0.52,
    size: 60,
    tilt: -6,
  },
  {
    label: 'Every branch',
    icon: Store,
    color: '#e11d48',
    side: 'right',
    spoke: 6,
    t: 0.42,
    size: 56,
    tilt: 5,
  },
  {
    label: 'Mobile money',
    icon: Wallet,
    color: '#f59e0b',
    side: 'right',
    spoke: 7,
    t: 0.74,
    size: 52,
    tilt: -7,
    outer: true,
  },
].map((tile, index) => ({
  ...tile,
  ...spokePoint(tile.side as Side, tile.spoke, tile.t),
  delay: -index * 0.8,
}))

/* The last word of the headline cycles through the places a shop keeps stock */
const words = ['branch', 'shop', 'warehouse', 'showroom']
const wordIndex = ref(0)
const word = computed(() => words[wordIndex.value % words.length]!)
const measureEl = ref<HTMLElement | null>(null)
const wordWidths = ref<Record<string, number>>({})
let wordTimer: ReturnType<typeof setInterval> | undefined

function measureWords() {
  const widths: Record<string, number> = {}
  measureEl.value?.querySelectorAll<HTMLElement>('[data-word]').forEach((el) => {
    widths[el.dataset.word!] = el.offsetWidth
  })
  wordWidths.value = widths
}

onMounted(() => {
  measureWords()
  document.fonts?.ready.then(measureWords)
  window.addEventListener('resize', measureWords, { passive: true })
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  wordTimer = setInterval(() => {
    if (!document.hidden && !paused.value) wordIndex.value += 1
  }, 2800)
})

onBeforeUnmount(() => {
  clearInterval(wordTimer)
  window.removeEventListener('resize', measureWords)
})
</script>
