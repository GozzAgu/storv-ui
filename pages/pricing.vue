<template>
  <div>
    <!-- Hero + plans -->
    <section class="mk-hero mk-hero--page" aria-labelledby="pricing-title">
      <div class="mk-hero__backdrop" aria-hidden="true" />
      <div class="mk-container">
        <div class="mk-hero__copy">
          <p class="mk-eyebrow">Pricing</p>
          <h1 id="pricing-title" class="mk-h1">
            Start free. <span class="mk-accent">Grow when you're ready.</span>
          </h1>
          <STabs v-model="cycle" :tabs="cycleTabs" label="Billing cycle">
            <template #tab="{ tab }">
              {{ tab.label }}
              <span
                v-if="CYCLE_SAVINGS[tab.value as SubscriptionBillingCycle]"
                class="mk-tag mk-tag--accent"
              >
                {{ CYCLE_SAVINGS[tab.value as SubscriptionBillingCycle] }}
              </span>
            </template>
          </STabs>
          <p class="mk-hero__note">
            <span class="mk-hero__note-soon"><Globe :size="16" aria-hidden="true" /></span>
            Showing prices in {{ currency }} for your region
          </p>
        </div>

        <div id="plans" class="mk-plans mk-pricing-plans">
          <article
            v-for="plan in MARKETING_PLANS"
            :key="plan.id"
            class="mk-plan"
            :class="{ 'mk-plan--featured': plan.featured }"
          >
            <span v-if="plan.featured" class="mk-plan__badge">Most popular</span>
            <div>
              <h2 class="mk-plan__name">{{ plan.name }}</h2>
              <p class="mk-plan__for">{{ plan.for }}</p>
            </div>
            <div>
              <p class="mk-plan__price">
                <template v-if="plan.id === 'micro'">
                  <span class="mk-plan__amount">Free</span>
                  <span class="mk-plan__period">forever</span>
                </template>
                <template v-else>
                  <span class="mk-plan__amount">{{ planPrice(plan.id) }}</span>
                  <span v-if="planListPrice(plan.id)" class="mk-plan__list">{{
                    planListPrice(plan.id)
                  }}</span>
                  <span class="mk-plan__period">{{ periodSuffix }}</span>
                </template>
              </p>
              <p class="mk-plan__renew">
                {{
                  plan.id === 'micro'
                    ? 'No card needed'
                    : `Auto-renews ${renewLabel}. Cancel any time.`
                }}
              </p>
            </div>
            <div class="mk-plan__actions">
              <SButton
                :variant="plan.featured ? 'primary' : 'secondary'"
                class="mk-btn"
                block
                :to="appUrl"
              >
                {{ plan.cta }}
              </SButton>
              <SButton
                v-if="plan.id === 'micro'"
                variant="ghost"
                class="mk-btn"
                block
                to="/demo/dashboard"
              >
                Try the demo
              </SButton>
            </div>
            <ul class="mk-checks">
              <li v-for="line in plan.features" :key="line">
                <Check :size="16" aria-hidden="true" />
                <span>{{ line }}</span>
              </li>
            </ul>
          </article>
        </div>

        <section class="mk-addons" aria-labelledby="addons-title">
          <div class="mk-addons__intro">
            <p class="mk-eyebrow">Enterprise add-ons</p>
            <h2 id="addons-title" class="mk-addons__title">Outgrowing 5 stores or 10 staff?</h2>
            <p class="mk-card__text">
              Add exactly what you need, billed monthly with your plan. Remove it any time.
            </p>
          </div>
          <ul class="mk-addons__list">
            <li v-for="addOn in addOns" :key="addOn.kind" class="mk-addon">
              <span class="mk-feature__icon"
                ><component :is="addOn.icon" :size="16" aria-hidden="true"
              /></span>
              <div class="mk-addon__body">
                <p class="mk-addon__name">{{ addOn.name }}</p>
                <p class="mk-addon__note">{{ addOn.note }}</p>
              </div>
              <p class="mk-addon__price">
                <span class="mk-addon__amount">{{ addOnPrice(addOn.kind) }}</span>
                <span class="mk-plan__period">{{ addOn.unit }}</span>
              </p>
            </li>
          </ul>
        </section>

        <ul class="mk-facts" aria-label="Good to know">
          <li v-for="a in assurances" :key="a.label" class="mk-fact">
            <component :is="a.icon" :size="18" aria-hidden="true" />
            {{ a.label }}
          </li>
        </ul>
      </div>
    </section>

    <!-- Compare -->
    <section class="mk-section mk-section--alt" aria-labelledby="compare-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="compare-title"
          eyebrow="Compare plans"
          title="Every plan,"
          accent="side by side."
        />
        <div class="mk-table-wrap">
          <table class="mk-table">
            <caption class="ds-sr-only">
              Features included in each plan
            </caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th
                  v-for="plan in MARKETING_PLANS"
                  :key="plan.id"
                  scope="col"
                  :class="{ 'mk-table__featured': plan.featured }"
                >
                  {{ plan.name }}
                </th>
              </tr>
            </thead>
            <tbody v-for="group in compareGroups" :key="group.label">
              <tr class="mk-table__group">
                <th scope="colgroup" colspan="4">{{ group.label }}</th>
              </tr>
              <tr v-for="row in group.rows" :key="row.label">
                <th scope="row">{{ row.label }}</th>
                <td
                  v-for="(value, i) in row.values"
                  :key="i"
                  :class="{ 'mk-table__featured': i === 1 }"
                >
                  <Check
                    v-if="value === true"
                    :size="18"
                    class="mk-table__yes"
                    aria-label="Included"
                  />
                  <Minus
                    v-else-if="value === false"
                    :size="18"
                    class="mk-table__no"
                    aria-label="Not included"
                  />
                  <template v-else>{{ value }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mk-note">
          <span class="mk-tag">Coming soon</span>
          Storefront, payment links, and mobile apps. Not in any plan yet.
        </p>
      </div>
    </section>

    <!-- Workspace style -->
    <section class="mk-section" aria-labelledby="workspace-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="workspace-title"
          eyebrow="Workspace style"
          title="Solo or Business?"
          accent="It's free either way."
        />
        <div class="mk-grid mk-grid--2 mk-narrow-grid">
          <article v-for="ws in workspaces" :key="ws.name" class="mk-card mk-reveal">
            <h3 class="mk-card__title">
              <span class="mk-feature__icon"
                ><component :is="ws.icon" :size="16" aria-hidden="true"
              /></span>
              {{ ws.name }}
              <span class="mk-tag">{{ ws.tag }}</span>
            </h3>
            <ul class="mk-navmock" :aria-label="`${ws.name} menu`">
              <li
                v-for="(item, i) in ws.menu"
                :key="item.label"
                class="mk-navmock__item"
                :class="{
                  'mk-navmock__item--active': i === 0,
                  'mk-navmock__item--extra': item.extra,
                }"
              >
                <component :is="item.icon" :size="16" aria-hidden="true" />
                <span class="mk-navmock__label">{{ item.label }}</span>
                <span v-if="item.extra" class="mk-mini__pill mk-mini__pill--accent">Business</span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Billing FAQ -->
    <section class="mk-section mk-section--alt" aria-labelledby="billing-faq-title">
      <div class="mk-container mk-faq-layout">
        <div class="mk-faq-layout__aside">
          <MkSectionHead
            title-id="billing-faq-title"
            eyebrow="Billing questions"
            title="Straight answers about"
            accent="paying for Storvv."
            align="start"
          >
            <p class="mk-card__text">
              More questions? Read the <NuxtLink to="/#faq" class="mk-link">full FAQ</NuxtLink> or
              <NuxtLink to="/security" class="mk-link">see how we protect your data</NuxtLink>.
            </p>
          </MkSectionHead>
        </div>
        <MkFaq :items="billingFaq" />
      </div>
    </section>

    <MkCta
      title="Your first store is on us."
      :primary="{ label: 'Start free', to: appUrl }"
      :secondary="{ label: 'Try the demo', to: '/demo/dashboard' }"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  Boxes,
  Building2,
  CalendarClock,
  Check,
  Gift,
  Globe,
  LayoutGrid,
  Minus,
  ReceiptText,
  ShieldCheck,
  Store,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
} from '@lucide/vue'
import { getPlanLimits, type SubscriptionAddOnKind } from '~/types/subscription'
import SButton from '~/components/s/SButton.vue'
import STabs from '~/components/s/STabs.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkFaq, { type MkFaqItem } from '~/components/marketing/MkFaq.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import {
  CYCLE_SAVINGS,
  MARKETING_PLANS,
  useMarketingPricing,
} from '~/composables/useMarketingPricing'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'
import {
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_BILLING_CYCLES,
  type SubscriptionBillingCycle,
} from '~/utils/subscription-billing'

