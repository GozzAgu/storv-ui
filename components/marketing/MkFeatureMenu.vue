<template>
  <div
    ref="rootEl"
    class="mkm"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusout="onFocusOut"
  >
    <button
      ref="triggerEl"
      type="button"
      class="mk-nav-link mkm__trigger"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      Features
      <ChevronDown :size="14" class="mkm__chevron" aria-hidden="true" />
    </button>

    <Transition name="mkm">
      <div v-if="open" :id="panelId" class="mkm__panel">
        <div class="mkm__main">
          <NuxtLink to="/features" class="mkm__heading" @click="close()">
            Feature overview
            <ArrowRight :size="20" aria-hidden="true" />
          </NuxtLink>
          <p class="mkm__lede">
            Everything a shop runs on, from the stock room to the till to the daily report.
          </p>
          <ul class="mkm__grid">
            <li v-for="item in features" :key="item.title">
              <NuxtLink
                :to="item.to"
                class="mkm__item"
                :class="`mk-tint--${item.tint}`"
                @click="close()"
              >
                <component
                  :is="item.icon"
                  :size="20"
                  :stroke-width="1.75"
                  class="mkm__icon"
                  aria-hidden="true"
                />
                <span class="mkm__title">{{ item.title }}</span>
                <span class="mkm__text">{{ item.text }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="mkm__side">
          <p class="mkm__side-heading">Built in</p>
          <p class="mkm__lede">No add-ons to buy or connect.</p>
          <ul class="mkm__list">
            <li v-for="item in builtIn" :key="item.label" class="mkm__list-item">
              <component :is="item.icon" :size="18" :stroke-width="1.75" aria-hidden="true" />
              {{ item.label }}
            </li>
          </ul>
          <NuxtLink to="/demo/dashboard" class="mkm__demo" @click="close()">
            Try the live demo
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  HandCoins,
  MessageCircle,
  ReceiptText,
  ScanBarcode,
  UserCog,
  Wallet,
  WifiOff,
} from '@lucide/vue'

const route = useRoute()
const panelId = useId()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

const features = [
  {
    icon: Boxes,
    title: 'Inventory',
    tint: 'sand',
    text: "Know what's on every shelf, by category, serial or IMEI.",
    to: '/features?area=inventory#explore',
  },
  {
    icon: ReceiptText,
    title: 'Sales and receipts',
    tint: 'peach',
    text: 'Ring up a sale in seconds and send the receipt on WhatsApp.',
    to: '/features?area=sales#explore',
  },
  {
    icon: HandCoins,
    title: 'Customers and balances',
    tint: 'rose',
    text: 'Deposits, part payments and who still owes you.',
    to: '/features?area=sales#explore',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    tint: 'sky',
    text: 'Revenue, top products and stock value at a glance.',
    to: '/features?area=insights#explore',
  },
  {
    icon: UserCog,
    title: 'Team and roles',
    tint: 'lilac',
    text: 'Decide who can edit stock, give discounts or see reports.',
    to: '/features?area=team#explore',
  },
  {
    icon: Building2,
    title: 'Branches and transfers',
    tint: 'sage',
    text: 'Every branch under one login, with stock moving between them.',
    to: '/features?area=branches#explore',
  },
]

const builtIn = [
  { icon: MessageCircle, label: 'WhatsApp and PDF receipts' },
  { icon: FileSpreadsheet, label: 'Excel import and export' },
  { icon: ScanBarcode, label: 'Camera barcode scanning' },
  { icon: WifiOff, label: 'Offline selling' },
  { icon: Wallet, label: 'Cash, transfer, OPay, Moniepoint and more' },
]

function close(returnFocus = false) {
  if (!open.value) return
  open.value = false
  if (returnFocus) triggerEl.value?.focus()
}

/* Hover opens it with a mouse; touch and keyboard use the button */
function onEnter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  clearTimeout(leaveTimer)
  open.value = true
}

function onLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => (open.value = false), 150)
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && rootEl.value?.contains(next)) return
  open.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  const hadFocus = rootEl.value?.contains(document.activeElement)
  close(!!hadFocus)
}

function onDocumentPointerdown(event: PointerEvent) {
  if (!rootEl.value?.contains(event.target as Node)) close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', onDocumentKeydown)
    document.addEventListener('pointerdown', onDocumentPointerdown)
  } else {
    document.removeEventListener('keydown', onDocumentKeydown)
    document.removeEventListener('pointerdown', onDocumentPointerdown)
  }
})

watch(
  () => route.fullPath,
  () => (open.value = false)
)

onBeforeUnmount(() => {
  clearTimeout(leaveTimer)
  document.removeEventListener('keydown', onDocumentKeydown)
  document.removeEventListener('pointerdown', onDocumentPointerdown)
})
</script>
