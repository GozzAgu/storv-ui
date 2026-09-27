<template>
  <div class="feat-page">
    <!-- Hero -->
    <section class="feat-hero" aria-labelledby="features-hero-title">
      <div class="feat-hero__grid-bg" aria-hidden="true" />
      <div class="feat-hero__orb feat-hero__orb--a" aria-hidden="true" />
      <div class="feat-hero__orb feat-hero__orb--b" aria-hidden="true" />

      <div class="feat-hero__inner">
        <div class="feat-hero__copy">
          <p class="feat-eyebrow feat-eyebrow--dark">
            <LayoutGrid class="h-3.5 w-3.5" aria-hidden="true" />
            Product features
          </p>
          <h1 id="features-hero-title" class="feat-hero__title">
            Everything your shop runs on.
            <span class="feat-hero__accent">In one place.</span>
          </h1>
          <p class="feat-hero__lede">
            Stock, sales, receipts, your team, and every branch, in a single dashboard that works in
            any browser. Start free on Micro and unlock more as you grow.
          </p>
          <div class="feat-hero__actions">
            <a href="#explore" class="feat-btn feat-btn--light">
              Explore features
              <ArrowDown class="h-4 w-4" aria-hidden="true" />
            </a>
            <NuxtLink to="/demo/dashboard" class="feat-btn feat-btn--ghost">
              Try the live demo
            </NuxtLink>
          </div>
          <ul class="feat-hero__chips" aria-label="Availability">
            <li>
              <span class="feat-dot feat-dot--live" aria-hidden="true" />
              Web dashboard · live
            </li>
            <li class="feat-hero__chip--soon">
              <span class="feat-dot feat-dot--soon" aria-hidden="true" />
              iOS &amp; Android · coming soon
            </li>
            <li>
              <Check class="h-3.5 w-3.5" aria-hidden="true" />
              Free forever on Micro
            </li>
          </ul>
        </div>

        <div class="feat-board" aria-hidden="true">
          <div class="feat-board__window">
            <div class="feat-board__bar">
              <span /><span /><span />
              <p class="feat-board__url">app.storvv.com</p>
            </div>
            <div class="feat-board__grid">
              <div
                v-for="(mod, i) in heroModules"
                :key="mod.label"
                class="feat-board__tile"
                :class="{ 'feat-board__tile--active': activeModule === i }"
              >
                <span class="feat-board__tile-icon">
                  <component :is="mod.icon" class="h-4 w-4" />
                </span>
                <p class="feat-board__tile-label">{{ mod.label }}</p>
                <p class="feat-board__tile-meta">{{ mod.meta }}</p>
              </div>
            </div>
          </div>
          <div class="feat-board__float feat-board__float--a">
            <span class="feat-board__float-icon"><Receipt class="h-3.5 w-3.5" /></span>
            Sale recorded · receipt sent
          </div>
          <div class="feat-board__float feat-board__float--b">
            <span class="feat-board__float-icon"><BellRing class="h-3.5 w-3.5" /></span>
            3 items running low
          </div>
        </div>
      </div>
    </section>

    <!-- Explorer -->
    <section class="feat-explore" aria-labelledby="feat-explore-title">
      <span id="explore" class="feat-anchor" aria-hidden="true" />
      <div class="feat-wrap">
        <header class="feat-head">
          <p class="feat-eyebrow">
            <Compass class="h-3.5 w-3.5" aria-hidden="true" />
            Explore by area
          </p>
          <h2 id="feat-explore-title" class="feat-title">
            Pick an area. <span class="feat-accent">See what it does.</span>
          </h2>
          <p class="feat-lede">
            Each area shows the real screen and what is included on every plan, on Medium, and on
            Enterprise.
          </p>
        </header>

        <div class="feat-tabs" role="tablist" aria-label="Feature areas">
          <button
            v-for="(area, i) in areas"
            :key="area.id"
            type="button"
            role="tab"
            class="feat-tab"
            :class="{ 'feat-tab--active': activeArea === i }"
            :aria-selected="activeArea === i"
            :aria-controls="`feat-panel-${area.id}`"
            @click="activeArea = i"
          >
            <component :is="area.icon" class="h-4 w-4" aria-hidden="true" />
            {{ area.label }}
          </button>
        </div>

        <Transition name="feat-fade" mode="out-in">
          <div
            :id="`feat-panel-${currentArea.id}`"
            :key="currentArea.id"
            class="feat-panel"
            role="tabpanel"
          >
            <div class="feat-panel__copy">
              <h3 class="feat-panel__title">{{ currentArea.title }}</h3>
              <p class="feat-panel__lede">{{ currentArea.lede }}</p>
              <ul class="feat-panel__list">
                <li v-for="item in currentArea.items" :key="item.title" class="feat-item">
                  <span class="feat-item__icon">
                    <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div class="feat-item__body">
                    <p class="feat-item__title">
                      {{ item.title }}
                      <span class="feat-plan" :class="`feat-plan--${item.plan}`">
                        {{ planLabels[item.plan] }}
                      </span>
                    </p>
                    <p class="feat-item__desc">{{ item.desc }}</p>
                  </div>
                </li>
              </ul>
            </div>
            <figure class="feat-shot">
              <div class="feat-shot__bar">
                <span /><span /><span />
                <p class="feat-shot__url">app.storvv.com/{{ currentArea.path }}</p>
              </div>
              <img
                :src="currentArea.shot"
                :alt="currentArea.shotAlt"
                class="feat-shot__img"
                loading="lazy"
                width="1440"
                height="900"
              />
            </figure>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Plan ladder -->
    <section class="feat-ladder" aria-labelledby="feat-ladder-title">
      <div class="feat-wrap">
        <header class="feat-head">
          <p class="feat-eyebrow">
            <TrendingUp class="h-3.5 w-3.5" aria-hidden="true" />
            Grows with you
          </p>
          <h2 id="feat-ladder-title" class="feat-title">
            Start small. <span class="feat-accent">Unlock more as you grow.</span>
          </h2>
        </header>

        <ol class="feat-ladder__steps">
          <li
            v-for="(step, i) in ladder"
            :key="step.name"
            class="feat-ladder__step"
            :class="{ 'feat-ladder__step--featured': step.featured }"
          >
            <span class="feat-ladder__num">{{ i + 1 }}</span>
            <p class="feat-ladder__name">{{ step.name }}</p>
            <p class="feat-ladder__scope">{{ step.scope }}</p>
            <ul class="feat-ladder__unlocks">
              <li v-for="u in step.unlocks" :key="u">
                <Check class="feat-ladder__check" aria-hidden="true" />
                {{ u }}
              </li>
            </ul>
          </li>
        </ol>
        <div class="feat-ladder__cta">
          <NuxtLink to="/pricing" class="feat-btn feat-btn--dark">
            Compare plans
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <LandingAiShowcase />

    <!-- Coming soon -->
    <section class="feat-soon" aria-labelledby="feat-soon-title">
      <div class="feat-wrap">
        <header class="feat-head">
          <p class="feat-eyebrow">
            <Hourglass class="h-3.5 w-3.5" aria-hidden="true" />
            On the roadmap
          </p>
          <h2 id="feat-soon-title" class="feat-title">
            Coming soon to <span class="feat-accent">Storvv</span>
          </h2>
          <p class="feat-lede">
            These aren't available yet. We'll announce each one as it launches.
          </p>
        </header>
        <ul class="feat-soon__grid">
          <li v-for="item in comingSoon" :key="item.title" class="feat-soon__card">
            <span class="feat-soon__icon">
              <component :is="item.icon" class="h-5 w-5" aria-hidden="true" />
            </span>
            <span class="feat-soon__tag">Coming soon</span>
            <p class="feat-soon__title">{{ item.title }}</p>
            <p class="feat-soon__desc">{{ item.desc }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- CTA -->
    <section class="feat-cta">
      <div class="feat-cta__panel">
        <div class="feat-cta__orb" aria-hidden="true" />
        <h2 class="feat-cta__title">Ready to run the shop from one place?</h2>
        <p class="feat-cta__lede">
          Start on Micro for free, right from your browser. Upgrade only when you need more stores
          or deeper insights.
        </p>
        <div class="feat-cta__actions">
          <a :href="appOriginUrl" class="feat-btn feat-btn--light">
            Get started free
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </a>
          <NuxtLink to="/pricing" class="feat-btn feat-btn--ghost">See pricing</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  Check,
  ClipboardList,
  Compass,
  Copy,
  CreditCard,
  FileSpreadsheet,
  FolderTree,
  Handshake,
  History,
  Hourglass,
  LayoutGrid,
  ListChecks,
  Receipt,
  Repeat,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  TabletSmartphone,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  Zap,
} from '@lucide/vue'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const { setup: setupScrollAnimations } = useLandingScrollAnimations()
const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})

