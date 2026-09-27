<template>
  <div class="price-page">
    <!-- Hero -->
    <section class="price-hero" aria-labelledby="pricing-hero-title">
      <div class="price-hero__grid-bg" aria-hidden="true" />
      <div class="price-hero__orb price-hero__orb--a" aria-hidden="true" />
      <div class="price-hero__orb price-hero__orb--b" aria-hidden="true" />

      <div class="price-hero__inner">
        <p class="price-eyebrow price-eyebrow--dark">
          <Tag class="h-3.5 w-3.5" aria-hidden="true" />
          Pricing
        </p>
        <h1 id="pricing-hero-title" class="price-hero__title">
          Start free.
          <span class="price-hero__accent">Grow when you're ready.</span>
        </h1>
        <p class="price-hero__lede">
          Micro is free forever for one store. Upgrade to Medium or Enterprise when you open another
          branch or want deeper insights. Cancel any time in Settings.
        </p>

        <div class="price-cycle" role="group" aria-label="Billing cycle">
          <span
            class="price-cycle__thumb"
            :style="{ transform: `translateX(${cycleIndex * 100}%)` }"
            aria-hidden="true"
          />
          <button
            v-for="cycle in SUBSCRIPTION_BILLING_CYCLES"
            :key="cycle"
            type="button"
            class="price-cycle__option"
            :class="{ 'price-cycle__option--active': selectedBillingCycle === cycle }"
            :aria-pressed="selectedBillingCycle === cycle"
            @click="selectedBillingCycle = cycle"
          >
            {{ BILLING_CYCLE_LABELS[cycle] }}
            <span v-if="cycleSavings[cycle]" class="price-cycle__save">{{ cycleSavings[cycle] }}</span>
          </button>
        </div>
        <p class="price-hero__note">
          <Globe class="h-3.5 w-3.5" aria-hidden="true" />
          Showing prices in {{ pricing.currency }} for your region
        </p>
      </div>
    </section>

    <!-- Plans -->
    <section class="price-plans" aria-label="Plans">
      <span id="pricing" class="price-anchor" aria-hidden="true" />
      <div class="price-plans__grid">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="price-card"
          :class="[`price-card--${plan.id}`, { 'price-card--featured': plan.featured }]"
        >
          <span v-if="plan.featured" class="price-card__badge">
            <Sparkles class="h-3 w-3" aria-hidden="true" />
            Most popular
          </span>
          <div class="price-card__head">
            <span class="price-card__icon">
              <component :is="plan.icon" class="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 class="price-card__name">{{ plan.name }}</h2>
              <p class="price-card__for">{{ plan.for }}</p>
            </div>
          </div>

          <div class="price-card__price">
            <template v-if="plan.id === 'micro'">
              <span class="price-card__amount">Free</span>
              <span class="price-card__period">forever</span>
            </template>
            <template v-else>
              <span class="price-card__amount">{{ formatPlanPrice(plan.id) }}</span>
              <span v-if="planListPrice(plan.id)" class="price-card__list">
                {{ planListPrice(plan.id) }}
              </span>
              <span class="price-card__period">
                {{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}
              </span>
            </template>
          </div>
          <p class="price-card__renew">
            {{ plan.id === 'micro' ? 'No card needed' : `Auto-renews ${renewLabel}. Cancel any time.` }}
          </p>

          <ul class="price-card__features">
            <li v-for="line in plan.features" :key="line">
              <Check class="price-card__check" aria-hidden="true" />
              {{ line }}
            </li>
          </ul>

          <div class="price-card__actions">
            <a :href="appOriginUrl" class="price-btn" :class="plan.featured ? 'price-btn--light' : 'price-btn--dark'">
              {{ plan.cta }}
              <ArrowRight class="h-4 w-4" aria-hidden="true" />
            </a>
            <NuxtLink
              v-if="plan.id === 'micro'"
              to="/demo/dashboard"
              class="price-btn price-btn--outline"
            >
              Try the demo
            </NuxtLink>
          </div>
        </article>
      </div>

      <ul class="price-assure" aria-label="Good to know">
        <li v-for="a in assurances" :key="a.label">
          <component :is="a.icon" class="h-4 w-4" aria-hidden="true" />
          {{ a.label }}
        </li>
      </ul>
    </section>

    <!-- Compare -->
    <section class="price-compare" aria-labelledby="price-compare-title">
      <div class="price-wrap">
        <header class="price-head">
          <p class="price-eyebrow">
            <Columns3 class="h-3.5 w-3.5" aria-hidden="true" />
            Compare plans
          </p>
          <h2 id="price-compare-title" class="price-title">
            Every plan, <span class="price-accent">side by side</span>
          </h2>
        </header>

        <div class="price-table" role="table" aria-label="Plan comparison">
          <div class="price-table__row price-table__row--head" role="row">
            <span role="columnheader" class="price-table__feature">Feature</span>
            <span
              v-for="plan in plans"
              :key="plan.id"
              role="columnheader"
              class="price-table__plan"
              :class="{ 'price-table__plan--featured': plan.featured }"
            >
              {{ plan.name }}
            </span>
          </div>
          <template v-for="group in compareGroups" :key="group.label">
            <div class="price-table__group" role="row">
              <span role="cell">{{ group.label }}</span>
            </div>
            <div v-for="row in group.rows" :key="row.label" class="price-table__row" role="row">
              <span role="rowheader" class="price-table__feature">{{ row.label }}</span>
              <span
                v-for="(value, i) in row.values"
                :key="i"
                role="cell"
                class="price-table__cell"
                :class="{ 'price-table__cell--featured': i === 1 }"
              >
                <Check v-if="value === true" class="price-table__yes" aria-label="Included" />
                <Minus v-else-if="value === false" class="price-table__no" aria-label="Not included" />
                <template v-else>{{ value }}</template>
              </span>
            </div>
          </template>
        </div>
        <p class="price-compare__soon">
          <span class="price-compare__soon-tag">Coming soon</span>
          Storefront, payment links, and the iOS and Android apps are on the way. They are not
          included in any plan yet.
        </p>
      </div>
    </section>

    <!-- Workspace style -->
    <section class="price-workspace" aria-labelledby="price-workspace-title">
      <div class="price-wrap">
        <header class="price-head">
          <p class="price-eyebrow">
            <LayoutTemplate class="h-3.5 w-3.5" aria-hidden="true" />
            Workspace style
          </p>
          <h2 id="price-workspace-title" class="price-title">
            Solo or Business? <span class="price-accent">It's free either way.</span>
          </h2>
          <p class="price-lede">
            Your workspace style only changes how much of the app we show. It never changes your
            plan or price, and you can switch any time in Settings.
          </p>
        </header>
        <div class="price-workspace__grid">
          <article v-for="ws in workspaces" :key="ws.name" class="price-ws">
            <span class="price-ws__icon">
              <component :is="ws.icon" class="h-5 w-5" aria-hidden="true" />
            </span>
            <p class="price-ws__name">{{ ws.name }}</p>
            <p class="price-ws__tag">{{ ws.tag }}</p>
            <p class="price-ws__desc">{{ ws.desc }}</p>
            <ul class="price-ws__points">
              <li v-for="p in ws.points" :key="p">
                <Check class="price-card__check" aria-hidden="true" />
                {{ p }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Billing FAQ -->
    <section class="price-faq" aria-labelledby="price-faq-title">
      <div class="price-wrap price-faq__wrap">
        <header class="price-head">
          <p class="price-eyebrow">
            <CircleHelp class="h-3.5 w-3.5" aria-hidden="true" />
            Billing questions
          </p>
          <h2 id="price-faq-title" class="price-title">
            Straight answers about <span class="price-accent">paying for Storvv</span>
          </h2>
        </header>
        <ul class="price-faq__list">
          <li
            v-for="(item, i) in billingFaq"
            :key="item.q"
            class="price-faq__item"
            :class="{ 'price-faq__item--open': openFaq === i }"
          >
            <button
              type="button"
              class="price-faq__q"
              :aria-expanded="openFaq === i"
              :aria-controls="`price-faq-${i}`"
              @click="openFaq = openFaq === i ? null : i"
            >
              <span class="price-faq__icon">
                <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
              </span>
              <span class="price-faq__q-text">{{ item.q }}</span>
              <ChevronDown class="price-faq__chevron" aria-hidden="true" />
            </button>
            <div :id="`price-faq-${i}`" class="price-faq__a" role="region">
              <div class="price-faq__a-inner">
                <p>{{ item.a }}</p>
              </div>
            </div>
          </li>
        </ul>
        <p class="price-faq__more">
          More questions?
          <NuxtLink to="/#faq">Read the full FAQ</NuxtLink>
          or
          <NuxtLink to="/security">see how we protect your data</NuxtLink>.
        </p>
      </div>
    </section>

    <!-- CTA -->
    <section class="price-cta">
      <div class="price-cta__panel">
        <div class="price-cta__orb" aria-hidden="true" />
        <h2 class="price-cta__title">Your first store is on us.</h2>
        <p class="price-cta__lede">
          Set up Micro in minutes, right from your browser. Upgrade only when Storvv is already
          paying for itself.
        </p>
        <div class="price-cta__actions">
          <a :href="appOriginUrl" class="price-btn price-btn--light">
            Start free
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </a>
          <NuxtLink to="/demo/dashboard" class="price-btn price-btn--ghost">Try the demo</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import type { Component } from 'vue'
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight,
  BadgeCheck,
  Building,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  CircleHelp,
  Columns3,
  CreditCard,
  Gift,
  Globe,
  LayoutTemplate,
  Minus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  UserRound,
  Users,
} from '@lucide/vue'
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLE_PERIOD_SUFFIX,
  SUBSCRIPTION_BILLING_CYCLES,
  deriveBillingAmount,
  deriveBillingListAmount,
  type SubscriptionBillingCycle,
} from '~/utils/subscription-billing'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const { setup: setupScrollAnimations } = useLandingScrollAnimations()

