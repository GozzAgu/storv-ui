<template>
  <section class="mk-section mks" aria-labelledby="mk-setup-title">
    <div class="mk-container mks__grid">
      <div class="mks__copy">
        <MkSectionHead
          title-id="mk-setup-title"
          align="start"
          eyebrow="Get started"
          title="Up and running"
          accent="before your next customer."
          lede="No installs, no hardware, no training day. Three steps and you're taking sales."
        />

        <ol class="mks__steps" aria-label="Setup steps">
          <li v-for="(step, i) in steps" :key="step.id">
            <button
              type="button"
              class="mks__step"
              :class="{ 'is-active': active === i, 'is-done': i < active }"
              :aria-current="active === i ? 'step' : undefined"
              @click="go(i)"
            >
              <span class="mks__num">
                <Check v-if="i < active" :size="14" aria-hidden="true" />
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="mks__step-body">
                <span class="mks__step-title">
                  {{ step.title }}
                  <span class="mks__time"
                    ><Clock :size="12" aria-hidden="true" />{{ step.time }}</span
                  >
                </span>
                <span class="mks__step-text">{{ step.text }}</span>
                <span class="mks__track" aria-hidden="true">
                  <span
                    v-if="active === i"
                    :key="cycle"
                    class="mks__fill"
                    :class="{ 'is-paused': paused }"
                    @animationend="advance"
                  />
                </span>
              </span>
            </button>
          </li>
        </ol>

        <div class="mks__cta">
          <SButton variant="primary" class="mk-btn" :to="appUrl">
            Start free
            <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
          </SButton>
          <span class="mks__total"
            ><Timer :size="16" aria-hidden="true" />Ready in about 10 minutes</span
          >
        </div>
      </div>

      <div
        class="mks__window mk-reveal"
        aria-hidden="true"
        @mouseenter="paused = true"
        @mouseleave="paused = false"
      >
        <div class="mks__bar">
          <span class="mk-frame__dots"><span /><span /><span /></span>
          <span class="mks__url">app.storvv.com/{{ current.path }}</span>
        </div>
        <div class="mks__app">
          <nav class="mks__side">
            <span class="mks__logo" />
            <span
              v-for="item in sideNav"
              :key="item.id"
              class="mks__nav"
              :class="{ 'is-on': item.id === current.nav }"
            >
              <component :is="item.icon" :size="14" />
              <span>{{ item.label }}</span>
            </span>
          </nav>

          <div class="mks__main">
            <Transition name="mks-swap" mode="out-in">
              <!-- 1. Create your store -->
              <div v-if="current.id === 'store'" key="store" class="mks__screen">
                <p class="mks__h">
                  Create your store <span class="mkp__chip mkp__chip--success">Free</span>
                </p>
                <label class="mks__field mks-in" style="--i: 0">
                  <span class="mks__label">Store name</span>
                  <span class="mks__input">Ada's Gadgets<span class="mk-caret" /></span>
                </label>
                <div class="mks__field mks-in" style="--i: 1">
                  <span class="mks__label">What do you sell?</span>
                  <span class="mks__chips">
                    <span class="mks__chip is-on"><Check :size="12" />Gadgets</span>
                    <span class="mks__chip">Fashion</span>
                    <span class="mks__chip">Groceries</span>
                    <span class="mks__chip">Pharmacy</span>
                  </span>
                </div>
                <div class="mks__field mks-in" style="--i: 2">
                  <span class="mks__label">Currency</span>
                  <span class="mks__input">₦ Nigerian naira</span>
                </div>
                <span class="mks__button mks-in" style="--i: 3">
                  Create store<ArrowRight :size="14" />
                </span>
              </div>

              <!-- 2. Add your stock -->
              <div v-else-if="current.id === 'stock'" key="stock" class="mks__screen">
                <p class="mks__h">
                  <span class="mks__crumb"><FolderOpen :size="14" />Phones</span>
                  <span class="mks__button mks__button--sm"><Plus :size="12" />Add item</span>
                </p>
                <div
                  v-for="(item, i) in stock"
                  :key="item.name"
                  class="mks__row mks-in"
                  :class="{ 'is-low': item.low }"
                  :style="{ '--i': i }"
                >
                  <span class="mks__thumb"><component :is="item.icon" :size="14" /></span>
                  <span class="mks__row-main">
                    <span class="mks__row-title">{{ item.name }}</span>
                    <span class="mks__row-sub">{{ item.price }}</span>
                  </span>
                  <span
                    class="mkp__chip"
                    :class="item.low ? 'mkp__chip--warning' : 'mkp__chip--success'"
                  >
                    {{ item.qty }}
                  </span>
                </div>
              </div>

              <!-- 3. Start selling -->
              <div v-else key="sell" class="mks__screen">
                <p class="mks__h">
                  New sale <span class="mkp__chip mkp__chip--success">Paid</span>
                </p>
                <div class="mks__row mks-in" style="--i: 0">
                  <span class="mks__thumb"><Smartphone :size="14" /></span>
                  <span class="mks__row-main">
                    <span class="mks__row-title">iPhone 13 128GB</span>
                    <span class="mks__row-sub">1 × ₦485,000</span>
                  </span>
                </div>
                <div class="mks__total-row mks-in" style="--i: 1">
                  <span>Total · Bank transfer</span>
                  <strong>₦485,000</strong>
                </div>
                <div class="mks__row mks-in" style="--i: 2">
                  <span class="mks__thumb mks__thumb--success"><Send :size="14" /></span>
                  <span class="mks__row-main">
                    <span class="mks__row-title">Receipt sent</span>
                    <span class="mks__row-sub">On WhatsApp to Chioma Eze</span>
                  </span>
                  <Check :size="16" class="mks__ok" />
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <Transition name="mks-toast" mode="out-in">
          <div :key="current.id" class="mks__toast">
            <span class="mks__toast-icon"><component :is="current.result.icon" :size="16" /></span>
            <span class="mks__row-main">
              <span class="mks__toast-title">{{ current.result.title }}</span>
              <span class="mks__toast-text">{{ current.result.text }}</span>
            </span>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  Clock,
  FolderOpen,
  Headphones,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Send,
  Settings,
  Smartphone,
  Store,
  Timer,
  TrendingUp,
  Watch,
} from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'

