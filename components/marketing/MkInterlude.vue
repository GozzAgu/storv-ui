<template>
  <div
    class="mkl"
    :class="[`mkl--${variant}`, { 'is-still': still }]"
    role="img"
    :aria-label="label"
  >
    <!-- A sale's journey: stock, the sale, the receipt, the money, the report, gliding along a wave -->
    <svg
      v-if="variant === 'journey'"
      ref="svgEl"
      class="mkl__svg"
      viewBox="0 0 1200 170"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path class="mkl__track" :d="WAVE" />
      <g v-for="(token, i) in journey" :key="token.label" :class="`mk-tint--${token.tint}`">
        <animateMotion
          :dur="`${JOURNEY_SECONDS}s`"
          :begin="`-${(JOURNEY_SECONDS / journey.length) * i}s`"
          repeatCount="indefinite"
          :path="WAVE"
          calcMode="linear"
        />
        <g class="mkl__bob" :style="{ '--bob-delay': `${-i * 0.7}s` }">
          <rect class="mkl__pill" x="-26" y="-26" :width="token.width" height="52" rx="26" />
          <component
            :is="token.icon"
            x="-12"
            y="-12"
            :size="24"
            :stroke-width="1.75"
            class="mkl__ink"
          />
          <text class="mkl__label" x="22" y="5">{{ token.label }}</text>
        </g>
      </g>
    </svg>

    <!-- Little moments from a shop's day, drifting past in two directions -->
    <div v-else-if="variant === 'notes'" class="mkl__notes">
      <div
        v-for="(row, r) in noteRows"
        :key="r"
        class="mkl__lane"
        :class="{ 'mkl__lane--back': r === 1 }"
      >
        <ul v-for="copy in 2" :key="copy" class="mkl__row" aria-hidden="true">
          <li
            v-for="note in row"
            :key="note.title"
            class="mkl__note"
            :class="`mk-tint--${note.tint}`"
          >
            <span class="mkl__note-icon"
              ><component :is="note.icon" :size="16" :stroke-width="2"
            /></span>
            <span class="mkl__note-body">
              <span class="mkl__note-title">{{ note.title }}</span>
              <span class="mkl__note-text">{{ note.text }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Branches trading stock: parcels travel along the routes between three shops -->
    <svg
      v-else
      ref="svgEl"
      class="mkl__svg"
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path v-for="route in routes" :key="route.id" class="mkl__track" :d="route.d" />
      <g v-for="(parcel, i) in parcels" :key="i" :class="`mk-tint--${parcel.tint}`">
        <animateMotion
          :dur="`${parcel.seconds}s`"
          :begin="`-${parcel.offset}s`"
          repeatCount="indefinite"
          :path="routes[parcel.route]!.d"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.45 0 0.55 1"
        />
        <rect class="mkl__pill" x="-17" y="-17" width="34" height="34" rx="10" />
        <component :is="parcel.icon" x="-9" y="-9" :size="18" :stroke-width="2" class="mkl__ink" />
      </g>
      <g
        v-for="branch in branches"
        :key="branch.name"
        :transform="`translate(${branch.x} ${branch.y})`"
      >
        <circle class="mkl__ping" r="30">
          <animate
            attributeName="r"
            values="30;46"
            dur="2.8s"
            :begin="`-${branch.delay}s`"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0"
            dur="2.8s"
            :begin="`-${branch.delay}s`"
            repeatCount="indefinite"
          />
        </circle>
        <rect class="mkl__branch" x="-74" y="-28" width="148" height="56" rx="18" />
        <Store x="-56" y="-11" :size="22" :stroke-width="1.75" class="mkl__branch-icon" />
        <text class="mkl__branch-name" x="-26" y="-1">{{ branch.name }}</text>
        <text class="mkl__branch-meta" x="-26" y="16">{{ branch.meta }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  Boxes,
  CheckCheck,
  HandCoins,
  MessageCircle,
  Package,
  PackagePlus,
  ReceiptText,
  Repeat,
  ScanBarcode,
  Store,
  Wallet,
} from '@lucide/vue'
import { useMarketingMotion, useSvgMotion } from '~/composables/useMarketingMotion'

const props = withDefaults(defineProps<{ variant?: 'journey' | 'notes' | 'branches' }>(), {
  variant: 'journey',
})

const LABELS = {
  journey:
    'Illustration: stock, a sale, its receipt, the payment and the report moving along one line',
  notes: 'Illustration: everyday updates from a shop, such as receipts sent and stock updated',
  branches: 'Illustration: stock moving between the Ikeja, Lekki and Abuja branches',
}
const label = LABELS[props.variant]

const svgEl = ref<SVGSVGElement | null>(null)
const { still } = useMarketingMotion()
useSvgMotion(svgEl)

const WAVE = 'M -160 96 C 80 30, 260 150, 470 92 S 860 26, 1060 92 S 1300 140, 1380 96'
const JOURNEY_SECONDS = 30

const journey = [
  { icon: PackagePlus, label: 'Stock in', tint: 'sand', width: 152 },
  { icon: ScanBarcode, label: 'Scanned', tint: 'lilac', width: 150 },
  { icon: ReceiptText, label: 'Sold', tint: 'peach', width: 120 },
  { icon: MessageCircle, label: 'Receipt sent', tint: 'sky', width: 186 },
  { icon: HandCoins, label: 'Paid', tint: 'rose', width: 118 },
  { icon: BarChart3, label: 'In the report', tint: 'sage', width: 194 },
]

const noteRows = [
  [
    { icon: CheckCheck, title: 'Receipt sent', text: 'On WhatsApp · ₦25,000', tint: 'sky' },
    { icon: Boxes, title: 'Stock updated', text: 'iPhone 13 · 13 left', tint: 'sand' },
    { icon: HandCoins, title: 'Balance cleared', text: 'Ada paid ₦120,000', tint: 'rose' },
    { icon: Repeat, title: 'Trade-in priced', text: 'iPhone 11 · ₦180,000', tint: 'lilac' },
    { icon: BarChart3, title: 'Best day this week', text: '₦1.2m in sales', tint: 'sage' },
  ],
  [
    {
      icon: ArrowLeftRight,
      title: 'Transfer approved',
      text: 'Ikeja → Lekki · 12 units',
      tint: 'sage',
    },
    { icon: BellRing, title: 'Low stock', text: 'AirPods Pro · 2 left', tint: 'peach' },
    { icon: Wallet, title: 'Split payment', text: 'Cash + transfer', tint: 'sky' },
    { icon: ReceiptText, title: 'Quick sale', text: 'Phone case · ₦8,500', tint: 'sand' },
    { icon: MessageCircle, title: 'Receipt sent', text: 'PDF to Musa', tint: 'lilac' },
  ],
]

const branches = [
  { name: 'Ikeja', meta: '214 items', x: 190, y: 150, delay: 0 },
  { name: 'Lekki', meta: '168 items', x: 600, y: 62, delay: 0.9 },
  { name: 'Abuja', meta: '96 items', x: 1010, y: 150, delay: 1.8 },
]

const routes = [
  { id: 'ikeja-lekki', d: 'M 264 136 C 360 70, 430 50, 526 62' },
  { id: 'lekki-abuja', d: 'M 674 62 C 770 50, 840 70, 936 136' },
  { id: 'abuja-ikeja', d: 'M 936 168 C 760 222, 440 222, 264 168' },
]

const parcels = [
  { route: 0, seconds: 6, offset: 0, icon: Package, tint: 'sand' },
  { route: 0, seconds: 6, offset: 3, icon: Package, tint: 'peach' },
  { route: 1, seconds: 6.5, offset: 1.2, icon: Package, tint: 'sky' },
  { route: 1, seconds: 6.5, offset: 4.4, icon: Package, tint: 'lilac' },
  { route: 2, seconds: 9, offset: 2, icon: Package, tint: 'sage' },
  { route: 2, seconds: 9, offset: 6.5, icon: Package, tint: 'rose' },
]
</script>