const heroModules: { icon: Component; label: string; meta: string }[] = [
  { icon: Boxes, label: 'Inventory', meta: 'Categories & stock' },
  { icon: ShoppingCart, label: 'Sales', meta: 'Quick Sale & receipts' },
  { icon: BarChart3, label: 'Analytics', meta: 'Reports & exports' },
  { icon: Users, label: 'Team', meta: 'Roles & departments' },
  { icon: Building2, label: 'Branches', meta: 'Switch & transfer' },
  { icon: Sparkles, label: 'Assistant', meta: 'Help on any screen' },
]

const activeModule = ref(0)
let moduleTimer: ReturnType<typeof setInterval> | null = null

type Plan = 'all' | 'medium' | 'enterprise'

const planLabels: Record<Plan, string> = {
  all: 'All plans',
  medium: 'Medium+',
  enterprise: 'Enterprise',
}

interface Area {
  id: string
  label: string
  icon: Component
  title: string
  lede: string
  path: string
  shot: string
  shotAlt: string
  items: { icon: Component; title: string; desc: string; plan: Plan }[]
}

const areas: Area[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    title: 'Know exactly what is on your shelves',
    lede: 'Organise products the way your shop works, and see low stock before a customer asks for something you do not have.',
    path: 'inventory',
    shot: '/marketing/screenshots/inventory.png',
    shotAlt: 'Storvv inventory screen listing categories with item counts and stock levels',
    items: [
      { icon: FolderTree, title: 'Categories & subcategories', desc: 'Folders with an optional subcategory level, such as Phones → iPhone.', plan: 'all' },
      { icon: ListChecks, title: 'Serial or quantity tracking', desc: 'Track individual serial numbers or pooled counts per category.', plan: 'all' },
      { icon: BellRing, title: 'Low-stock alerts', desc: 'Set thresholds per category and export a reorder list for suppliers.', plan: 'all' },
      { icon: Copy, title: 'Duplicate categories', desc: 'Clone a category template within the same branch.', plan: 'medium' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    title: 'Ring up sales in seconds',
    lede: 'A fast checkout for busy counters and a guided wizard for bigger sales. Stock updates the moment a receipt completes.',
    path: 'receipts',
    shot: '/marketing/screenshots/receipts.png',
    shotAlt: 'Storvv receipts screen showing recent sales with totals and payment status',
    items: [
      { icon: Zap, title: 'Quick Sale & Create New Sale', desc: 'Pick items, take split payments, and complete the sale.', plan: 'all' },
      { icon: Send, title: 'Receipts anywhere', desc: 'Share by WhatsApp, email, PDF, or print. 10 WhatsApp sends a month on Micro, unlimited on Medium.', plan: 'all' },
      { icon: Repeat, title: 'Returns & refunds', desc: 'Refund per receipt and audit every completed return.', plan: 'all' },
      { icon: ClipboardList, title: 'Sales leads', desc: 'Log enquiries, assign staff, and turn a lead into a sale.', plan: 'medium' },
      { icon: Wallet, title: 'Customer balances', desc: 'Track balance-due sales, credit, and payment reminders.', plan: 'medium' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    title: 'See how the shop is really doing',
    lede: 'Daily numbers on the dashboard for everyone, and deeper reports when you are ready to dig in.',
    path: 'analytics',
    shot: '/marketing/screenshots/analytics.png',
    shotAlt: 'Storvv analytics screen with revenue charts, top products, and peak hours',
    items: [
      { icon: LayoutGrid, title: 'Dashboard overview', desc: 'Revenue, low stock, and recent activity at a glance.', plan: 'all' },
      { icon: Search, title: 'Global search', desc: 'Press ⌘K or Ctrl+K to find receipts, items, or customers.', plan: 'all' },
      { icon: BarChart3, title: 'Analytics', desc: 'Daily, weekly, or monthly reports with peak hours and top sellers.', plan: 'medium' },
      { icon: FileSpreadsheet, title: 'PDF & Excel exports', desc: 'Send clean reports to your accountant or partners.', plan: 'medium' },
      { icon: History, title: 'Activity log', desc: 'A dated history of inventory, sales, and settings changes.', plan: 'medium' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    title: 'Give everyone the right access',
    lede: 'Every person gets their own login. You decide what they can see and do, one person at a time.',
    path: 'settings/team',
    shot: '/marketing/screenshots/departments.png',
    shotAlt: 'Storvv departments screen showing teams and the staff assigned to each',
    items: [
      { icon: UserCog, title: 'Owner, manager, and staff roles', desc: 'Sensible defaults for each role, adjustable per person.', plan: 'all' },
      { icon: FolderTree, title: 'Departments', desc: 'Limit which inventory folders each login can open.', plan: 'all' },
      { icon: ShieldCheck, title: 'Two-factor for owners', desc: 'Add an extra layer of protection to the owner account.', plan: 'all' },
      { icon: Users, title: 'Bigger teams', desc: 'Up to 2 staff on Micro, 25 per store on Medium, unlimited on Enterprise.', plan: 'medium' },
    ],
  },
  {
    id: 'branches',
    label: 'Branches',
    icon: Building2,
    title: 'One business. Every branch.',
    lede: 'Switch stores from one login, move stock between them, and keep every location set up the same way.',
    path: 'multi-store-sync',
    shot: '/marketing/screenshots/multi-store-sync.png',
    shotAlt: 'Storvv multi-store sync screen for transferring stock between branches',
    items: [
      { icon: Building2, title: 'A second store', desc: 'Run up to 2 stores with a branch switcher.', plan: 'medium' },
      { icon: ArrowLeftRight, title: 'Stock transfers', desc: 'Request, approve, and track stock moving between branches.', plan: 'enterprise' },
      { icon: Copy, title: 'Copy from branch', desc: 'Reuse category templates across stores without copying live quantities.', plan: 'enterprise' },
      { icon: Handshake, title: 'Stock loans', desc: 'Lend serial-tracked items and track them until they come back or sell.', plan: 'enterprise' },
    ],
  },
]

const activeArea = ref(0)
const currentArea = computed(() => areas[activeArea.value] ?? areas[0])

const ladder = [
  {
    name: 'Micro',
    scope: 'Free forever · 1 store',
    unlocks: ['Inventory, sales, and receipts', 'Up to 2 staff', 'Storvv Assistant'],
    featured: false,
  },
  {
    name: 'Medium',
    scope: 'Up to 2 stores',
    unlocks: ['Analytics and exports', 'Sales leads and customer balances', 'Unlimited WhatsApp receipts'],
    featured: true,
  },
  {
    name: 'Enterprise',
    scope: 'Unlimited stores',
    unlocks: ['Stock transfers between branches', 'Copy from branch and stock loans', 'Priority support'],
    featured: false,
  },
]

const comingSoon: { icon: Component; title: string; desc: string }[] = [
  { icon: Store, title: 'Storefront', desc: 'A guest catalogue built from your stock, shared by link or QR code.' },
  { icon: CreditCard, title: 'Payment links', desc: 'Send a checkout link for remote sales and invoices.' },
  { icon: Smartphone, title: 'iOS app', desc: 'Run the shop from your iPhone or iPad with the same login.' },
  { icon: TabletSmartphone, title: 'Android app', desc: 'The same Storvv experience on Android phones and tablets.' },
]

onMounted(() => {
  if (!import.meta.client) return
  setTimeout(() => setupScrollAnimations(), 100)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    moduleTimer = setInterval(() => {
      activeModule.value = (activeModule.value + 1) % heroModules.length
    }, 1800)
  }
})

onBeforeUnmount(() => {
  if (moduleTimer) clearInterval(moduleTimer)
})

useHead({
  title: 'Features - Storvv retail OS',
  meta: [
    {
      name: 'description',
      content:
        'Explore Storvv features: inventory, sales and receipts, analytics, team permissions, and multi-branch tools in one web dashboard. iOS and Android apps are coming soon.',
    },
  ],
})
</script>

<style scoped>
/* ── Shared ── */
.feat-wrap {
  max-width: 68rem;
  margin: 0 auto;
}

.feat-anchor {
  position: absolute;
  top: -5rem;
}

.feat-head {
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}

.feat-eyebrow {
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

.feat-eyebrow--dark {
  background: rgb(255 255 255 / 0.1);
  color: #c7d5f0;
}

.feat-title {
  margin-top: 0.9rem;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
}

.feat-accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.feat-lede {
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.65;
  color: #475569;
}

.feat-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
}

.feat-btn:hover {
  transform: translateY(-2px);
}

.feat-btn--light {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 12px 30px -12px rgb(112 144 240 / 0.6);
}

.feat-btn--ghost {
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
}

.feat-btn--ghost:hover {
  background: rgb(255 255 255 / 0.08);
}

.feat-btn--dark {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 0.6);
}

.feat-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.feat-dot--live {
  background: #34d399;
  box-shadow: 0 0 0 3px rgb(52 211 153 / 0.25);
}

.feat-dot--soon {
  background: #a9bcf5;
  box-shadow: 0 0 0 3px rgb(169 188 245 / 0.25);
}

/* ── Hero ── */
.feat-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(7rem, 13vw, 9.5rem) 1.25rem clamp(4rem, 8vw, 6rem);
  background: linear-gradient(160deg, #0b1330 0%, #11295c 55%, #1b2a6b 100%);
  color: #ffffff;
}

.feat-hero__grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 70% 50%, #000 15%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 70% 50%, #000 15%, transparent 75%);
  pointer-events: none;
}

.feat-hero__orb {
  position: absolute;
  width: 30rem;
  aspect-ratio: 1;
  border-radius: 9999px;
  filter: blur(70px);
  opacity: 0.5;
  pointer-events: none;
  animation: feat-drift 16s ease-in-out infinite alternate;
}

.feat-hero__orb--a {
  top: -30%;
  right: -5%;
  background: radial-gradient(circle, #2f5fb8, transparent 65%);
}

.feat-hero__orb--b {
  bottom: -45%;
  left: -10%;
  background: radial-gradient(circle, #5b7fe0, transparent 65%);
  animation-delay: -8s;
}

@keyframes feat-drift {
  to {
    transform: translate(6%, 8%) scale(1.1);
  }
}

.feat-hero__inner {
  position: relative;
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 900px) {
  .feat-hero__inner {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  }
}

.feat-hero__title {
  margin-top: 1rem;
  font-size: clamp(2.1rem, 5vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.feat-hero__accent {
  display: block;
  background: linear-gradient(90deg, #a9bcf5, #7090f0, #a9bcf5);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: feat-shine 6s linear infinite;
}

@keyframes feat-shine {
  to {
    background-position: 200% center;
  }
}

.feat-hero__lede {
  margin-top: 1.1rem;
  max-width: 34rem;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.72);
}

.feat-hero__actions {
  margin-top: 1.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.feat-hero__chips {
  margin-top: 1.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feat-hero__chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.07);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.85);
}

.feat-hero__chips li.feat-hero__chip--soon {
  background: transparent;
  box-shadow: none;
  border: 1px dashed rgb(169 188 245 / 0.55);
}

/* Hero board */
.feat-board {
  position: relative;
  padding: 1.5rem 0;
}

.feat-board__window {
  border-radius: 1.25rem;
  background: rgb(255 255 255 / 0.06);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.12),
    0 40px 80px -40px rgb(0 0 0 / 0.7);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.feat-board__bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
}

.feat-board__bar > span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.22);
}

.feat-board__url {
  margin-left: 0.6rem;
  padding: 0.2rem 0.7rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.08);
  font-size: 0.7rem;
  color: rgb(255 255 255 / 0.6);
}

.feat-board__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  padding: 1rem;
}