definePageMeta({ layout: 'marketing' })

const appUrl = useMarketingAppUrl()
const { cycle, currency, planPrice, planListPrice, addOnPrice, periodSuffix, renewLabel } =
  useMarketingPricing()

const enterpriseLimits = getPlanLimits('storvv_enterprise')

const addOns: {
  kind: SubscriptionAddOnKind
  icon: Component
  name: string
  note: string
  unit: string
}[] = [
  {
    kind: 'store',
    icon: Store,
    name: 'Extra store',
    note: `A new branch with ${enterpriseLimits.maxStaffPerStore} staff seats included`,
    unit: '/ month',
  },
  {
    kind: 'staff',
    icon: UserPlus,
    name: 'Extra staff seat',
    note: 'One more team member on a store you already have',
    unit: '/ seat / month',
  },
]

const cycleTabs = SUBSCRIPTION_BILLING_CYCLES.map((value) => ({
  value,
  label: BILLING_CYCLE_LABELS[value],
}))

const assurances: { icon: Component; label: string }[] = [
  { icon: Gift, label: 'Micro is free forever' },
  { icon: CalendarClock, label: 'Cancel any time in Settings' },
  { icon: ShieldCheck, label: 'Nothing deleted on downgrade' },
  { icon: Globe, label: 'Prices in your local currency' },
]