const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})

const selectedBillingCycle = ref<SubscriptionBillingCycle>('monthly')
const cycleIndex = computed(() => SUBSCRIPTION_BILLING_CYCLES.indexOf(selectedBillingCycle.value))
const cycleSavings: Partial<Record<SubscriptionBillingCycle, string>> = {
  quarterly: 'Save 10%',
  yearly: 'Save 15%',
}
const renewLabel = computed(() =>
  selectedBillingCycle.value === 'yearly'
    ? 'yearly'
    : selectedBillingCycle.value === 'quarterly'
      ? 'each quarter'
      : 'monthly',
)

const locale = ref('en-NG')
const pricingRegion = ref<'NG' | 'US' | 'GB' | 'EU'>('NG')

const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

const pricingByRegion = {
  NG: {
    currency: 'NGN',
    medium: { monthly: 10000, yearly: 100000, yearlyList: 120000 },
    enterprise: { monthly: 25000, yearly: 200000, yearlyList: 300000 },
  },
  US: {
    currency: 'USD',
    medium: { monthly: 7, yearly: 70, yearlyList: 84 },
    enterprise: { monthly: 19, yearly: 190, yearlyList: 228 },
  },
  GB: {
    currency: 'GBP',
    medium: { monthly: 6, yearly: 60, yearlyList: 72 },
    enterprise: { monthly: 15, yearly: 150, yearlyList: 180 },
  },
  EU: {
    currency: 'EUR',
    medium: { monthly: 7, yearly: 70, yearlyList: 84 },
    enterprise: { monthly: 17, yearly: 170, yearlyList: 204 },
  },
} as const

