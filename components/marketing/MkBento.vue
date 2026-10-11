<template>
  <section
    id="features-live"
    ref="sectionRef"
    class="mk-section mkb"
    :data-live="live ? '' : undefined"
    aria-labelledby="mkb-title"
  >
    <div class="mk-container">
      <MkSectionHead
        title-id="mkb-title"
        eyebrow="One workspace"
        title="Your whole shop."
        accent="Live, in one place."
        lede="Every sale updates stock, receipts, customers and reports the moment it happens, across every branch and every device."
      />

      <div class="mkb__grid">
        <!-- Inventory -->
        <article class="mkb__card mkb__card--inventory mk-reveal" style="--i: 0">
          <header class="mkb__head">
            <span class="mkb__icon"><Boxes :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Real-time inventory</h3>
              <p class="mkb__text">
                Stock counts drop the second a sale goes through, with low-stock alerts before you
                run out.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-inv" aria-hidden="true">
            <div class="mkb-inv__row mkb-inv__row--head">
              <span>Product</span><span>Branch</span><span>In stock</span>
            </div>
            <div
              v-for="(item, i) in stock"
              :key="item.name"
              class="mkb-inv__row"
              :class="{ 'is-hit': hitIndex === i }"
            >
              <span class="mkb-inv__name">
                <span class="mkb-inv__thumb" :style="{ '--hue': item.hue }" />{{ item.name }}
              </span>
              <span class="mkb-inv__branch">{{ item.branch }}</span>
              <span class="mkb-inv__qty">
                <span class="mkh__stack">
                  <Transition name="mkb-num">
                    <span :key="item.qty">{{ item.qty }}</span>
                  </Transition>
                </span>
                <span v-if="item.qty <= 3" class="mkb__chip mkb__chip--warning">Low</span>
              </span>
            </div>
          </div>
        </article>

        <!-- WhatsApp receipts -->
        <article class="mkb__card mkb__card--receipts mk-reveal" style="--i: 1">
          <header class="mkb__head">
            <span class="mkb__icon"><MessageCircle :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Receipts on WhatsApp</h3>
              <p class="mkb__text">
                Branded receipts land in your customer's chat. No printer, no paper.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-wa" aria-hidden="true">
            <div :key="tick" class="mkb-wa__bubble">
              <p class="mkb-wa__store">Ade's Gadgets · Receipt #{{ 1042 + tick }}</p>
              <div class="mkb-wa__line"><span>iPhone 13 case</span><span>₦8,500</span></div>
              <div class="mkb-wa__line"><span>USB-C charger</span><span>₦16,500</span></div>
              <div class="mkb-wa__line mkb-wa__line--total">
                <span>Total</span><span>₦25,000</span>
              </div>
              <span class="mkb-wa__meta">
                10:{{ String(24 + (tick % 30)).padStart(2, '0') }}
                <CheckCheck :size="14" class="mkb-wa__ticks" />
              </span>
            </div>
          </div>
        </article>

        <!-- Branches -->
        <article class="mkb__card mkb__card--branches mk-reveal" style="--i: 2">
          <header class="mkb__head">
            <span class="mkb__icon"><GitBranch :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Every branch, in sync</h3>
              <p class="mkb__text">
                Move stock between stores and see each branch's numbers side by side.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-net" aria-hidden="true">
            <svg viewBox="0 0 280 150" class="mkb-net__svg" focusable="false">
              <path class="mkb-net__path" d="M140 75 L44 32" />
              <path class="mkb-net__path" d="M140 75 L236 32" />
              <path class="mkb-net__path" d="M140 75 L140 132" />
              <path class="mkb-net__flow" d="M140 75 L44 32" />
              <path class="mkb-net__flow mkb-net__flow--b" d="M236 32 L140 75" />
              <path class="mkb-net__flow mkb-net__flow--c" d="M140 75 L140 132" />
            </svg>
            <span class="mkb-net__hub"><Store :size="16" /></span>
            <span class="mkb-net__node mkb-net__node--a">Ikeja</span>
            <span class="mkb-net__node mkb-net__node--b">Lekki</span>
            <span class="mkb-net__node mkb-net__node--c">Abuja</span>
          </div>
        </article>

        <!-- Buybacks -->
        <article class="mkb__card mkb__card--buybacks mk-reveal" style="--i: 3">
          <header class="mkb__head">
            <span class="mkb__icon"><Repeat :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Buybacks and stock loans</h3>
              <p class="mkb__text">
                Take trade-ins, lend stock to other shops, and keep every unit accounted for.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-flow" aria-hidden="true">
            <div
              v-for="(s, i) in buybackSteps"
              :key="s.title"
              class="mkb-flow__step"
              :class="{ 'is-done': i < buybackStep, 'is-active': i === buybackStep }"
            >
              <span class="mkb-flow__dot"><Check :size="12" /></span>
              <span class="mkb-staff__who">
                <span class="mkb-staff__name">{{ s.title }}</span>
                <span class="mkb-staff__role">{{ s.text }}</span>
              </span>
            </div>
          </div>
        </article>

        <!-- Staff -->
        <article class="mkb__card mkb__card--staff mk-reveal" style="--i: 4">
          <header class="mkb__head">
            <span class="mkb__icon"><ShieldCheck :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Staff roles that fit</h3>
              <p class="mkb__text">
                Cashiers sell, managers restock, you see everything. Every action is logged.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-staff" aria-hidden="true">
            <div v-for="(p, i) in staff" :key="p.name" class="mkb-staff__row">
              <span class="mkb-staff__avatar" :style="{ '--hue': p.hue }">{{ p.name[0] }}</span>
              <span class="mkb-staff__who">
                <span class="mkb-staff__name">{{ p.name }}</span>
                <span class="mkb-staff__role">{{ p.role }}</span>
              </span>
              <span class="mkb-staff__perm">{{ p.perm }}</span>
              <span class="mkb-toggle" :class="{ 'is-on': p.on !== (tick % staff.length === i) }" />
            </div>
          </div>
        </article>

        <!-- Analytics -->
        <article class="mkb__card mkb__card--analytics mk-reveal" style="--i: 5">
          <header class="mkb__head">
            <span class="mkb__icon"><ChartColumn :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Analytics that explain</h3>
              <p class="mkb__text">
                Best sellers, slow movers, peak hours and profit, without a spreadsheet.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-chart" aria-hidden="true">
            <div class="mkb-chart__head">
              <span class="mkb-chart__value">₦8.4m</span>
              <span class="mkb__chip mkb__chip--success"
                ><TrendingUp :size="11" />+24% this month</span
              >
            </div>
            <div class="mkb-chart__bars">
              <span
                v-for="(h, i) in chart"
                :key="i"
                :style="{ '--h': h, '--bi': i }"
                :class="{ 'is-peak': i === chart.length - 1 }"
              />
            </div>
          </div>
        </article>

        <!-- Customers -->
        <article class="mkb__card mkb__card--customers mk-reveal" style="--i: 6">
          <header class="mkb__head">
            <span class="mkb__icon"><Users :size="18" aria-hidden="true" /></span>
            <div>
              <h3 class="mkb__title">Customers and balances</h3>
              <p class="mkb__text">
                Know who owes what, record part-payments, and follow up on sales leads.
              </p>
            </div>
          </header>
          <div class="mkb__ui mkb-cust" aria-hidden="true">
            <div
              v-for="(c, i) in customers"
              :key="c.name"
              class="mkb-cust__row"
              :class="{ 'is-paid': paidIndex === i }"
            >
              <span class="mkb-staff__avatar" :style="{ '--hue': c.hue }">{{ c.name[0] }}</span>
              <span class="mkb-staff__who">
                <span class="mkb-staff__name">{{ c.name }}</span>
                <span class="mkb-staff__role">{{ c.note }}</span>
              </span>
              <span class="mkb-cust__amount">{{ paidIndex === i ? '₦0' : c.owes }}</span>
              <span
                class="mkb__chip"
                :class="paidIndex === i ? 'mkb__chip--success' : 'mkb__chip--muted'"
              >
                {{ paidIndex === i ? 'Paid' : 'Owes' }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Boxes,
  Check,
  ChartColumn,
  CheckCheck,
  GitBranch,
  MessageCircle,
  ShieldCheck,
  Repeat,
  Store,
  TrendingUp,
  Users,
} from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const sectionRef = ref<HTMLElement | null>(null)
const live = ref(false)
const tick = ref(0)

