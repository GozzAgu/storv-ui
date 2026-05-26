<template>
  <div class="landing-showcase">
    <!-- 1. Hero -->
    <section
      id="hero"
      ref="heroSectionRef"
      data-section-id="landing-hero"
      class="landing-hero scroll-animate scroll-animate-up"
      aria-labelledby="landing-hero-title"
      @mousemove="onHeroPointerMove"
      @mouseleave="onHeroPointerLeave"
    >
      <div class="landing-hero__orbs" aria-hidden="true">
        <span class="landing-hero__orb landing-hero__orb--a" />
        <span class="landing-hero__orb landing-hero__orb--b" />
      </div>
      <div class="landing-hero__glow" aria-hidden="true" />
      <div class="landing-hero__grid landing-line-grid" aria-hidden="true" />
      <div class="landing-hero__inner">
        <div class="landing-hero__content">
          <p class="landing-label landing-label--blue landing-hero__reveal" style="--hero-i: 0">
            Retail operations platform
          </p>
          <h1 id="landing-hero-title" class="landing-hero__title">
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 1">Run your</span>
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 2">
              <span class="landing-hero__accent">store.</span>
            </span>
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 3">Not sheets.</span>
          </h1>
          <p class="landing-hero__subtitle landing-hero__reveal" style="--hero-i: 4">
            Inventory, sales, returns and customers, all in one place, always live.
          </p>
          <div class="landing-hero__actions landing-hero__reveal" style="--hero-i: 5">
            <a :href="appUrl" class="landing-pill-cta landing-pill-cta--hero">
              Free for 6 months
            </a>
            <a :href="appUrl" class="landing-hero__link">
              <span class="landing-hero__link-arrow" aria-hidden="true">→</span>
              {{ appHost }}
            </a>
          </div>
          <ul class="landing-hero__chips landing-hero__reveal" style="--hero-i: 6" aria-label="Core capabilities">
            <li v-for="chip in heroChips" :key="chip.label">
              <a :href="chip.href" class="landing-hero__chip">{{ chip.label }}</a>
            </li>
          </ul>
        </div>
        <a href="#features" class="landing-hero__scroll-hint landing-hero__reveal" style="--hero-i: 7">
          <span class="landing-hero__scroll-hint-text">Explore features</span>
          <span class="landing-hero__scroll-hint-icon" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>

    <!-- 2. Problems -->
    <section
      id="problems"
      data-section-id="landing-problems"
      class="landing-problems scroll-animate scroll-animate-up"
      aria-labelledby="landing-problems-title"
    >
      <div class="landing-problems__dots landing-dot-grid" aria-hidden="true" />
      <div class="landing-problems__inner">
        <div>
          <img :src="logoSrc" alt="" class="landing-problems__logo" width="96" height="40" aria-hidden="true" />
          <p class="landing-label landing-label--blue">Built for store owners</p>
          <h2 id="landing-problems-title" class="landing-problems__headline">Storvv fixes all of this.</h2>
          <p class="landing-problems__lede">
            One platform. Every store task. Real time. No spreadsheets, no guesswork.
          </p>
          <div class="landing-problems__cta-box">
            <span class="landing-problems__cta-icon" aria-hidden="true">
              <CheckIcon class="h-5 w-5 text-white" stroke-width="2.5" />
            </span>
            <div>
              <p class="landing-problems__cta-title">Free for 6 months</p>
              <p class="landing-problems__cta-sub">Any business. No card required.</p>
            </div>
          </div>
        </div>

        <div>
          <p class="landing-problems__list-label landing-label landing-label--muted">Sound familiar?</p>
          <ul class="m-0 list-none p-0">
            <li
              v-for="item in painPoints"
              :key="item.num"
              class="landing-problems__item"
            >
              <span class="landing-problems__item-num">{{ item.num }}</span>
              <p class="landing-problems__item-title">{{ item.title }}</p>
              <p class="landing-problems__item-desc">{{ item.description }}</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 3. Core features -->
    <section
      id="features"
      data-section-id="landing-features"
      class="landing-core scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
      aria-labelledby="landing-features-title"
    >
      <div class="landing-core__glow" aria-hidden="true" />
      <div class="landing-core__inner">
        <header class="landing-core__header">
          <div>
            <p class="landing-label landing-label--blue">Core features</p>
            <h2 id="landing-features-title" class="landing-core__title">
              Four things your store needs <span class="landing-hero__accent">daily.</span>
            </h2>
          </div>
          <p class="landing-label landing-label--muted hidden sm:block">Everything in one place</p>
        </header>

        <div class="landing-core__grid">
          <article
            v-for="feature in coreFeatures"
            :key="feature.num"
            class="landing-core__card"
          >
            <div class="landing-core__card-top">
              <span class="landing-core__card-icon" aria-hidden="true">
                <component :is="feature.icon" class="h-5 w-5" stroke-width="1.5" />
              </span>
              <span class="landing-core__card-num">{{ feature.num }}</span>
            </div>
            <h3 class="landing-core__card-title">{{ feature.title }}</h3>
            <p class="landing-core__card-desc">{{ feature.description }}</p>
            <span class="landing-core__badge">{{ feature.badge }}</span>
          </article>
        </div>
      </div>
    </section>

    <!-- 4. Setup -->
    <section
      id="setup"
      data-section-id="landing-setup"
      class="landing-setup scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
      aria-labelledby="landing-setup-title"
    >
      <div class="landing-setup__visual">
        <div class="landing-setup__rings" aria-hidden="true" />
        <p class="landing-setup__minutes">15</p>
        <p class="landing-setup__minutes-label">minutes</p>
        <p class="landing-setup__minutes-caption">From signup to first sale</p>
      </div>

      <div class="landing-setup__content">
        <img :src="logoSrc" alt="" class="landing-setup__logo" width="88" height="36" aria-hidden="true" />
        <p class="landing-label landing-label--blue">Ridiculously fast setup</p>
        <h2 id="landing-setup-title" class="landing-setup__headline">
          Your store.<br />
          Live today.
        </h2>
        <ol class="landing-setup__steps">
          <li v-for="step in setupSteps" :key="step.num" class="landing-setup__step">
            <span class="landing-setup__step-num">{{ step.num }}</span>
            <p class="landing-setup__step-title">
              {{ step.num === 1 ? `Sign up at ${appHost}` : step.title }}
            </p>
            <p class="landing-setup__step-desc">{{ step.description }}</p>
          </li>
        </ol>
        <a :href="appUrl" class="landing-pill-cta mt-8 inline-flex">Get started free</a>
      </div>
    </section>

    <!-- 5. Multi-store -->
    <section
      id="multi-store"
      data-section-id="landing-multistore"
      class="landing-multistore scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
      aria-labelledby="landing-multistore-title"
    >
      <div class="landing-multistore__glow" aria-hidden="true" />
      <div class="landing-multistore__inner">
        <p class="landing-label landing-label--muted mb-6 text-right lg:absolute lg:right-8 lg:top-0 lg:mb-0">
          Built for growth
        </p>
        <div>
          <p class="landing-label landing-label--blue">Multi-store management</p>
          <h2 id="landing-multistore-title" class="landing-multistore__title">
            One login.<br />
            <span class="landing-hero__accent">Every</span><br />
            branch.
          </h2>
          <p class="landing-multistore__lede">
            Whether you have one store or five, Storvv keeps each location completely separate,
            and gives you full visibility from a single account.
          </p>

          <ul class="landing-multistore__features m-0 list-none p-0">
            <li
              v-for="item in multiStoreFeatures"
              :key="item.title"
              class="landing-multistore__feature"
            >
              <span class="landing-multistore__feature-icon" aria-hidden="true">
                <component :is="item.icon" class="h-4 w-4" stroke-width="2" />
              </span>
              <p class="landing-multistore__feature-title">{{ item.title }}</p>
              <p class="landing-multistore__feature-desc">{{ item.description }}</p>
            </li>
          </ul>

          <div class="landing-multistore__footer-cta">
            <a :href="appUrl" class="landing-pill-cta">Free for 6 months</a>
          </div>
        </div>

        <div class="landing-multistore__cards" aria-label="Example store branches">
          <article class="landing-store-card landing-store-card--primary">
            <div class="landing-store-card__head">
              <span class="landing-store-card__name">Lagos, Main Store</span>
              <span class="landing-store-card__tag landing-store-card__tag--active">Active</span>
            </div>
            <div class="landing-store-card__stats">
              <div v-for="stat in mainStoreStats" :key="stat.label">
                <p class="landing-store-card__stat-value">{{ stat.value }}</p>
                <p class="landing-store-card__stat-label">{{ stat.label }}</p>
              </div>
            </div>
          </article>

          <div class="landing-store-divider" aria-hidden="true">
            <span>One account</span>
          </div>

          <article class="landing-store-card landing-store-card--dim">
            <div class="landing-store-card__head">
              <span class="landing-store-card__name">Abuja, Branch 2</span>
              <span class="landing-store-card__tag landing-store-card__tag--muted">Separate data</span>
            </div>
            <div class="landing-store-card__stats">
              <div v-for="stat in branchStoreStats" :key="stat.label">
                <p class="landing-store-card__stat-value">{{ stat.value }}</p>
                <p class="landing-store-card__stat-label">{{ stat.label }}</p>
              </div>
            </div>
          </article>

          <article class="landing-store-card landing-store-card--ghost">
            <div class="landing-store-card__head">
              <span class="landing-store-card__name">+ Add another location</span>
              <span class="landing-store-card__tag landing-store-card__tag--muted">Enterprise</span>
            </div>
            <p class="landing-store-card__ghost-note">Unlimited stores with synced reporting</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CheckIcon,
  DocumentTextIcon,
  PlusIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'

