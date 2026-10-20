<template>
  <section
    id="product"
    ref="sectionRef"
    class="mk-section mkb"
    :data-live="live ? '' : undefined"
    aria-labelledby="mkb-title"
  >
    <div class="mk-container">
      <MkSectionHead
        title-id="mkb-title"
        eyebrow="Core capabilities"
        title="Built for the way you sell."
        accent="Trade-ins, part payments and all."
      >
        <NuxtLink to="/features" class="mk-link mkb__more">
          See every feature
          <ArrowRight :size="16" aria-hidden="true" />
        </NuxtLink>
      </MkSectionHead>

      <ul class="mkb__grid">
        <li class="mkb__card mk-reveal" style="--i: 0">
          <div class="mkb__ui mkb-off" aria-hidden="true">
            <div class="mkb-off__status" :class="{ 'is-online': online }">
              <component :is="online ? Wifi : WifiOff" :size="16" />
              {{ online ? 'Back online · 3 sales synced' : 'Offline · 3 sales saved here' }}
            </div>
            <div v-for="s in offlineSales" :key="s.id" class="mkb-off__row">
              <span class="mkb-staff__who">
                <span class="mkb-staff__name">{{ s.id }}</span>
                <span class="mkb-staff__role">{{ s.item }}</span>
              </span>
              <span class="mkb-off__state">
                <CheckCheck v-if="online" :size="14" />
                <Clock v-else :size="14" />
              </span>
            </div>
          </div>
          <div class="mkb__body">
            <h3 class="mkb__title">Keeps selling offline</h3>
            <p class="mkb__text">
              Sales made without internet are saved on the device and recorded when you're back
              online.
            </p>
          </div>
        </li>

        <li class="mkb__card mk-reveal" style="--i: 1">
          <div class="mkb__ui mkb-wa" aria-hidden="true">
            <div :key="tick" class="mkb-wa__bubble">
              <p class="mkb-wa__store">Ade's Gadgets · #{{ 1042 + tick }}</p>
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
          <div class="mkb__body">
            <h3 class="mkb__title">Receipts on WhatsApp</h3>
            <p class="mkb__text">Send the receipt to the customer's WhatsApp, or share a PDF.</p>
          </div>
        </li>

        <li class="mkb__card mk-reveal" style="--i: 2">
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
                <span class="mkb-staff__role">{{ paidIndex === i ? 'Paid in full' : 'Owes' }}</span>
              </span>
              <span class="mkb-cust__amount">{{ paidIndex === i ? '₦0' : c.owes }}</span>
            </div>
          </div>
          <div class="mkb__body">
            <h3 class="mkb__title">Part payments and balances</h3>
            <p class="mkb__text">See who owes what, take deposits and record each payment.</p>
          </div>
        </li>

        <li class="mkb__card mk-reveal" style="--i: 3">
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
          <div class="mkb__body">
            <h3 class="mkb__title">Trade-ins and buybacks</h3>
            <p class="mkb__text">Take a device in, grade and price it, and put it back on sale.</p>
          </div>
        </li>

        <li class="mkb__card mk-reveal" style="--i: 4">
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
          <div class="mkb__body">
            <h3 class="mkb__title">Every branch, one login</h3>
            <p class="mkb__text">Switch branch in a tap and compare how each one is selling.</p>
          </div>
        </li>

        <li class="mkb__card mk-reveal" style="--i: 5">
          <div class="mkb__ui mkb-staff" aria-hidden="true">
            <div v-for="(p, i) in staff" :key="p.name" class="mkb-staff__row">
              <span class="mkb-staff__avatar" :style="{ '--hue': p.hue }">{{ p.name[0] }}</span>
              <span class="mkb-staff__who">
                <span class="mkb-staff__name">{{ p.name }}</span>
                <span class="mkb-staff__role">{{ p.perm }}</span>
              </span>
              <span class="mkb-toggle" :class="{ 'is-on': p.on !== (tick % staff.length === i) }" />
            </div>
          </div>
          <div class="mkb__body">
            <h3 class="mkb__title">Staff roles</h3>
            <p class="mkb__text">Decide who can edit stock, give discounts or see reports.</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, Check, CheckCheck, Clock, Store, Wifi, WifiOff } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const sectionRef = ref<HTMLElement | null>(null)
const live = ref(false)
const tick = ref(0)

const offlineSales = [
  { id: 'Sale #1041', item: 'AirPods Pro · Cash' },
  { id: 'Sale #1042', item: 'USB-C charger · Transfer' },
  { id: 'Sale #1043', item: 'iPhone 13 case · Cash' },
]
const online = computed(() => live.value && tick.value % 2 === 1)

const buybackSteps = [
  { title: 'iPhone 11 · 128GB traded in', text: 'From Chidi Okeke' },
  { title: 'Checked and priced', text: 'Grade B · ₦180,000' },
  { title: 'Back on the shelf', text: 'Added to Ikeja stock' },
]
const buybackStep = computed(() => (live.value ? tick.value % (buybackSteps.length + 1) : 0))

const staff = [
  { name: 'Amaka', perm: 'Edit stock', on: true, hue: 330 },
  { name: 'Tunde', perm: 'Give discounts', on: false, hue: 200 },
  { name: 'Ifeoma', perm: 'View reports', on: false, hue: 140 },
]

const customers = [
  { name: 'Chidi Okeke', owes: '₦60,000', hue: 20 },
  { name: 'Bisi Adeyemi', owes: '₦145,000', hue: 280 },
  { name: 'Musa Bello', owes: '₦32,500', hue: 180 },
]
const paidIndex = computed(() => (live.value ? tick.value % customers.length : -1))

let ticker: ReturnType<typeof setInterval> | undefined
let observer: IntersectionObserver | null = null
let reduced = false

function step() {
  if (!document.hidden) tick.value += 1
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