@media (min-width: 480px) {
  .feat-board__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.feat-board__tile {
  padding: 0.9rem;
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
  transition: background-color 400ms ease, box-shadow 400ms ease, transform 400ms ease;
}

.feat-board__tile--active {
  background: #ffffff;
  box-shadow: 0 18px 36px -18px rgb(112 144 240 / 0.8);
  transform: translateY(-3px);
}

.feat-board__tile-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.1);
  color: #c7d5f0;
  transition: background-color 400ms ease, color 400ms ease;
}

.feat-board__tile--active .feat-board__tile-icon {
  background: linear-gradient(145deg, #143f8d, #5b7fe0);
  color: #ffffff;
}

.feat-board__tile-label {
  margin-top: 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  transition: color 400ms ease;
}

.feat-board__tile-meta {
  margin-top: 0.15rem;
  font-size: 0.7rem;
  color: rgb(255 255 255 / 0.55);
  transition: color 400ms ease;
}

.feat-board__tile--active .feat-board__tile-label {
  color: #0f172a;
}

.feat-board__tile--active .feat-board__tile-meta {
  color: #475569;
}

.feat-board__float {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem 0.5rem 0.5rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 18px 40px -18px rgb(0 0 0 / 0.55);
  animation: feat-float 5s ease-in-out infinite;
}

.feat-board__float--a {
  top: 0;
  right: -0.5rem;
}

.feat-board__float--b {
  bottom: 0;
  left: -0.5rem;
  animation-delay: -2.5s;
}

.feat-board__float-icon {
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 9999px;
  background: rgb(20 63 141 / 0.1);
  color: #143f8d;
}

@keyframes feat-float {
  50% {
    transform: translateY(-6px);
  }
}

/* ── Explorer ── */
.feat-explore {
  position: relative;
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #f5f5f7;
}

.feat-tabs {
  margin: 2.25rem auto 0;
  display: flex;
  gap: 0.4rem;
  width: fit-content;
  max-width: 100%;
  padding: 0.35rem;
  overflow-x: auto;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.08);
  scrollbar-width: none;
}