type CellValue = boolean | string

const compareGroups = computed<
  {
    label: string
    rows: { label: string; values: [CellValue, CellValue, CellValue] }[]
  }[]
>(() => [
  {
    label: 'Limits',
    rows: [
      { label: 'Stores', values: ['1', 'Up to 2', 'Up to 5'] },
      { label: 'Departments', values: ['1', '10', 'Unlimited'] },
      { label: 'Staff', values: ['Up to 2', '5 per store', '10 per store'] },
      { label: 'WhatsApp receipts', values: ['10 a month', 'Unlimited', 'Unlimited'] },
      {
        label: `Extra store (${enterpriseLimits.maxStaffPerStore} staff included)`,
        values: [false, false, `${addOnPrice('store')} / month`],
      },
      { label: 'Extra staff seat', values: [false, false, `${addOnPrice('staff')} / month`] },
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
])

interface Workspace {
  icon: Component
  name: string
  tag: string
  menu: { icon: Component; label: string; extra?: boolean }[]
}

const coreMenu: Workspace['menu'] = [
  { icon: LayoutGrid, label: 'Overview' },
  { icon: Boxes, label: 'Inventory' },
  { icon: ReceiptText, label: 'Sales' },
  { icon: UsersRound, label: 'Customers' },
]

const workspaces: Workspace[] = [
  {
    icon: UserRound,
    name: 'Solo',
    tag: 'Just me',
    menu: coreMenu,
  },
  {
    icon: Users,
    name: 'Business',
    tag: 'Growing team',
    menu: [
      ...coreMenu,
      { icon: UserCog, label: 'Team', extra: true },
      { icon: Building2, label: 'Branches', extra: true },
    ],
  },
]

const billingFaq = computed<MkFaqItem[]>(() => [
  {
    q: 'Is Micro really free?',
    a: 'Yes. Free forever for one store. No card needed.',
  },
  {
    q: 'How do I upgrade and pay?',
    a: 'Settings → Billing. Pick a plan, see the price, pay with Paystack. Monthly, quarterly, or yearly.',
  },
  {
    q: 'What if I need more than 5 stores or 10 staff?',
    a: `On Enterprise, add a store for ${addOnPrice('store')} a month (it comes with ${
      enterpriseLimits.maxStaffPerStore
    } staff seats), or add a staff seat to any store for ${addOnPrice(
      'staff'
    )} a month. Do it from Settings → Billing and remove add-ons any time.`,
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes. Turn off auto-renew in Settings. You keep access until the paid period ends.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Nothing is deleted. You move to Micro limits and keep every record.',
  },
  {
    q: 'Why are prices in my currency?',
    a: 'We price by region. The price you see is the price you pay.',
  },
  {
    q: 'Does Solo or Business change my price?',
    a: 'No. It only changes which menus you see.',
  },
])

useHead({
  title: 'Pricing - Storvv',
  meta: [
    {
      name: 'description',
      content:
        'Storvv pricing: Micro is free forever for one store. Medium adds analytics, sales leads, and a second branch. Enterprise covers 5 stores with 10 staff each, plus stock transfers and stock loans, and you can add stores or staff seats any time. Cancel anytime.',
    },
  ],
})
</script>
