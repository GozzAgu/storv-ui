<template>
  <div>
    <!-- Hero -->
    <section class="mk-hero mk-hero--page" aria-labelledby="features-title">
      <div class="mk-hero__backdrop" aria-hidden="true" />
      <div class="mk-container">
        <div class="mk-hero__copy">
          <p class="mk-eyebrow">Product features</p>
          <h1 id="features-title" class="mk-h1">
            Everything your shop runs on. <span class="mk-accent">In one place.</span>
          </h1>
          <div class="mk-actions mk-actions--center">
            <SButton variant="primary" size="lg" class="mk-btn" :to="appUrl">
              Get started free
              <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
            </SButton>
            <SButton variant="secondary" size="lg" class="mk-btn" to="/demo/dashboard">
              Try the live demo
            </SButton>
          </div>
          <ul class="mk-hero__note" aria-label="Availability">
            <li><Check :size="16" aria-hidden="true" />Web dashboard, live today</li>
            <li><Check :size="16" aria-hidden="true" />Free forever on Micro</li>
            <li class="mk-hero__note-soon">
              <Clock :size="16" aria-hidden="true" />iOS &amp; Android coming soon
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Explorer -->
    <section id="explore" class="mk-section mk-section--tight-top" aria-labelledby="explore-title">
      <div class="mk-container">
        <MkSectionHead title-id="explore-title" title="Pick an area." accent="See what it does." />

        <div class="mk-tabs-row">
          <STabs
            v-model="activeArea"
            :tabs="areaTabs"
            label="Feature areas"
            panel-id="features-panel"
          />
        </div>

        <Transition name="mk-fade" mode="out-in">
          <div id="features-panel" :key="currentArea.id" class="mk-panel" role="tabpanel">
            <div>
              <h3 class="mk-h2 mk-panel__title">{{ currentArea.title }}</h3>
              <ul class="mk-feature-list mk-feature-list--compact">
                <li v-for="item in currentArea.items" :key="item.title" class="mk-feature">
                  <span class="mk-feature__icon">
                    <component :is="item.icon" :size="16" aria-hidden="true" />
                  </span>
                  <div>
                    <p class="mk-feature__title">
                      {{ item.title }}
                      <span class="mk-tag" :class="{ 'mk-tag--accent': item.plan !== 'all' }">
                        {{ planLabels[item.plan] }}
                      </span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <MkFrame
              :src="currentArea.shot"
              :alt="currentArea.shotAlt"
              :url="`app.storvv.com/${currentArea.path}`"
            />
          </div>
        </Transition>
      </div>
    </section>

    <!-- Plan ladder -->
    <section class="mk-section mk-section--alt" aria-labelledby="ladder-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="ladder-title"
          eyebrow="Grows with you"
          title="Start small."
          accent="Unlock more as you grow."
        />
        <ol class="mk-grid mk-grid--3">
          <li
            v-for="(step, i) in ladder"
            :key="step.name"
            class="mk-card mk-reveal"
            :class="{ 'mk-card--featured': step.featured }"
          >
            <span class="mk-step__num">0{{ i + 1 }}</span>
            <h3 class="mk-h3">{{ step.name }}</h3>
            <p class="mk-card__text">{{ step.scope }}</p>
            <ul class="mk-checks mk-card__checks">
              <li v-for="u in step.unlocks" :key="u">
                <Check :size="16" aria-hidden="true" />
                <span>{{ u }}</span>
              </li>
            </ul>
          </li>
        </ol>
        <p class="mk-hero__note mk-pricing-more">
          <NuxtLink to="/pricing" class="mk-link">
            Compare plans and prices
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </p>
      </div>
    </section>

    <MkAssistant />

    <!-- Coming soon -->
    <section id="soon" class="mk-section mk-section--alt" aria-labelledby="soon-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="soon-title"
          eyebrow="On the roadmap"
          title="Coming soon to Storvv"
        />
        <ul class="mk-grid mk-grid--4">
          <li v-for="item in comingSoon" :key="item.title" class="mk-card mk-reveal">
            <span class="mk-card__icon"
              ><component :is="item.icon" :size="20" aria-hidden="true"
            /></span>
            <h3 class="mk-card__title">
              {{ item.title }}
              <span class="mk-tag">Soon</span>
            </h3>
          </li>
        </ul>
      </div>
    </section>

    <MkCta
      title="Ready to run the shop from one place?"
      :primary="{ label: 'Get started free', to: appUrl }"
      :secondary="{ label: 'See pricing', to: '/pricing' }"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  Check,
  Clock,
  Copy,
  CreditCard,
  FileSpreadsheet,
  FolderTree,
  Handshake,
  History,
  LayoutGrid,
  ListChecks,
  ClipboardList,
  Repeat,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  TabletSmartphone,
  UserCog,
  Users,
  Wallet,
  Zap,
} from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import STabs from '~/components/s/STabs.vue'
import MkAssistant from '~/components/marketing/MkAssistant.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'

