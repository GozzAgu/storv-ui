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
            Stock, sales, returns, and customers in one live workspace.
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
        <a href="#use-cases" class="landing-hero__scroll-hint landing-hero__reveal" style="--hero-i: 7">
          <span class="landing-hero__scroll-hint-text">See who it is for</span>
          <span class="landing-hero__scroll-hint-icon" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>

    <!-- 2. Who it is for -->
    <section
      id="use-cases"
      data-section-id="use-cases"
      class="landing-who-uses-section scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
      aria-labelledby="landing-who-heading"
    >
      <div class="landing-who-bg" aria-hidden="true" />

      <div class="landing-who-inner">
        <div class="landing-who-layout">
          <div class="landing-who-copy">
            <p class="landing-label landing-label--blue">Who it is for</p>
            <h2 id="landing-who-heading" class="landing-who-heading">
              Built for <span class="landing-who-heading-accent">any business</span> that sells
            </h2>
            <p class="landing-who-lede">
              Boutiques, workshops, showrooms, and general stores use the same simple system.
            </p>

            <ul class="landing-who-points">
              <li v-for="point in whoUsesPoints" :key="point.num" class="landing-who-point">
                <span class="landing-who-point-num">{{ point.num }}</span>
                <div class="landing-who-point-body">
                  <p class="landing-who-point-title">{{ point.title }}</p>
                  <p class="landing-who-point-desc">{{ point.description }}</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="landing-who-cards">
            <article
              v-for="card in whoUsesCards"
              :key="card.title"
              class="landing-who-card"
            >
              <component :is="card.icon" class="landing-who-card-icon" stroke-width="1.5" aria-hidden="true" />
              <div class="landing-who-card-content">
                <h3 class="landing-who-card-title">{{ card.title }}</h3>
                <p class="landing-who-card-desc">{{ card.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Problems -->
    <section
      id="problems"
      data-section-id="landing-problems"
      class="landing-problems scroll-animate scroll-animate-up"
      aria-labelledby="landing-problems-title"
    >
      <div class="landing-problems__dots landing-dot-grid" aria-hidden="true" />
      <div class="landing-problems__inner">
        <div class="landing-problems__pains">
          <p class="landing-label landing-label--muted">Sound familiar?</p>
          <h2 id="landing-problems-title" class="landing-problems__headline landing-problems__headline--pains">
            Store work should not live in chaos.
          </h2>
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

        <div class="landing-problems__answer">
          <img :src="logoSrc" alt="" class="landing-problems__logo" width="96" height="40" aria-hidden="true" />
          <p class="landing-label landing-label--blue">The fix</p>
          <h2 class="landing-problems__headline">One place for every store task.</h2>
          <p class="landing-problems__lede">
            Live stock, saved receipts, and clear sales, without spreadsheets or guesswork.
          </p>
          <div class="landing-problems__cta-box">
            <span class="landing-problems__cta-icon" aria-hidden="true">
              <CheckIcon class="h-5 w-5 text-white" stroke-width="2.5" />
            </span>
            <div>
              <p class="landing-problems__cta-title">Free for 6 months</p>
              <p class="landing-problems__cta-sub">Any business. No card needed.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Core features -->
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
            <p class="landing-label landing-label--blue">What you get</p>
            <h2 id="landing-features-title" class="landing-core__title">
              Four tools you use <span class="landing-hero__accent">every day.</span>
            </h2>
          </div>
          <p class="landing-label landing-label--muted hidden sm:block">All linked together</p>
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

    <!-- 5. Setup -->
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
        <p class="landing-setup__minutes-caption">Sign up to first sale</p>
      </div>

      <div class="landing-setup__content">
        <img :src="logoSrc" alt="" class="landing-setup__logo" width="88" height="36" aria-hidden="true" />
        <p class="landing-label landing-label--blue">Quick setup</p>
        <h2 id="landing-setup-title" class="landing-setup__headline">
          Go live<br />
          the same day.
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

    <!-- 6. Multi-store (growth) -->
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
            One or five locations: separate data per branch, full visibility from one login.
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
  CubeIcon,
  DocumentTextIcon,
  PlusIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'

const heroSectionRef = ref<HTMLElement | null>(null)

const heroChips = [
  { label: 'Inventory', href: '#features' },
  { label: 'Receipts', href: '#features' },
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

const whoUsesCards = [
  {
    icon: CubeIcon,
    title: 'Your catalog, your fields',
    description: 'Sizes, brands, colours, serials, or simple counts. Stock updates on every sale and return.',
  },
  {
    icon: TagIcon,
    title: 'Sell from any counter',
    description: 'Receipts, discounts, and returns in one flow, shop, depot, or showroom.',
  },
  {
    icon: UserGroupIcon,
    title: 'Team access that fits',
    description: 'Each role sees what they need. No shared passwords or spreadsheet handoffs.',
  },
] as const

const whoUsesPoints = [
  {
    num: '01',
    title: 'Any product type',
    description: 'Clothing, parts, furniture, electronics, groceries, or a mix.',
  },
  {
    num: '02',
    title: 'One shop or many',
    description: 'Start with one location. Add branches when you grow.',
  },
  {
    num: '03',
    title: 'No custom build',
    description: 'Stock, sales, returns, and customers work the same for every trade.',
  },
  {
    num: '04',
    title: 'Clear roles',
    description: 'Owners, managers, and staff each get the right view.',
  },
] as const

const painPoints = [
  {
    num: '01',
    title: 'Stock counts drift',
    description: 'You learn what is missing only when a customer asks.',
  },
  {
    num: '02',
    title: 'Receipts go missing',
    description: 'Returns stall because you cannot prove what was paid.',
  },
  {
    num: '03',
    title: 'No daily sales picture',
    description: 'Yesterday’s numbers take manual digging to find.',
  },
  {
    num: '04',
    title: 'Spreadsheets multiply',
    description: 'Each file updates differently and never fully matches.',
  },
] as const

const coreFeatures = [
  {
    num: '01',
    icon: ArchiveBoxIcon,
    title: 'Inventory',
    description: 'Live counts update with every sale and return. No manual stock sheets.',
    badge: 'Always in sync',
  },
  {
    num: '02',
    icon: DocumentTextIcon,
    title: 'Sales receipts',
    description: 'Every sale saved with items, price, and payment. Find any receipt fast.',
    badge: 'Full history',
  },
  {
    num: '03',
    icon: ArrowPathIcon,
    title: 'Returns',
    description: 'Open the original receipt, pick items, confirm. Stock restores right away.',
    badge: 'Stock restored',
  },
  {
    num: '04',
    icon: UserIcon,
    title: 'Customers',
    description: 'Names, contacts, and purchase history in one profile for faster service.',
    badge: 'Know your buyers',
  },
] as const

const setupSteps = [
  {
    num: 1,
    title: '',
    description: 'Works in the browser on phone, tablet, or laptop. Nothing to install.',
  },
  {
    num: 2,
    title: 'Set currency and store name',
    description: 'Takes about two minutes.',
  },
  {
    num: 3,
    title: 'Add products',
    description: 'Folders and fields that match how you sell.',
  },
  {
    num: 4,
    title: 'Invite staff and sell',
    description: 'Each person sees only what their role needs.',
  },
] as const

const multiStoreFeatures = [
  {
    icon: PlusIcon,
    title: 'Separate data per branch',
    description: 'Inventory and sales never mix between locations.',
  },
  {
    icon: ArrowRightIcon,
    title: 'Switch stores in one click',
    description: 'One login across every location you run.',
  },
  {
    icon: ChartBarIcon,
    title: 'Reports per branch',
    description: 'See performance store by store.',
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