.feat-tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.05rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  transition: background-color 220ms ease, color 220ms ease;
}

.feat-tab:hover {
  color: #0f172a;
}

.feat-tab--active {
  background: #143f8d;
  color: #ffffff;
  box-shadow: 0 10px 22px -12px rgb(20 63 141 / 0.7);
}

.feat-tab--active:hover {
  color: #ffffff;
}

.feat-panel {
  margin-top: 1.75rem;
  display: grid;
  gap: 1.75rem;
  padding: clamp(1.25rem, 3.5vw, 2.25rem);
  border-radius: 1.75rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: 0 30px 60px -40px rgb(20 63 141 / 0.35);
}

@media (min-width: 960px) {
  .feat-panel {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr);
    align-items: center;
  }
}

.feat-panel__title {
  font-size: clamp(1.3rem, 2.4vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.feat-panel__lede {
  margin-top: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
}

.feat-panel__list {
  margin-top: 1.25rem;
  display: grid;
  gap: 0.55rem;
}

.feat-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 1rem;
  background: #f7f9fe;
  transition: background-color 200ms ease, transform 200ms ease;
}

.feat-item:hover {
  background: #eef2fb;
  transform: translateX(3px);
}

.feat-item__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
  background: rgb(20 63 141 / 0.1);
  color: #143f8d;
}