const pricing = computed(() => pricingByRegion[pricingRegion.value])

const formatPrice = (amount: number) =>
  new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: pricing.value.currency,
    maximumFractionDigits: 0,
  }).format(amount)

type PaidPlan = 'medium' | 'enterprise'

const formatPlanPrice = (plan: PaidPlan) => {
  const monthly = pricing.value[plan].monthly
  if (selectedBillingCycle.value === 'yearly') {
    return formatPrice(pricing.value[plan].yearly)
  }
  return formatPrice(deriveBillingAmount(monthly, selectedBillingCycle.value))
}

const planListPrice = (plan: PaidPlan): string | null => {
  if (selectedBillingCycle.value === 'monthly') return null
  if (selectedBillingCycle.value === 'yearly') {
    return formatPrice(pricing.value[plan].yearlyList)
  }
  return formatPrice(deriveBillingListAmount(pricing.value[plan].monthly, 'quarterly'))
}

const plans: {
  id: 'micro' | PaidPlan
  name: string
  for: string
  icon: Component
  featured: boolean
  cta: string
  features: string[]
}[] = [
  {
    id: 'micro',
    name: 'Micro',
    for: 'Solo shops getting organised',
    icon: Store,
    featured: false,
    cta: 'Start free',
    features: [
      '1 store · 1 department · up to 2 staff',
      'Inventory with serial or quantity tracking',
      'Quick Sale, receipts, returns, and customers',
      'WhatsApp receipts (10 a month)',
      'Help center and Storvv Assistant',
      'Web dashboard · mobile apps coming soon',
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    for: 'Growing shops opening a second branch',
    icon: Rocket,
    featured: true,
    cta: 'Get Medium',
    features: [
      'Everything in Micro',
      'Up to 2 stores · 25 staff per store',
      'Analytics with PDF and Excel exports',
      'Sales leads and customer balances',
      'Activity log of every change',
      'Unlimited WhatsApp receipts',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    for: 'Multi-branch retail teams',
    icon: Building2,
    featured: false,
    cta: 'Get Enterprise',
    features: [
      'Everything in Medium',
      'Unlimited stores, departments, and staff',
      'Stock transfers between branches',
      'Copy categories from another branch',
      'Stock loans for serial-tracked items',
      'Priority support',
    ],
  },
]

const assurances: { icon: Component; label: string }[] = [
  { icon: Gift, label: 'Micro is free forever' },
  { icon: CalendarClock, label: 'Cancel any time in Settings' },
  { icon: ShieldCheck, label: 'Nothing deleted on downgrade' },
  { icon: Globe, label: 'Prices in your local currency' },
]

type CellValue = boolean | string

const compareGroups: { label: string; rows: { label: string; values: [CellValue, CellValue, CellValue] }[] }[] = [
  {
    label: 'Limits',
    rows: [
      { label: 'Stores', values: ['1', 'Up to 2', 'Unlimited'] },
      { label: 'Departments', values: ['1', '10', 'Unlimited'] },
      { label: 'Staff', values: ['Up to 2', '25 per store', 'Unlimited'] },
      { label: 'WhatsApp receipts', values: ['10 a month', 'Unlimited', 'Unlimited'] },
    ],
  },
  {
    label: 'Everyday selling',
    rows: [
      { label: 'Inventory, categories, and subcategories', values: [true, true, true] },
      { label: 'Quick Sale and Create New Sale', values: [true, true, true] },
      { label: 'Receipts, returns, and customers', values: [true, true, true] },
      { label: 'Low-stock alerts', values: [true, true, true] },
      { label: 'Storvv Assistant', values: [true, true, true] },
    ],
  },
  {
    label: 'Insights & control',
    rows: [
      { label: 'Analytics and exports', values: [false, true, true] },
      { label: 'Activity log', values: [false, true, true] },
      { label: 'Sales leads', values: [false, true, true] },
      { label: 'Customer balances', values: [false, true, true] },
      { label: 'Duplicate categories', values: [false, true, true] },
    ],
  },
  {
    label: 'Multi-branch',
    rows: [
      { label: 'Stock transfers', values: [false, false, true] },
      { label: 'Copy from branch', values: [false, false, true] },
      { label: 'Stock loans', values: [false, false, true] },
      { label: 'Priority support', values: [false, false, true] },
    ],
  },
]

const workspaces: { icon: Component; name: string; tag: string; desc: string; points: string[] }[] = [
  {
    icon: UserRound,
    name: 'Solo',
    tag: 'Just me',
    desc: 'A focused workspace for running the shop yourself, with inventory, sales, and customers front and center.',
    points: [
      'Fewer menus up front',
      'Team and branch tools hidden until you need them',
      'Great for owner-operators on Micro',
    ],
  },
  {
    icon: Users,
    name: 'Business',
    tag: 'Growing team',
    desc: 'The full Storvv workspace with team, branches, and admin tools, as your plan allows.',
    points: [
      'Staff, departments, and branch navigation',
      'Advanced screens visible by default',
      'Best when you already manage a team',
    ],
  },
]

const billingFaq: { icon: Component; q: string; a: string }[] = [
  {
    icon: Gift,
    q: 'Is Micro really free?',
    a: 'Yes. Micro is free forever for one store, with no card needed. You only pay if you choose to upgrade to Medium or Enterprise.',
  },
  {
    icon: CreditCard,
    q: 'How do I upgrade and pay?',
    a: 'Open Settings → Billing, pick a plan and billing cycle, and see the exact price before you check out securely with Paystack. You can pay monthly, quarterly, or yearly.',
  },
  {
    icon: CalendarClock,
    q: 'Can I cancel any time?',
    a: 'Yes. Turn off auto-renew in Settings whenever you like. Your paid plan keeps working until the end of the period you already paid for.',
  },
  {
    icon: ShieldCheck,
    q: 'What happens to my data if I downgrade?',
    a: 'Nothing is deleted. When a paid period ends you move to Micro limits, and your sales and stock records stay intact.',
  },
  {
    icon: Globe,
    q: 'Why are prices in my currency?',
    a: 'We price Storvv for each region, so you see local prices based on where you are. The price you see before checkout is the price you pay.',
  },
  {
    icon: BadgeCheck,
    q: 'Does Solo or Business change my price?',
    a: 'No. Workspace style only changes how much of the app we show. Your plan decides your limits and price.',
  },
]

const openFaq = ref<number | null>(0)

const detectPricingRegion = () => {
  const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-NG'
  locale.value = browserLocale

  const regionCode = browserLocale.split('-')[1]?.toUpperCase()
  if (regionCode === 'NG') {
    pricingRegion.value = 'NG'
    return
  }
  if (regionCode === 'GB') {
    pricingRegion.value = 'GB'
    return
  }
  if (regionCode === 'US') {
    pricingRegion.value = 'US'
    return
  }
  if (regionCode && EU_COUNTRY_CODES.has(regionCode)) {
    pricingRegion.value = 'EU'
    return
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (timeZone.startsWith('Africa/Lagos')) {
    pricingRegion.value = 'NG'
    return
  }
  if (timeZone.startsWith('Europe/London')) {
    pricingRegion.value = 'GB'
    return
  }
  if (timeZone.startsWith('Europe/')) {
    pricingRegion.value = 'EU'
    return
  }

  pricingRegion.value = 'US'
}

onMounted(() => {
  if (import.meta.client) {
    detectPricingRegion()
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Pricing - Storvv',
  meta: [
    {
      name: 'description',
      content:
        'Storvv pricing: Micro is free forever for one store. Medium adds analytics, sales leads, and a second branch. Enterprise adds stock transfers, stock loans, and unlimited stores. Cancel anytime.',
    },
  ],
})
</script>

<style scoped>
/* ── Shared ── */
.price-wrap {
  max-width: 68rem;
  margin: 0 auto;
}

.price-head {
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}

.price-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.price-eyebrow--dark {
  background: rgb(255 255 255 / 0.1);
  color: #c7d5f0;
}

.price-title {
  margin-top: 0.9rem;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
}

.price-accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.price-lede {
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.65;
  color: #475569;
}

.price-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
}

.price-btn:hover {
  transform: translateY(-2px);
}

.price-btn--light {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 12px 30px -12px rgb(112 144 240 / 0.6);
}

.price-btn--dark {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 0.6);
}

.price-btn--outline {
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.15);
}

.price-btn--outline:hover {
  background: rgb(15 23 42 / 0.04);
}

.price-btn--ghost {
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
}

.price-btn--ghost:hover {
  background: rgb(255 255 255 / 0.08);
}

/* ── Hero ── */
.price-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(7rem, 13vw, 9.5rem) 1.25rem clamp(9rem, 14vw, 11rem);
  background: linear-gradient(160deg, #0b1330 0%, #11295c 55%, #1b2a6b 100%);
  color: #ffffff;
  text-align: center;
}

.price-hero__grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, #000 15%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, #000 15%, transparent 75%);
  pointer-events: none;
}