const heroSectionRef = ref<HTMLElement | null>(null)

const heroChips = [
  { label: 'Inventory', href: '#features' },
  { label: 'Sales', href: '#features' },
  { label: 'Returns', href: '#features' },
  { label: 'Customers', href: '#features' },
] as const

function onHeroPointerMove(event: MouseEvent) {
  const el = heroSectionRef.value
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const rect = el.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  el.style.setProperty('--hero-mx', String(x * 28))
  el.style.setProperty('--hero-my', String(y * 18))
}

function onHeroPointerLeave() {
  const el = heroSectionRef.value
  if (!el) return
  el.style.setProperty('--hero-mx', '0')
  el.style.setProperty('--hero-my', '0')
}

const props = defineProps<{
  logoSrc: string
  appUrl: string
}>()

const appHost = computed(() => {
  try {
    return new URL(props.appUrl).host
  } catch {
    return 'app.storvv.com'
  }
})

const painPoints = [
  {
    num: '01',
    title: 'Stock counts are always wrong',
    description: "You find out when a customer asks for something you don't have",
  },
  {
    num: '02',
    title: 'Receipts disappear',
    description: "A customer wants a return and you can't prove what they paid",
  },
  {
    num: '03',
    title: 'No visibility into daily sales',
    description: 'Nobody can tell you what sold yesterday without checking manually',
  },
  {
    num: '04',
    title: 'Three different spreadsheets',
    description: 'Each updated differently, never fully in sync',
  },
] as const

