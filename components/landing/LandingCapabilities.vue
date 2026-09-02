<template>
  <section
    id="capabilities-grid"
    data-section-id="capabilities-grid"
    class="landing-capabilities scroll-animate scroll-animate-up"
    aria-labelledby="landing-capabilities-title"
  >
    <div class="landing-capabilities__bg" aria-hidden="true" />
    <div class="landing-capabilities__grid-bg landing-line-grid" aria-hidden="true" />

    <div class="landing-capabilities__shell">
      <header class="landing-capabilities__intro">
        <p class="landing-label landing-label--blue">Full product</p>
        <h2 id="landing-capabilities-title" class="landing-capabilities__title">
          Everything Storvv includes
        </h2>
        <p class="landing-capabilities__lede">
          Core daily ops on every plan. Analytics, leads, and multi-branch tools unlock as you grow.
          Browse by category below.
        </p>
      </header>

      <p class="landing-capabilities__click-hint" role="note">
        <span class="landing-capabilities__click-hint-icon" aria-hidden="true">
          <CursorArrowRaysIcon class="h-4 w-4" stroke-width="2" />
        </span>
        <span class="landing-capabilities__click-hint-text">
          <strong>Select a category</strong> to switch what you see
        </span>
      </p>

      <div class="landing-capabilities__frame">
        <div class="landing-capabilities__tabs-wrap">
          <div class="landing-capabilities__tabs-head">
            <p class="landing-capabilities__tabs-label">Categories</p>
            <p class="landing-capabilities__tabs-sublabel">Click to explore</p>
          </div>
          <nav class="landing-capabilities__tabs" role="tablist" aria-label="Feature categories">
            <button
              v-for="group in groups"
              :key="group.id"
              type="button"
              role="tab"
              class="landing-capabilities__tab"
              :class="{ 'landing-capabilities__tab--active': activeGroup === group.id }"
              :aria-selected="activeGroup === group.id"
              :aria-label="`${group.label}, ${groupCount(group)} features`"
              @click="selectGroup(group.id)"
            >
              <span class="landing-capabilities__tab-main">
                <span class="landing-capabilities__tab-label">{{ group.label }}</span>
                <span class="landing-capabilities__tab-count">{{ groupCount(group) }}</span>
              </span>
              <ChevronRightIcon
                class="landing-capabilities__tab-chevron"
                :class="{ 'landing-capabilities__tab-chevron--active': activeGroup === group.id }"
                aria-hidden="true"
              />
            </button>
          </nav>
        </div>

        <div class="landing-capabilities__panel">
          <div class="landing-capabilities__panel-head">
            <div class="landing-capabilities__panel-head-copy">
              <span class="landing-capabilities__viewing-badge">Now viewing</span>
              <h3 class="landing-capabilities__panel-title">{{ activeMeta.title }}</h3>
              <p class="landing-capabilities__panel-desc">{{ activeMeta.description }}</p>
            </div>
            <img
              :key="activeGroup"
              :src="activeMeta.illustration"
              :alt="activeMeta.illustrationAlt"
              class="landing-capabilities__panel-illustration"
              loading="lazy"
              width="88"
              height="88"
            />
            <NuxtLink
              v-if="activeGroup === 'enterprise'"
              to="/pricing"
              class="landing-capabilities__panel-link"
            >
              Compare plans
            </NuxtLink>
          </div>

          <nav
            v-if="activeGroup === 'more' && moreSubcategories.length"
            class="landing-capabilities__subtabs"
            role="tablist"
            aria-label="More feature topics"
          >
            <p class="landing-capabilities__subtabs-hint">Click a topic</p>
            <div class="landing-capabilities__subtabs-row">
              <button
                v-for="sub in moreSubcategories"
                :key="sub.id"
                type="button"
                role="tab"
                class="landing-capabilities__subtab"
                :class="{ 'landing-capabilities__subtab--active': activeMoreSub === sub.id }"
                :aria-selected="activeMoreSub === sub.id"
                @click="activeMoreSub = sub.id"
              >
                {{ sub.label }}
              </button>
            </div>
          </nav>

          <ul class="landing-capabilities__list" role="tabpanel" :aria-label="activeMeta.title">
            <li
              v-for="item in visibleItems"
              :key="`${activeGroup}-${item.title}`"
              class="landing-capabilities__item"
            >
              <span class="landing-capabilities__icon" aria-hidden="true">
                <component :is="item.icon" class="h-5 w-5" stroke-width="1.5" />
              </span>
              <div class="landing-capabilities__item-body">
                <h4 class="landing-capabilities__item-title">{{ item.title }}</h4>
                <p class="landing-capabilities__item-desc">{{ item.description }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="otherGroups.length" class="landing-capabilities__also">
        <p class="landing-capabilities__also-label">Also explore</p>
        <div class="landing-capabilities__also-row">
          <button
            v-for="group in otherGroups"
            :key="group.id"
            type="button"
            class="landing-capabilities__also-btn"
            @click="selectGroup(group.id)"
          >
            {{ group.label }}
            <span class="landing-capabilities__also-count">{{ groupCount(group) }}</span>
          </button>
        </div>
      </div>

      <p class="landing-capabilities__footer">
        Questions?
        <a
          href="#faq"
          class="landing-capabilities__footer-link"
          @click.prevent="emit('navigate', 'faq')"
        >
          Read the FAQ
        </a>
        <span class="landing-capabilities__footer-sep" aria-hidden="true">·</span>
        After sign-in, open <span class="landing-capabilities__footer-strong">Help</span> or
        <span class="landing-capabilities__footer-strong">Ask assistant</span> for walkthroughs.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BellAlertIcon,
  BoltIcon,
  BookmarkSquareIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  FolderIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Square2StackIcon,
  UserGroupIcon,
  UsersIcon,
} from '~/utils/app-icons'