.price-hero__orb {
  position: absolute;
  width: 30rem;
  aspect-ratio: 1;
  border-radius: 9999px;
  filter: blur(70px);
  opacity: 0.5;
  pointer-events: none;
  animation: price-drift 16s ease-in-out infinite alternate;
}

.price-hero__orb--a {
  top: -35%;
  right: -8%;
  background: radial-gradient(circle, #2f5fb8, transparent 65%);
}

.price-hero__orb--b {
  bottom: -40%;
  left: -12%;
  background: radial-gradient(circle, #5b7fe0, transparent 65%);
  animation-delay: -8s;
}

@keyframes price-drift {
  to {
    transform: translate(6%, 8%) scale(1.1);
  }
}

.price-hero__inner {
  position: relative;
  max-width: 46rem;
  margin: 0 auto;
}

.price-hero__title {
  margin-top: 1rem;
  font-size: clamp(2.1rem, 5vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.price-hero__accent {
  display: block;
  background: linear-gradient(90deg, #a9bcf5, #7090f0, #a9bcf5);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: price-shine 6s linear infinite;
}

@keyframes price-shine {
  to {
    background-position: 200% center;
  }
}

.price-hero__lede {
  max-width: 36rem;
  margin: 1.1rem auto 0;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.72);
}

.price-cycle {
  position: relative;
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  margin-top: 2rem;
  padding: 0.3rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.08);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.14);
}

.price-cycle__thumb {
  position: absolute;
  top: 0.3rem;
  bottom: 0.3rem;
  left: 0.3rem;
  width: calc((100% - 0.6rem) / 3);
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 10px 24px -10px rgb(112 144 240 / 0.8);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.price-cycle__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  color: rgb(255 255 255 / 0.8);
  transition: color 220ms ease;
}

.price-cycle__option--active {
  color: #0f172a;
}

.price-cycle__save {
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background: rgb(169 188 245 / 0.25);
  color: #c7d5f0;
  font-size: 0.64rem;
  font-weight: 700;
}

.price-cycle__option--active .price-cycle__save {
  background: rgb(20 63 141 / 0.1);
  color: #143f8d;
}

@media (max-width: 480px) {
  .price-cycle__option {
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.5rem 0.75rem;
  }
}

.price-hero__note {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.6);
}

/* ── Plans ── */
.price-plans {
  position: relative;
  padding: 0 1.25rem clamp(3rem, 6vw, 4.5rem);
  background: #f5f5f7;
}

.price-anchor {
  position: absolute;
  top: -12rem;
}

.price-plans__grid {
  position: relative;
  max-width: 68rem;
  margin: clamp(-7rem, -10vw, -5.5rem) auto 0;
  display: grid;
  gap: 1rem;
  align-items: stretch;
}

@media (min-width: 900px) {
  .price-plans__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.price-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 1.75rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: 0 30px 60px -40px rgb(20 63 141 / 0.45);
  transition: transform 240ms ease, box-shadow 240ms ease;
}

.price-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 36px 70px -40px rgb(20 63 141 / 0.6);
}