const appUrl = useMarketingAppUrl()

const steps = [
  {
    id: 'store',
    title: 'Create your store',
    time: '1 min',
    text: 'Name it, pick what you sell. Micro is free forever.',
    path: 'setup',
    nav: 'settings',
    result: { icon: Store, title: 'Your store is live', text: 'Micro plan · Free' },
  },
  {
    id: 'stock',
    title: 'Add your stock',
    time: '5 min',
    text: 'Type it in or import a spreadsheet. Track by quantity or serial.',
    path: 'inventory',
    nav: 'inventory',
    result: { icon: Boxes, title: '₦5.95m in stock', text: '20 units tracked' },
  },
  {
    id: 'sell',
    title: 'Start selling',
    time: 'Instant',
    text: 'Ring up a sale, send the receipt, watch the numbers move.',
    path: 'sales/new',
    nav: 'sales',
    result: { icon: TrendingUp, title: '+₦485,000 today', text: 'Stock updated automatically' },
  },
]

const sideNav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'sales', label: 'Sales', icon: ReceiptText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const stock = [
  { icon: Smartphone, name: 'iPhone 13 128GB', price: '₦485,000', qty: '6 in stock', low: false },
  { icon: Headphones, name: 'AirPods Pro', price: '₦210,000', qty: '12 in stock', low: false },
  { icon: Watch, name: 'Apple Watch SE', price: '₦260,000', qty: '2 left', low: true },
]

const active = ref(0)
const cycle = ref(0)
const current = computed(() => steps[active.value]!)
const paused = ref(false)

function go(i: number) {
  active.value = i
  cycle.value += 1
}

function advance() {
  go((active.value + 1) % steps.length)
}
</script>