definePageMeta({ layout: 'marketing' })

const appUrl = useMarketingAppUrl()

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
  path: string
  shot: string
  shotAlt: string
  items: { icon: Component; title: string; plan: Plan }[]
}

const areas: Area[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    title: "Know what's on every shelf",
    path: 'inventory',
    shot: '/marketing/app/inventory.webp',
    shotAlt: 'Storvv inventory screen listing categories with item counts and stock value',
    items: [
      { icon: FolderTree, title: 'Categories', plan: 'all' },
      { icon: ListChecks, title: 'Serial or quantity', plan: 'all' },
      { icon: BellRing, title: 'Low-stock alerts', plan: 'all' },
      { icon: Copy, title: 'Duplicate categories', plan: 'medium' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    title: 'Ring up sales in seconds',
    path: 'receipts',
    shot: '/marketing/app/sales.webp',
    shotAlt: 'Storvv sales screen showing recent receipts with totals, profit and payment status',
    items: [
      { icon: Zap, title: 'Quick Sale', plan: 'all' },
      { icon: Send, title: 'Receipts anywhere', plan: 'all' },
      { icon: Repeat, title: 'Returns & refunds', plan: 'all' },
      { icon: ClipboardList, title: 'Sales leads', plan: 'medium' },
      { icon: Wallet, title: 'Customer balances', plan: 'medium' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    title: 'See how the shop is doing',
    path: 'dashboard',
    shot: '/marketing/app/overview.webp',
    shotAlt:
      'Storvv overview with revenue, sales today, outstanding balances, low stock and a revenue chart',
    items: [
      { icon: LayoutGrid, title: 'Overview', plan: 'all' },
      { icon: Search, title: 'Global search', plan: 'all' },
      { icon: BarChart3, title: 'Reports', plan: 'medium' },
      { icon: FileSpreadsheet, title: 'PDF & Excel', plan: 'medium' },
      { icon: History, title: 'Activity log', plan: 'medium' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    title: 'The right access for everyone',
    path: 'team',
    shot: '/marketing/app/team.webp',
    shotAlt: 'Storvv team screen showing departments, staff counts and managers',
    items: [
      { icon: UserCog, title: 'Roles', plan: 'all' },
      { icon: FolderTree, title: 'Departments', plan: 'all' },
      { icon: ShieldCheck, title: 'Two-factor', plan: 'all' },
      { icon: Users, title: 'Bigger teams', plan: 'medium' },
    ],
  },
  {
    id: 'branches',
    label: 'Branches',
    icon: Building2,
    title: 'One business. Every branch.',
    path: 'multi-store-sync',
    shot: '/marketing/app/branches.webp',
    shotAlt: 'Storvv transfers screen with stock moving between branches and approval status',
    items: [
      { icon: Building2, title: 'A second store', plan: 'medium' },
      { icon: ArrowLeftRight, title: 'Stock transfers', plan: 'enterprise' },
      { icon: Copy, title: 'Copy from branch', plan: 'enterprise' },
      { icon: Handshake, title: 'Stock loans', plan: 'enterprise' },
    ],
  },
]

const areaTabs = areas.map((area) => ({ value: area.id, label: area.label, icon: area.icon }))
const activeArea = ref(areas[0]!.id)
const currentArea = computed(() => areas.find((area) => area.id === activeArea.value) ?? areas[0]!)

const ladder = [
  {
    name: 'Micro',
    scope: 'Free forever · 1 store',
    unlocks: ['Inventory, sales, and receipts', 'Up to 2 staff', 'Storvv Assistant'],
    featured: false,
  },
  {
    name: 'Medium',
    scope: 'Up to 2 stores · 5 staff each',
    unlocks: [
      'Analytics and exports',
      'Sales leads and customer balances',
      'Unlimited WhatsApp receipts',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    scope: '5 stores · 10 staff each · add more',
    unlocks: [
      'Stock transfers between branches',
      'Copy from branch and stock loans',
      'Priority support',
    ],
    featured: false,
  },
]

const comingSoon: { icon: Component; title: string }[] = [
  {
    icon: Store,
    title: 'Storefront',
  },
  {
    icon: CreditCard,
    title: 'Payment links',
  },
  {
    icon: Smartphone,
    title: 'iOS app',
  },
  {
    icon: TabletSmartphone,
    title: 'Android app',
  },
]

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