.feat-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}

.feat-item__desc {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #64748b;
}

.feat-plan {
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.feat-plan--all {
  background: rgb(15 23 42 / 0.06);
  color: #475569;
}

.feat-plan--medium {
  background: rgb(20 63 141 / 0.1);
  color: #143f8d;
}

.feat-plan--enterprise {
  background: #143f8d;
  color: #ffffff;
}

.feat-shot {
  border-radius: 1.1rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow:
    0 0 0 8px #ffffff,
    0 0 0 9px rgb(15 23 42 / 0.06),
    0 40px 70px -40px rgb(20 63 141 / 0.5);
  overflow: hidden;
}

.feat-shot__bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  background: #f8fafc;
}

.feat-shot__bar > span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / 0.15);
}

.feat-shot__url {
  margin-left: 0.6rem;
  padding: 0.15rem 0.7rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / 0.05);
  font-size: 0.68rem;
  color: #64748b;
}

.feat-shot__img {
  display: block;
  width: 100%;
  height: auto;
}

.feat-fade-enter-active,
.feat-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.feat-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.feat-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Ladder ── */
.feat-ladder {
  padding: clamp(4rem, 8vw, 6rem) 1.25rem;
  background: #ffffff;
}

.feat-ladder__steps {
  margin-top: 2.5rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 860px) {
  .feat-ladder__steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.feat-ladder__step {
  position: relative;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: #f7f9fe;
  border: 1px solid rgb(20 63 141 / 0.1);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.feat-ladder__step:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 48px -30px rgb(20 63 141 / 0.45);
}

.feat-ladder__step--featured {
  background: linear-gradient(160deg, #143f8d, #1b2a6b);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 30px 60px -30px rgb(20 63 141 / 0.7);
}

.feat-ladder__num {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #143f8d;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgb(20 63 141 / 0.2);
}

.feat-ladder__name {
  margin-top: 1rem;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.feat-ladder__scope {
  margin-top: 0.2rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #143f8d;
}

.feat-ladder__unlocks {
  margin-top: 1rem;
  display: grid;
  gap: 0.5rem;
}

.feat-ladder__unlocks li {
  display: flex;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #334155;
}

.feat-ladder__check {
  flex-shrink: 0;
  width: 1.05rem;
  height: 1.05rem;
  margin-top: 0.1rem;
  padding: 0.15rem;
  border-radius: 9999px;
  background: rgb(20 63 141 / 0.12);
  color: #143f8d;
}

.feat-ladder__step--featured .feat-ladder__name {
  color: #ffffff;
}

.feat-ladder__step--featured .feat-ladder__scope {
  color: #a9bcf5;
}

.feat-ladder__step--featured .feat-ladder__unlocks li {
  color: rgb(255 255 255 / 0.85);
}

.feat-ladder__step--featured .feat-ladder__check {
  background: rgb(255 255 255 / 0.15);
  color: #ffffff;
}

.feat-ladder__cta {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

/* ── Coming soon ── */
.feat-soon {
  padding: clamp(4rem, 8vw, 6rem) 1.25rem;
  background: #f5f5f7;
}

.feat-soon__grid {
  margin-top: 2.25rem;
  display: grid;
  gap: 0.85rem;
}

@media (min-width: 640px) {
  .feat-soon__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .feat-soon__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.feat-soon__card {
  position: relative;
  padding: 1.35rem;
  border-radius: 1.35rem;
  background: rgb(255 255 255 / 0.7);
  border: 1.5px dashed rgb(91 127 224 / 0.45);
}

.feat-soon__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.8rem;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
}

.feat-soon__tag {
  position: absolute;
  top: 1.35rem;
  right: 1.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: rgb(91 127 224 / 0.12);
  color: #143f8d;
  font-size: 0.66rem;
  font-weight: 700;
}

.feat-soon__title {
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.feat-soon__desc {
  margin-top: 0.3rem;
  font-size: 0.85rem;
  line-height: 1.55;
  color: #64748b;
}

/* ── CTA ── */
.feat-cta {
  padding: 0 1.25rem clamp(4rem, 8vw, 6rem);
  background: #f5f5f7;
}

.feat-cta__panel {
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

.feat-cta__orb {
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

.feat-cta__title {
  position: relative;
  font-size: clamp(1.6rem, 3.4vw, 2.3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.feat-cta__lede {
  position: relative;
  max-width: 34rem;
  margin: 0.8rem auto 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.75);
}

.feat-cta__actions {
  position: relative;
  margin-top: 1.75rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

/* ── Dark ── */
html.dark .feat-explore,
html.dark .feat-soon,
html.dark .feat-cta {
  background: #080808;
}

html.dark .feat-ladder {
  background: #0d0d0d;
}

html.dark .feat-eyebrow:not(.feat-eyebrow--dark) {
  background: rgb(112 144 240 / 0.14);
  color: #a9bcf5;
}

html.dark .feat-title,
html.dark .feat-panel__title,
html.dark .feat-item__title,
html.dark .feat-ladder__name,
html.dark .feat-soon__title {
  color: #ffffff;
}

html.dark .feat-accent {
  background-image: linear-gradient(90deg, #a9bcf5, #7090f0);
}

html.dark .feat-lede,
html.dark .feat-panel__lede,
html.dark .feat-ladder__unlocks li {
  color: rgb(255 255 255 / 0.7);
}

html.dark .feat-item__desc,
html.dark .feat-soon__desc {
  color: rgb(255 255 255 / 0.55);
}

html.dark .feat-tabs {
  background: #161616;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
}

html.dark .feat-tab {
  color: rgb(255 255 255 / 0.65);
}

html.dark .feat-tab:hover {
  color: #ffffff;
}

html.dark .feat-tab--active {
  background: #ffffff;
  color: #0f172a;
}

html.dark .feat-tab--active:hover {
  color: #0f172a;
}

html.dark .feat-panel,
html.dark .feat-ladder__step:not(.feat-ladder__step--featured) {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
  box-shadow: none;
}

html.dark .feat-item {
  background: rgb(255 255 255 / 0.04);
}

html.dark .feat-item:hover {
  background: rgb(255 255 255 / 0.07);
}

html.dark .feat-item__icon,
html.dark .feat-soon__icon,
html.dark .feat-ladder__check {
  background: rgb(112 144 240 / 0.14);
  color: #a9bcf5;
}

html.dark .feat-plan--all {
  background: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.7);
}

html.dark .feat-plan--medium {
  background: rgb(112 144 240 / 0.16);
  color: #a9bcf5;
}

html.dark .feat-plan--enterprise {
  background: #4876c7;
}

html.dark .feat-shot {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
  box-shadow:
    0 0 0 8px rgb(255 255 255 / 0.03),
    0 40px 70px -40px rgb(0 0 0 / 0.8);
}

html.dark .feat-shot__bar {
  background: #1c1c1c;
  border-bottom-color: rgb(255 255 255 / 0.06);
}

html.dark .feat-shot__bar > span,
html.dark .feat-shot__url {
  background: rgb(255 255 255 / 0.1);
}

html.dark .feat-shot__url {
  color: rgb(255 255 255 / 0.55);
}

html.dark .feat-ladder__num {
  background: #1c1c1c;
  color: #a9bcf5;
  box-shadow: inset 0 0 0 1px rgb(112 144 240 / 0.3);
}

html.dark .feat-ladder__scope {
  color: #a9bcf5;
}

html.dark .feat-soon__card {
  background: rgb(255 255 255 / 0.03);
  border-color: rgb(112 144 240 / 0.35);
}

html.dark .feat-soon__tag {
  background: rgb(112 144 240 / 0.16);
  color: #a9bcf5;
}

html.dark .feat-btn--dark {
  background: #ffffff;
  color: #0f172a;
}

@media (prefers-reduced-motion: reduce) {
  .feat-hero__orb,
  .feat-hero__accent,
  .feat-board__float {
    animation: none;
  }

  .feat-btn,
  .feat-tab,
  .feat-item,
  .feat-board__tile,
  .feat-ladder__step,
  .feat-fade-enter-active,
  .feat-fade-leave-active {
    transition: none;
  }
}
</style>