const stock = ref([
  { name: 'AirPods Pro', branch: 'Ikeja', qty: 6, hue: 210 },
  { name: 'iPhone 13 case', branch: 'Lekki', qty: 48, hue: 160 },
  { name: 'Samsung A15', branch: 'Abuja', qty: 12, hue: 260 },
  { name: 'USB-C charger', branch: 'Ikeja', qty: 31, hue: 30 },
])
const hitIndex = ref(-1)

const buybackSteps = [
  { title: 'iPhone 11 · 128GB traded in', text: 'From Chidi Okeke' },
  { title: 'Checked and priced', text: 'Grade B · ₦180,000' },
  { title: 'Back on the shelf', text: 'Added to Ikeja stock' },
]
const buybackStep = computed(() => (live.value ? tick.value % (buybackSteps.length + 1) : 0))

const staff = [
  { name: 'Amaka', role: 'Manager', perm: 'Edit stock', on: true, hue: 330 },
  { name: 'Tunde', role: 'Cashier', perm: 'Give discounts', on: false, hue: 200 },
  { name: 'Ifeoma', role: 'Cashier', perm: 'View reports', on: false, hue: 140 },
]

const customers = [
  { name: 'Chidi Okeke', note: 'Paid ₦40,000 of ₦100,000', owes: '₦60,000', hue: 20 },
  { name: 'Bisi Adeyemi', note: 'Laptop on part-payment', owes: '₦145,000', hue: 280 },
  { name: 'Musa Bello', note: 'Lead · wants 10 units', owes: '₦32,500', hue: 180 },
]
const paidIndex = computed(() => (live.value ? tick.value % customers.length : -1))

const chart = [0.38, 0.52, 0.46, 0.64, 0.58, 0.72, 0.68, 0.84, 0.78, 1]

let ticker: ReturnType<typeof setInterval> | undefined
let observer: IntersectionObserver | null = null
let reduced = false

function step() {
  if (document.hidden) return
  tick.value += 1
  const i = Math.floor(Math.random() * stock.value.length)
  const item = stock.value[i]!
  item.qty = item.qty <= 2 ? item.qty + 24 : item.qty - 1 - Math.floor(Math.random() * 2)
  hitIndex.value = i
}

function start() {
  if (ticker || reduced) return
  ticker = setInterval(step, 3200)
}

function stop() {
  clearInterval(ticker)
  ticker = undefined
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    live.value = true
    return
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      live.value = !!entry?.isIntersecting
      if (live.value) start()
      else stop()
    },
    { threshold: 0.15 }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
})
</script>
