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
      <div class="landing-hero__floats" aria-hidden="true">
        <span
          v-for="item in heroFloatIcons"
          :key="item.id"
          class="landing-hero__float"
          :class="`landing-hero__float--${item.id}`"
        >
          <component :is="item.icon" class="landing-hero__float-icon" stroke-width="1.5" />
        </span>
      </div>
      <div class="landing-hero__inner">
        <div class="landing-hero__center">
          <div class="landing-hero__content">
            <div class="landing-hero__stack">
              <p class="landing-label landing-label--blue landing-hero__reveal" style="--hero-i: 0">
                Retail, sales, and inventory in one workspace
              </p>
              <h1 id="landing-hero-title" class="landing-hero__title">
                <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 1">Stop losing</span>
                <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 2">
                  <span class="landing-hero__accent">money</span>
                </span>
                <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 3">on stock.</span>
              </h1>
              <p class="landing-hero__subtitle landing-hero__reveal" style="--hero-i: 4">
                Know what’s in each branch, what sold, and what’s running low. Receipts and customers in
                one dashboard, not Excel or WhatsApp threads.
              </p>
            </div>

            <div
              class="landing-hero__actions landing-hero__panel landing-hero__reveal"
              style="--hero-i: 5"
            >
              <div class="landing-hero__cta-row">
                <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-pill-cta--hero">
                  Try the demo (no signup)
                </NuxtLink>
                <a :href="appUrl" class="landing-pill-cta landing-pill-cta--outline">
                  Start free on Micro
                </a>
              </div>
              <div class="landing-hero__link-row">
                <a :href="appUrl" class="landing-hero__link">
                  <span class="landing-hero__link-arrow" aria-hidden="true">→</span>
                  {{ appHost }}
                </a>
              </div>
            </div>

            <div
              class="landing-hero__capabilities landing-hero__panel landing-hero__reveal"
              style="--hero-i: 6"
              aria-label="Core capabilities"
            >
              <p class="landing-hero__capabilities-label">Explore</p>
              <ul class="landing-hero__chip-row">
                <li v-for="chip in heroChipsPrimary" :key="chip.label">
                  <NuxtLink
                    v-if="chip.href.startsWith('/')"
                    :to="chip.href"
                    class="landing-hero__chip"
                  >
                    {{ chip.label }}
                  </NuxtLink>
                  <a v-else :href="chip.href" class="landing-hero__chip">{{ chip.label }}</a>
                </li>
              </ul>
              <ul class="landing-hero__chip-row landing-hero__chip-row--secondary">
                <li v-for="chip in heroChipsSecondary" :key="chip.label">
                  <NuxtLink
                    v-if="chip.href.startsWith('/')"
                    :to="chip.href"
                    class="landing-hero__chip"
                  >
                    {{ chip.label }}
                  </NuxtLink>
                  <a v-else :href="chip.href" class="landing-hero__chip">{{ chip.label }}</a>
                </li>
              </ul>
            </div>
          </div>
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
      class="landing-who-uses-section scroll-animate scroll-animate-up"
      aria-labelledby="landing-who-heading"
    >
      <div class="landing-who-bg" aria-hidden="true" />

      <div class="landing-who-inner">
        <div class="landing-who-layout">
          <div class="landing-who-copy">
            <div class="landing-who-stack">
              <p class="landing-label landing-label--blue">Who it is for</p>
              <h2 id="landing-who-heading" class="landing-who-heading">
                Built for <span class="landing-who-heading-accent">retail, sales,</span> and operations
              </h2>
              <p class="landing-who-lede">
                Shops, showrooms, procurement-led teams, and multi-branch operators who need one system
                for stock, selling, and customer records.
              </p>
            </div>

            <div class="landing-section-panel landing-section-panel--dark">
              <p class="landing-section-panel__label">Highlights</p>
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
          </div>

          <div class="landing-who-cards-wrap">
            <div class="landing-section-panel landing-section-panel--dark">
              <p class="landing-section-panel__label">Built in</p>
              <div class="landing-who-cards">
                <article
                  v-for="card in whoUsesCards"
                  :key="card.title"
                  class="landing-who-card"
                >
                  <span class="landing-who-card-icon-wrap" aria-hidden="true">
                    <component :is="card.icon" class="landing-who-card-icon" stroke-width="1.5" />
                  </span>
                  <div class="landing-who-card-content">
                    <h3 class="landing-who-card-title">{{ card.title }}</h3>
                    <p class="landing-who-card-desc">{{ card.description }}</p>
                  </div>
                </article>
              </div>
            </div>
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
          <div class="landing-problems__stack">
            <p class="landing-label landing-label--muted">Sound familiar?</p>
            <h2 id="landing-problems-title" class="landing-problems__headline landing-problems__headline--pains">
              Store work should not live in chaos.
            </h2>
          </div>

          <div class="landing-section-panel landing-section-panel--light">
            <p class="landing-section-panel__label landing-section-panel__label--muted">Pain points</p>
            <ul class="landing-problems__list m-0 list-none p-0">
              <li
                v-for="item in painPoints"
                :key="item.num"
                class="landing-problems__item"
              >
                <span class="landing-problems__item-num">{{ item.num }}</span>
                <div class="landing-problems__item-body">
                  <p class="landing-problems__item-title">{{ item.title }}</p>
                  <p class="landing-problems__item-desc">{{ item.description }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="landing-problems__answer">
          <div class="landing-section-panel landing-section-panel--light landing-section-panel--solution">
            <div class="landing-problems__answer-stack">
              <img :src="logoSrc" alt="" class="landing-problems__logo" width="96" height="40" aria-hidden="true" />
              <div>
                <p class="landing-label landing-label--blue">The fix</p>
                <h2 class="landing-problems__headline">One dashboard. Every branch.</h2>
                <p class="landing-problems__lede">
                  Live stock per location, saved receipts, and customer history. Less spreadsheet chaos.
                </p>
              </div>
            </div>
            <NuxtLink to="/demo/dashboard" class="landing-problems__cta-box">
              <span class="landing-problems__cta-icon" aria-hidden="true">
                <CheckIcon class="h-5 w-5 text-white" stroke-width="2.5" />
              </span>
              <div>
                <p class="landing-problems__cta-title">Try the interactive demo</p>
                <p class="landing-problems__cta-sub">Sample multi-branch data. No account.</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Core features -->
    <section
      id="features"
      data-section-id="landing-features"
      class="landing-core scroll-animate scroll-animate-up"
      aria-labelledby="landing-features-title"
    >
      <div class="landing-core__glow" aria-hidden="true" />
      <div class="landing-core__inner">
        <header class="landing-core__header">
          <div>
            <p class="landing-label landing-label--blue">What you get</p>
            <h2 id="landing-features-title" class="landing-core__title">
              Stock, sales & customers <span class="landing-hero__accent">in sync.</span>
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
      class="landing-setup scroll-animate scroll-animate-up"
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
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <NuxtLink to="/demo/dashboard" class="landing-pill-cta inline-flex">Try the demo</NuxtLink>
          <a :href="appUrl" class="landing-pill-cta landing-pill-cta--outline inline-flex">Start free on Micro</a>
        </div>
      </div>
    </section>

    <!-- 6. Multi-store (growth) -->
    <section
      id="multi-store"
      data-section-id="landing-multistore"
      class="landing-multistore scroll-animate scroll-animate-up"
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
            Separate data per branch, consolidated reports when you need the full picture. One login
            for owners and ops leads.
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
            <NuxtLink to="/demo/dashboard" class="landing-pill-cta">Try multi-store demo</NuxtLink>
            <a :href="appUrl" class="landing-pill-cta landing-pill-cta--outline">Start free on Micro</a>
          </div>
        </div>

        <div class="landing-multistore__cards" aria-label="Example store branches">
          <article class="landing-store-card landing-store-card--primary">
            <div class="landing-store-card__head">
              <span class="landing-store-card__name">Main store</span>
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
              <span class="landing-store-card__name">Branch 2</span>
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
            <p class="landing-store-card__ghost-note">Add more branches on Enterprise</p>
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
  ShoppingBagIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'

const heroSectionRef = ref<HTMLElement | null>(null)

const heroChips = [
  { label: 'Live stock', href: '#features' },
  { label: 'Multi-branch', href: '#multi-store' },
  { label: 'Receipts', href: '#features' },
  { label: 'Customers', href: '#features' },
  { label: 'See outcomes', href: '#proof' },
] as const

const heroChipsPrimary = heroChips.slice(0, 3)
const heroChipsSecondary = heroChips.slice(3)

const heroFloatIcons = [
  { id: 'inventory', icon: ArchiveBoxIcon },
  { id: 'receipts', icon: DocumentTextIcon },
  { id: 'returns', icon: ArrowPathIcon },
  { id: 'customers', icon: UserIcon },
  { id: 'sales', icon: ChartBarIcon },
  { id: 'store', icon: ShoppingBagIcon },
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
    title: 'Stock you can trust',
    description: 'Per-branch counts update on every sale and return. See low stock before you lose the sale.',
  },
  {
    icon: TagIcon,
    title: 'Receipts in one place',
    description: 'Every transaction saved. Search by customer, item, or receipt number without digging through chats.',
  },
  {
    icon: UserGroupIcon,
    title: 'Roles per branch',
    description: 'Owners, managers, and floor staff each see what they need. No shared passwords.',
  },
] as const