const coreFeatures = [
  {
    num: '01',
    icon: ArchiveBoxIcon,
    title: 'Inventory',
    description:
      'Live stock counts that update automatically with every sale and return. No manual entry ever.',
    badge: 'Always accurate',
  },
  {
    num: '02',
    icon: DocumentTextIcon,
    title: 'Sales receipts',
    description:
      'Every transaction saved with a date, items, price and payment method. Look up any past sale instantly.',
    badge: 'Every transaction logged',
  },
  {
    num: '03',
    icon: ArrowPathIcon,
    title: 'Returns',
    description:
      'Find the original receipt, select items, confirm. Stock restores instantly. No spreadsheet update needed.',
    badge: 'Stock restored instantly',
  },
  {
    num: '04',
    icon: UserIcon,
    title: 'Customers',
    description:
      'Save names and contact details. View full purchase history. Make returns faster and service more personal.',
    badge: 'Full purchase history',
  },
] as const

const setupSteps = [
  {
    num: 1,
    title: '',
    description: 'No download. Just a browser. Works on phone, tablet, or laptop.',
  },
  {
    num: 2,
    title: 'Set your currency and store name',
    description: 'Quick onboarding takes under 2 minutes.',
  },
  {
    num: 3,
    title: 'Add your products',
    description: 'Create folders, add items with sizes, brands, colours, your way.',
  },
  {
    num: 4,
    title: 'Invite your team and sell',
    description: 'Each person sees only what they need. No training required.',
  },
] as const

const multiStoreFeatures = [
  {
    icon: PlusIcon,
    title: 'Separate data per location',
    description: 'Inventory and sales never mix between branches',
  },
  {
    icon: ArrowRightIcon,
    title: 'Switch between stores instantly',
    description: 'One login, full visibility across all your locations',
  },
  {
    icon: ChartBarIcon,
    title: 'Reports per branch',
    description: 'Know exactly where your business stands, store by store',
  },
] as const

const mainStoreStats = [
  { value: '247', label: 'Products' },
  { value: '38', label: 'Sales today' },
  { value: '3', label: 'Staff' },
] as const

const branchStoreStats = [
  { value: '184', label: 'Products' },
  { value: '21', label: 'Sales today' },
  { value: '2', label: 'Staff' },
] as const
</script>