const emit = defineEmits<{
  navigate: [sectionId: string]
}>()

interface CapabilityItem {
  icon: Component
  title: string
  description: string
}

interface CapabilityGroup {
  id: string
  label: string
  title: string
  description: string
  illustration: string
  illustrationAlt: string
  items: CapabilityItem[]
}

interface MoreSubcategory {
  id: string
  label: string
  items: CapabilityItem[]
}

const coreItems: CapabilityItem[] = [
  {
    icon: FolderIcon,
    title: 'Inventory categories',
    description:
      'Top-level folders with optional one-level subcategories (for example Toyota → Corolla). Serial or bulk quantity modes per category.',
  },
  {
    icon: CubeIcon,
    title: 'Custom product fields',
    description:
      'Text, number, date, currency, select, and boolean columns per category template. Profit and cost tracking where enabled.',
  },
  {
    icon: ReceiptPercentIcon,
    title: 'Sales, receipts & returns',
    description:
      'Create New Sale wizard, Quick Sale drawer, refunds, split payments, and stock kept in sync when receipts complete.',
  },
  {
    icon: UserGroupIcon,
    title: 'Roles & departments',
    description:
      'Super admin, store manager, and staff logins. Departments organize teams; folder access can be scoped by department.',
  },
  {
    icon: ChartBarIcon,
    title: 'Dashboard overview',
    description:
      'Revenue KPIs, low-stock signals, inventory health, payment links summary, and recent activity on the home screen.',
  },
]

const toolsItems: CapabilityItem[] = [
  {
    icon: CreditCardIcon,
    title: 'Payment links',
    description:
      'All plans: create Paystack checkout links, connect payout accounts, and track paid, unpaid, and failed links.',
  },
  {
    icon: UsersIcon,
    title: 'Sales leads',
    description:
      'Medium+: log walk-ins, phone, WhatsApp, and referrals; assign staff; convert to a sale with customer details prefilled.',
  },
  {
    icon: BanknotesIcon,
    title: 'Customer buybacks',
    description:
      'Super admins record trade-ins: pay the customer, add the unit to inventory at purchase cost, apply swap-in credit on sales.',
  },
  {
    icon: BoltIcon,
    title: 'Quick Sale',
    description:
      'Fast checkout drawer with parent → subcategory → items, barcode scanning, and the same stock rules as the full wizard.',
  },
  {
    icon: ShareIcon,
    title: 'Receipt delivery',
    description:
      'WhatsApp (10/month on Micro, unlimited on Medium+), email, PDF, print, and shareable receipt links.',
  },
  {
    icon: MagnifyingGlassIcon,
    title: 'Global search',
    description:
      '⌘K / Ctrl+K across receipts, inventory, and customers. Saved searches for frequent filters.',
  },
  {
    icon: BellAlertIcon,
    title: 'Low-stock alerts',
    description:
      'Per-category thresholds on web and an All | Low stock filter on the iOS inventory list.',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics & exports',
    description:
      'Medium+: daily, weekly, or monthly reports, feature insight cards, peak hours, heatmaps, PDF and Excel export.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Activity logs',
    description:
      'Medium+: dated audit trail of inventory, sales, and settings changes for super admins and managers.',
  },
  {
    icon: BanknotesIcon,
    title: 'Customer balance ledger',
    description:
      'Medium+: balance-due sales, credit applied, payment reminders, and outstanding balance on Analytics.',
  },
  {
    icon: Square2StackIcon,
    title: 'Duplicate category',
    description:
      'Medium+: clone a folder template within the same branch. Enterprise adds copy-from-branch across stores.',
  },
  {
    icon: SparklesIcon,
    title: 'Storvv Assistant',
    description:
      'In-app guide powered by Gemini on your server: workflows, permissions, and plan limits (no live store data).',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'iOS native app',
    description:
      'Capacitor app with bottom tabs, pull-to-refresh, swipe actions on sales, native sheets, and the same data as web.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Data export',
    description:
      'Export inventory ZIPs, reorder lists from low-stock reports, and analytics PDF/Excel on supported plans.',
  },
]