const whoUsesPoints = [
  {
    num: '01',
    title: '2+ branches',
    description: 'Switch stores without logging out. Compare branches side by side.',
  },
  {
    num: '02',
    title: 'Any product type',
    description: 'Serials, SKUs, bundles, or simple quantity. Match how you buy and sell.',
  },
  {
    num: '03',
    title: 'Plans that scale',
    description: 'Start free on Micro. WhatsApp receipt sharing on eligible plans.',
  },
  {
    num: '04',
    title: 'Start on Micro free',
    description: 'One store free forever. Upgrade when you add branches or need analytics.',
  },
] as const

const painPoints = [
  {
    num: '01',
    title: 'Stock “finished” at the wrong branch',
    description: 'You only find out when the customer is already at the counter.',
  },
  {
    num: '02',
    title: 'Receipts lost in chats',
    description: 'Returns and disputes stall because proof lives in screenshots.',
  },
  {
    num: '03',
    title: 'No sales by location',
    description: 'You cannot compare branches without manual merges.',
  },
  {
    num: '04',
    title: 'Excel does not scale',
    description: 'Every branch has its own sheet and none of them match.',
  },
] as const

const coreFeatures = [
  {
    num: '01',
    icon: ArchiveBoxIcon,
    title: 'Inventory',
    description: 'Live stock per branch. Low-stock signals so you reorder before you lose margin.',
    badge: 'Stop stockouts',
  },
  {
    num: '02',
    icon: DocumentTextIcon,
    title: 'Receipts',
    description: 'Sales, payments, and history in one search, not scattered across WhatsApp.',
    badge: 'One record',
  },
  {
    num: '03',
    icon: ArrowPathIcon,
    title: 'Returns',
    description: 'Refund against the original receipt. Stock restores automatically.',
    badge: 'Stock restored',
  },
  {
    num: '04',
    icon: UserIcon,
    title: 'Customers',
    description: 'Names, phones, and spend history linked to receipts at every branch.',
    badge: 'Know buyers',
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