.price-card--featured {
  background: linear-gradient(160deg, #143f8d 0%, #1b2a6b 100%);
  border-color: transparent;
  color: #ffffff;
  box-shadow:
    0 0 0 1px rgb(112 144 240 / 0.4),
    0 40px 80px -36px rgb(20 63 141 / 0.8);
}

@media (min-width: 900px) {
  .price-card--featured {
    transform: translateY(-0.75rem);
  }

  .price-card--featured:hover {
    transform: translateY(-1.25rem);
  }
}

.price-card__badge {
  position: absolute;
  top: -0.8rem;
  left: 50%;
  translate: -50% 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #143f8d;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 10px 24px -10px rgb(20 63 141 / 0.6);
}

.price-card__head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.price-card__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
}

.price-card--featured .price-card__icon {
  background: rgb(255 255 255 / 0.14);
  color: #ffffff;
}

.price-card__name {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.price-card__for {
  font-size: 0.8rem;
  color: #64748b;
}

.price-card--featured .price-card__name {
  color: #ffffff;
}

.price-card--featured .price-card__for {
  color: rgb(255 255 255 / 0.7);
}

.price-card__price {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
}

.price-card__amount {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.price-card__list {
  font-size: 0.9rem;
  color: #94a3b8;
  text-decoration: line-through;
}

.price-card__period {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.price-card--featured .price-card__amount {
  color: #ffffff;
}

.price-card--featured .price-card__list {
  color: rgb(255 255 255 / 0.5);
}

.price-card--featured .price-card__period {
  color: rgb(255 255 255 / 0.7);
}

.price-card__renew {
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.price-card--featured .price-card__renew {
  color: rgb(255 255 255 / 0.55);
}

.price-card__features {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px dashed rgb(15 23 42 / 0.12);
  display: grid;
  gap: 0.6rem;
  flex: 1;
  align-content: start;
}

.price-card--featured .price-card__features {
  border-top-color: rgb(255 255 255 / 0.18);
}

.price-card__features li,
.price-ws__points li {
  display: flex;
  gap: 0.55rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #334155;
}

.price-card--featured .price-card__features li {
  color: rgb(255 255 255 / 0.88);
}

.price-card__check {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.05rem;
  padding: 0.15rem;
  border-radius: 9999px;
  background: rgb(20 63 141 / 0.1);
  color: #143f8d;
}

.price-card--featured .price-card__check {
  background: rgb(255 255 255 / 0.16);
  color: #ffffff;
}

.price-card__actions {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.5rem;
}

.price-assure {
  max-width: 68rem;
  margin: 2.25rem auto 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem 1.5rem;
}

.price-assure li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.price-assure li :deep(svg) {
  color: #143f8d;
}

/* ── Compare ── */
.price-compare {
  padding: clamp(3.5rem, 7vw, 5.5rem) 1.25rem;
  background: #ffffff;
}

.price-table {
  margin-top: 2.25rem;
  overflow-x: auto;
  border-radius: 1.5rem;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: #ffffff;
}

.price-table__row,
.price-table__group {
  display: grid;
  grid-template-columns: minmax(11rem, 1.6fr) repeat(3, minmax(6.5rem, 1fr));
  min-width: 36rem;
}

.price-table__row {
  border-top: 1px solid rgb(15 23 42 / 0.06);
}

.price-table__row--head {
  position: sticky;
  top: 0;
  border-top: none;
  background: #ffffff;
}

.price-table__feature,
.price-table__plan,
.price-table__cell {
  display: flex;
  align-items: center;
  padding: 0.85rem 1.1rem;
  font-size: 0.87rem;
}

.price-table__feature {
  color: #334155;
}

.price-table__row--head .price-table__feature {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.price-table__plan {
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.price-table__plan--featured {
  background: #143f8d;
  color: #ffffff;
}

.price-table__cell {
  justify-content: center;
  text-align: center;
  font-weight: 600;
  color: #0f172a;
}

.price-table__cell--featured {
  background: rgb(20 63 141 / 0.05);
}

.price-table__group {
  border-top: 1px solid rgb(15 23 42 / 0.06);
  background: #f7f9fe;
}

.price-table__group span {
  grid-column: 1 / -1;
  padding: 0.6rem 1.1rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #143f8d;
}

.price-table__yes {
  width: 1.35rem;
  height: 1.35rem;
  padding: 0.25rem;
  border-radius: 9999px;
  background: #143f8d;
  color: #ffffff;
}

.price-table__no {
  width: 1rem;
  height: 1rem;
  color: #cbd5e1;
}

.price-compare__soon {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  text-align: center;
}

.price-compare__soon-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px dashed rgb(91 127 224 / 0.6);
  color: #143f8d;
  font-size: 0.7rem;
  font-weight: 700;
}

/* ── Workspace ── */
.price-workspace {
  padding: clamp(3.5rem, 7vw, 5.5rem) 1.25rem;
  background: #f5f5f7;
}

.price-workspace__grid {
  margin-top: 2.25rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 760px) {
  .price-workspace__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.price-ws {
  padding: 1.6rem;
  border-radius: 1.5rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.price-ws:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px -30px rgb(20 63 141 / 0.45);
}

.price-ws__icon {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  background: linear-gradient(145deg, #143f8d, #5b7fe0);
  color: #ffffff;
}

.price-ws__name {
  margin-top: 1rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.price-ws__tag {
  font-size: 0.8rem;
  font-weight: 600;
  color: #143f8d;
}

.price-ws__desc {
  margin-top: 0.6rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #475569;
}

.price-ws__points {
  margin-top: 1rem;
  display: grid;
  gap: 0.5rem;
}

/* ── FAQ ── */
.price-faq {
  padding: 0 1.25rem clamp(3.5rem, 7vw, 5.5rem);
  background: #f5f5f7;
}

.price-faq__wrap {
  max-width: 50rem;
}

.price-faq__list {
  margin-top: 2.25rem;
  display: grid;
  gap: 0.65rem;
}

.price-faq__item {
  border-radius: 1.25rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  transition: box-shadow 260ms ease, border-color 260ms ease;
}

.price-faq__item--open {
  border-color: rgb(20 63 141 / 0.25);
  box-shadow: 0 20px 40px -26px rgb(20 63 141 / 0.45);
}

.price-faq__q {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 1.1rem 1.25rem;
  text-align: left;
}

.price-faq__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.7rem;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  transition: background-color 260ms ease, color 260ms ease;
}

.price-faq__item--open .price-faq__icon {
  background: #143f8d;
  color: #ffffff;
}

.price-faq__q-text {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.price-faq__chevron {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  color: #64748b;
  transition: transform 260ms ease;
}

.price-faq__item--open .price-faq__chevron {
  transform: rotate(180deg);
}

.price-faq__a {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.price-faq__item--open .price-faq__a {
  grid-template-rows: 1fr;
}

.price-faq__a-inner {
  overflow: hidden;
}

.price-faq__a-inner p {
  padding: 0 1.25rem 1.2rem 4.2rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #475569;
}

@media (max-width: 520px) {
  .price-faq__a-inner p {
    padding-left: 1.25rem;
  }
}

.price-faq__more {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.88rem;
  color: #64748b;
}

.price-faq__more a {
  font-weight: 600;
  color: #143f8d;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── CTA ── */
.price-cta {
  padding: 0 1.25rem clamp(4rem, 8vw, 6rem);
  background: #f5f5f7;
}

.price-cta__panel {
  position: relative;
  max-width: 68rem;
  margin: 0 auto;
  overflow: hidden;
  padding: clamp(2.5rem, 6vw, 4rem) 1.5rem;
  border-radius: 2rem;
  background: linear-gradient(150deg, #0b1330 0%, #143f8d 60%, #1b2a6b 100%);
  text-align: center;
  color: #ffffff;
}

.price-cta__orb {
  position: absolute;
  top: -40%;
  left: 50%;
  width: 28rem;
  aspect-ratio: 1;
  translate: -50% 0;
  border-radius: 9999px;
  background: radial-gradient(circle, rgb(112 144 240 / 0.45), transparent 65%);
  filter: blur(40px);
  pointer-events: none;
}

.price-cta__title {
  position: relative;
  font-size: clamp(1.6rem, 3.4vw, 2.3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.price-cta__lede {
  position: relative;
  max-width: 34rem;
  margin: 0.8rem auto 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.75);
}

.price-cta__actions {
  position: relative;
  margin-top: 1.75rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

/* ── Dark ── */
html.dark .price-plans,
html.dark .price-workspace,
html.dark .price-faq,
html.dark .price-cta {
  background: #080808;
}

html.dark .price-compare {
  background: #0d0d0d;
}

html.dark .price-eyebrow:not(.price-eyebrow--dark) {
  background: rgb(112 144 240 / 0.14);
  color: #a9bcf5;
}

html.dark .price-title,
html.dark .price-card__name,
html.dark .price-card__amount,
html.dark .price-table__plan,
html.dark .price-table__cell,
html.dark .price-ws__name,
html.dark .price-faq__q-text {
  color: #ffffff;
}

html.dark .price-accent {
  background-image: linear-gradient(90deg, #a9bcf5, #7090f0);
}

html.dark .price-lede,
html.dark .price-card__features li,
html.dark .price-ws__points li,
html.dark .price-ws__desc,
html.dark .price-table__feature,
html.dark .price-assure li,
html.dark .price-faq__a-inner p {
  color: rgb(255 255 255 / 0.7);
}

html.dark .price-card__for,
html.dark .price-card__period,
html.dark .price-compare__soon,
html.dark .price-faq__more {
  color: rgb(255 255 255 / 0.55);
}

html.dark .price-card:not(.price-card--featured),
html.dark .price-ws,
html.dark .price-faq__item,
html.dark .price-table {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
  box-shadow: none;
}

html.dark .price-card--featured {
  background: linear-gradient(160deg, #143f8d 0%, #0f1f47 100%);
}

html.dark .price-card:not(.price-card--featured) .price-card__features {
  border-top-color: rgb(255 255 255 / 0.1);
}

html.dark .price-card:not(.price-card--featured) .price-card__icon,
html.dark .price-card:not(.price-card--featured) .price-card__check,
html.dark .price-ws__points .price-card__check,
html.dark .price-faq__icon {
  background: rgb(112 144 240 / 0.14);
  color: #a9bcf5;
}

html.dark .price-faq__item--open .price-faq__icon {
  background: #4876c7;
  color: #ffffff;
}

html.dark .price-faq__item--open {
  border-color: rgb(112 144 240 / 0.35);
}

html.dark .price-assure li :deep(svg),
html.dark .price-ws__tag,
html.dark .price-faq__more a {
  color: #a9bcf5;
}

html.dark .price-btn--dark {
  background: #ffffff;
  color: #0f172a;
}

html.dark .price-btn--outline {
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.2);
}

html.dark .price-table__row--head {
  background: #161616;
}

html.dark .price-table__row,
html.dark .price-table__group {
  border-top-color: rgb(255 255 255 / 0.06);
}

html.dark .price-table__group {
  background: rgb(255 255 255 / 0.03);
}

html.dark .price-table__group span {
  color: #a9bcf5;
}

html.dark .price-table__plan--featured {
  background: #4876c7;
}

html.dark .price-table__cell--featured {
  background: rgb(112 144 240 / 0.07);
}

html.dark .price-table__yes {
  background: #4876c7;
}

html.dark .price-table__no {
  color: rgb(255 255 255 / 0.2);
}

html.dark .price-compare__soon-tag {
  color: #a9bcf5;
  border-color: rgb(169 188 245 / 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .price-hero__orb,
  .price-hero__accent {
    animation: none;
  }

  .price-btn,
  .price-card,
  .price-ws,
  .price-cycle__thumb,
  .price-faq__a,
  .price-faq__chevron {
    transition: none;
  }
}
</style>