const enterpriseItems: CapabilityItem[] = [
  {
    icon: BanknotesIcon,
    title: 'Stock loans',
    description:
      'Lend serial-tracked units to borrowers; mark sold, returned, or complete via sales and loan actions.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Multi-store sync & transfers',
    description:
      'Move stock between branches with request → approve → in transit → complete flows and transfer history.',
  },
  {
    icon: Square2StackIcon,
    title: 'Copy from branch',
    description:
      'Copy category templates (names, columns, serial mode) from one branch to another; optional subcategory hierarchy.',
  },
  {
    icon: ChartBarIcon,
    title: 'Consolidated reporting',
    description:
      'Enterprise operators review performance and transfer history across all locations from one login.',
  },
  {
    icon: LockClosedIcon,
    title: 'Priority support',
    description:
      'Enterprise includes priority support for multi-branch rollout, transfers, and stock-loan workflows.',
  },
]

const moreSubcategories: MoreSubcategory[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    items: [
      {
        icon: FolderIcon,
        title: 'Subcategory hubs',
        description:
          'Optional Organize with subcategories when creating a category. Products live in leaf folders only.',
      },
      {
        icon: CubeIcon,
        title: 'Serial vs quantity',
        description:
          'Track individual serial lines or pooled counts per category. Stock loans apply to serial folders.',
      },
      {
        icon: ArrowDownTrayIcon,
        title: 'Reorder list export',
        description: 'Export a supplier-ready sheet from low-stock lines on Analytics or inventory views.',
      },
      {
        icon: BellAlertIcon,
        title: 'Department folder access',
        description: 'Restrict categories to specific departments; staff only see allowed folders.',
      },
      {
        icon: GlobeAltIcon,
        title: 'Region-aware branches',
        description:
          'Branch names use cities from your onboarding country plus an optional area or neighborhood suffix.',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    items: [
      {
        icon: BoltIcon,
        title: 'Create New Sale',
        description:
          'Four steps: parent category, subcategory when needed, items and quantities, then customer and payment.',
      },
      {
        icon: ReceiptPercentIcon,
        title: 'Customers tab',
        description:
          'Customer directory on the Sales screen with search, pagination, and balance views on Medium+.',
      },
      {
        icon: ArrowPathIcon,
        title: 'Returns & refunds',
        description: 'Process refunds per receipt; filter by Refunded status to audit completed returns.',
      },
      {
        icon: DocumentTextIcon,
        title: 'Sell screen notes',
        description:
          'Optional branch reminders shown on Quick Sale and Create New Sale after a category is picked.',
      },
      {
        icon: UsersIcon,
        title: 'Lead → sale conversion',
        description:
          'Completing a sale from a lead marks it Won and links the receipt for follow-up reporting.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    items: [
      {
        icon: CreditCardIcon,
        title: 'Paystack checkout links',
        description: 'Share a link; customer pays remotely. Summary cards on Dashboard and Analytics.',
      },
      {
        icon: BanknotesIcon,
        title: 'Payout accounts',
        description: 'Connect bank details and review settlements for payment-link collections.',
      },
      {
        icon: ShareIcon,
        title: 'WhatsApp receipts',
        description: 'Share receipts from the sales flow. Micro: 10 sends per month; Medium+: unlimited.',
      },
      {
        icon: BanknotesIcon,
        title: 'Balance due & credit',
        description: 'Record part-payments and track what each customer still owes over time.',
      },
      {
        icon: CreditCardIcon,
        title: 'Subscription billing',
        description:
          'Upgrade in Settings with live price preview. Paystack auto-renew (monthly, quarterly, yearly), billing history, and cancel anytime with grace until period end.',
      },
    ],
  },
  {
    id: 'teams',
    label: 'Teams',
    items: [
      {
        icon: UserGroupIcon,
        title: 'Staff invites',
        description:
          'Super admins create logins and email sign-in details. Managers cannot create staff accounts.',
      },
      {
        icon: UserGroupIcon,
        title: 'Manager vs staff',
        description:
          'Managers edit receipts and refunds; standard staff create sales but cannot change catalog structure.',
      },
      {
        icon: BellAlertIcon,
        title: 'In-app notifications',
        description: 'Bell dropdown and full notifications page for operational alerts.',
      },
      {
        icon: LockClosedIcon,
        title: '2FA & password',
        description: 'Profile security: two-factor authentication, password change, and receipt terms for owners.',
      },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    items: [
      {
        icon: ChartBarIcon,
        title: 'Feature insights',
        description:
          'Cards for sales, returns, outstanding balances, inventory health, buybacks, loans, and payment links.',
      },
      {
        icon: ChartBarIcon,
        title: 'Charts & heatmaps',
        description: 'Revenue trends, top products, peak hours, sales by hour/day, and traffic heatmaps.',
      },
      {
        icon: ArrowDownTrayIcon,
        title: 'PDF & Excel export',
        description: 'Download period reports for the active branch. iOS uses an Export sheet for the same formats.',
      },
      {
        icon: ArrowPathIcon,
        title: 'Transfer history',
        description: 'Enterprise: audit past stock movements between branches.',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        icon: GlobeAltIcon,
        title: 'Solo vs Business workspace',
        description:
          'Solo (Just me): focused layout for owner-operators. Unlock team and branch tools in Advanced features when ready. Business: full navigation for staff and multi-location ops. Switch anytime in Settings.',
      },
      {
        icon: GlobeAltIcon,
        title: 'Web + mobile',
        description:
          'Same account on app.storvv.com and the native iOS app. Solo/Business switcher, subscription upgrades, and billing history on both.',
      },
      {
        icon: GlobeAltIcon,
        title: 'Stores per plan',
        description: 'Micro: 1 store · Medium: 2 · Enterprise: unlimited. Staff and department caps scale with plan.',
      },
      {
        icon: GlobeAltIcon,
        title: 'Currency & onboarding',
        description: 'Pick country and currency during setup; money fields and branch cities follow your region.',
      },
      {
        icon: ChatBubbleLeftRightIcon,
        title: 'Help center',
        description: 'Searchable guides for every screen, plan limits, and the iOS native layout.',
      },
      {
        icon: BookmarkSquareIcon,
        title: 'Dashboard tour',
        description: 'Interactive tutorial on first visit; replay anytime from Help center.',
      },
      {
        icon: CloudArrowUpIcon,
        title: 'Interactive demo',
        description:
          'Try the full Enterprise dashboard with fictional sample data in your browser before signing up.',
      },
    ],
  },
]

const groups: CapabilityGroup[] = [
  {
    id: 'core',
    label: 'Core',
    title: 'Daily operations',
    description: 'Inventory, sales, teams, and dashboard - included on every plan.',
    illustration: '/marketing/illustrations/category-tree-icon.png',
    illustrationAlt: 'Folder tree showing nested inventory categories and subcategories',
    items: coreItems,
  },
  {
    id: 'tools',
    label: 'Growth',
    title: 'Growth & automation',
    description: 'Payment links on all plans; analytics, leads, and ledgers from Medium upward.',
    illustration: '/marketing/illustrations/receipt-illustration.png',
    illustrationAlt: 'A hand holding a paper receipt',
    items: toolsItems,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    title: 'Multi-branch scale',
    description: 'Stock loans, transfers, and template copy for operators with many locations.',
    illustration: '/marketing/illustrations/sync-icon.png',
    illustrationAlt: 'Two connected devices syncing a shared folder of data',
    items: enterpriseItems,
  },
  {
    id: 'more',
    label: 'More',
    title: 'More capabilities',
    description: 'Deeper options grouped by topic. Pick a filter below.',
    illustration: '/marketing/illustrations/inventory-hexagon-icon.png',
    illustrationAlt: 'A tracked inventory unit connected across the platform',
    items: [],
  },
]

const activeGroup = ref(groups[0]!.id)
const activeMoreSub = ref(moreSubcategories[0]!.id)

const activeMeta = computed(() => {
  const group = groups.find((g) => g.id === activeGroup.value) ?? groups[0]!
  return {
    title: group.title,
    description: group.description,
    illustration: group.illustration,
    illustrationAlt: group.illustrationAlt,
  }
})

const visibleItems = computed(() => {
  if (activeGroup.value === 'more') {
    const sub = moreSubcategories.find((s) => s.id === activeMoreSub.value)
    return sub?.items ?? []
  }
  const group = groups.find((g) => g.id === activeGroup.value)
  return group?.items ?? []
})

const otherGroups = computed(() => groups.filter((g) => g.id !== activeGroup.value))

function groupCount(group: CapabilityGroup) {
  if (group.id === 'more') {
    return moreSubcategories.reduce((n, s) => n + s.items.length, 0)
  }
  return group.items.length
}

function selectGroup(id: string) {
  activeGroup.value = id
  if (id === 'more') {
    activeMoreSub.value = moreSubcategories[0]!.id
  }
}
</script>

<style scoped>
.landing-capabilities__panel-illustration {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: contain;
  flex-shrink: 0;
  animation: landing-cap-illustration-in 260ms ease-out;
}

@keyframes landing-cap-illustration-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(2px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 639px) {
  .landing-capabilities__panel-illustration {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-capabilities__panel-illustration {
    animation: none;
  }
}
</style>
