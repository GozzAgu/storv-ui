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
          Everything else Storvv includes
        </h2>
        <p class="landing-capabilities__lede">
          Core tools sit above. Click a category below to browse the rest.
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
          <nav
            class="landing-capabilities__tabs"
            role="tablist"
            aria-label="Feature categories"
          >
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
            <a
              v-if="activeGroup === 'enterprise'"
              href="#pricing"
              class="landing-capabilities__panel-link"
              @click.prevent="emit('navigate', 'pricing')"
            >
              Compare plans
            </a>
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

          <ul
            class="landing-capabilities__list"
            role="tabpanel"
            :aria-label="activeMeta.title"
          >
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
        <a href="#faq" class="landing-capabilities__footer-link" @click.prevent="emit('navigate', 'faq')">
          Read the FAQ
        </a>
        <span class="landing-capabilities__footer-sep" aria-hidden="true">·</span>
        After sign-in, open <span class="landing-capabilities__footer-strong">Help</span> for walkthroughs.
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
  DocumentTextIcon,
  FolderIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  ShareIcon,
  ShieldCheckIcon,
  Square2StackIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'

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
    title: 'Inventory tracking',
    description: 'Serial lines or pooled counts. Search ties items, receipts, and alerts.',
  },
  {
    icon: ReceiptPercentIcon,
    title: 'Receipts & sales',
    description: 'Discounts, swaps, refunds, and split payments with stock kept in sync.',
  },
  {
    icon: UserGroupIcon,
    title: 'Teams & departments',
    description: 'Roles scoped to folders. Scale staff without retraining the floor.',
  },
]

const toolsItems: CapabilityItem[] = [
  {
    icon: CreditCardIcon,
    title: 'Payment links',
    description: 'In progress: send a Paystack pay-by-link; stock and receipts update on payment.',
  },
  {
    icon: ShareIcon,
    title: 'Receipt sharing',
    description: 'Send receipts over WhatsApp, email, PDF, or a public link.',
  },
  {
    icon: BoltIcon,
    title: 'Quick sale',
    description: 'Ring a fast over-the-counter sale without the full wizard.',
  },
  {
    icon: BellAlertIcon,
    title: 'Low-stock alerts',
    description: 'Per-folder thresholds before shelves run empty.',
  },
  {
    icon: CloudArrowUpIcon,
    title: 'Offline mode',
    description: 'Keep selling when the network drops; changes sync when back online.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Excel import & export',
    description: 'Bulk load spreadsheets and export catalogs for finance.',
  },
  {
    icon: ArrowDownTrayIcon,
    title: 'Reorder list export',
    description: 'One-click low-stock reorder sheet for suppliers.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Activity logs',
    description: 'Medium+: dated trails supervisors can review.',
  },
  {
    icon: UsersIcon,
    title: 'CRM from receipts',
    description: 'Customer profiles build from optional receipt fields.',
  },
  {
    icon: BanknotesIcon,
    title: 'Balance & credit ledger',
    description: 'Medium+: track balance-due sales and customer credit over time.',
  },
  {
    icon: MagnifyingGlassIcon,
    title: 'Unified search',
    description: 'One search across inventory, receipts, and customers, with saved searches.',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics & exports',
    description: 'Medium+: pacing, tops, busy hours, and CSV summaries.',
  },
]

const enterpriseItems: CapabilityItem[] = [
  {
    icon: BanknotesIcon,
    title: 'Stock loans',
    description: 'Lend serialized lines, then sell via receipts or borrower flows.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Branch transfers',
    description: 'Move units between locations with audit-friendly lineage.',
  },
  {
    icon: Square2StackIcon,
    title: 'Copy from branch',
    description: 'Clone folder templates without overwriting live quantities.',
  },
  {
    icon: LockClosedIcon,
    title: 'Permissions & audits',
    description: 'Tighter governance across branches and roles.',
  },
]

const moreSubcategories: MoreSubcategory[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    items: [
      {
        icon: CubeIcon,
        title: 'Returns & swap-ins',
        description: 'Walk back a receipt without orphaned stock.',
      },
      {
        icon: CubeIcon,
        title: 'Serial vs pooled',
        description: 'Choose fidelity per gadget, apparel, or consumable folder.',
      },
      {
        icon: CubeIcon,
        title: 'Templates & duplicates',
        description: 'Reuse folder shapes; Medium+ dedup helpers.',
      },
      {
        icon: FolderIcon,
        title: 'Custom fields',
        description: 'Text, number, date, currency, select, and boolean per folder.',
      },
      {
        icon: ArrowDownTrayIcon,
        title: 'Reorder list export',
        description: 'Export a low-stock reorder sheet for suppliers.',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    items: [
      {
        icon: BoltIcon,
        title: 'Quick sale',
        description: 'Fast counter checkout for busy periods.',
      },
      {
        icon: ArrowPathIcon,
        title: 'Returns & refunds',
        description: 'Reverse a receipt and return stock cleanly.',
      },
      {
        icon: ReceiptPercentIcon,
        title: 'Layouts & printers',
        description: 'Readable labels for counter and auditors.',
      },
      {
        icon: ReceiptPercentIcon,
        title: 'Multi-payment tenders',
        description: 'Combine cash, transfer, and POS cleanly.',
      },
      {
        icon: ReceiptPercentIcon,
        title: 'Customer capture',
        description: 'Collect only what merchandising needs.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    items: [
      {
        icon: CreditCardIcon,
        title: 'Payment links',
        description: 'In progress: collect online with a secure Paystack pay-by-link.',
      },
      {
        icon: BanknotesIcon,
        title: 'Bank payouts & settlements',
        description: 'Connect a bank account and track what has settled.',
      },
      {
        icon: ShareIcon,
        title: 'Receipt delivery',
        description: 'WhatsApp, email, PDF, or a public share link per receipt.',
      },
      {
        icon: BanknotesIcon,
        title: 'Balance due & credit',
        description: 'Part-payments and a per-customer credit ledger.',
      },
    ],
  },
  {
    id: 'teams',
    label: 'Teams',
    items: [
      {
        icon: UserGroupIcon,
        title: 'Invites & sessions',
        description: 'Provision staff without shared master logins.',
      },
      {
        icon: UserGroupIcon,
        title: 'Department slices',
        description: 'Mirror floor, back office, and ecommerce pods.',
      },
      {
        icon: BellAlertIcon,
        title: 'Notifications',
        description: 'Approve, restock, and nudge staff in-app.',
      },
      {
        icon: LockClosedIcon,
        title: 'Role-based access',
        description: 'Super admin, manager, and staff scoped to folders.',
      },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    items: [
      {
        icon: ChartBarIcon,
        title: 'Dashboard pulse',
        description: 'Quick revenue and inventory health readouts.',
      },
      {
        icon: ChartBarIcon,
        title: 'Exports',
        description: 'CSV-friendly summaries on higher plans.',
      },
      {
        icon: ChartBarIcon,
        title: 'Transfer history',
        description: 'Enterprise sync leaves an audit trail.',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        icon: GlobeAltIcon,
        title: 'Stores per plan',
        description: 'Micro: 1 · Medium: 2 · Enterprise: unlimited.',
      },
      {
        icon: GlobeAltIcon,
        title: 'Locales & currency',
        description: 'Match receipts to how each market prices.',
      },
      {
        icon: GlobeAltIcon,
        title: 'Profile & security',
        description: 'Themes, 2FA, billing, and sessions in one hub.',
      },
      {
        icon: CloudArrowUpIcon,
        title: 'Offline mode',
        description: 'Sell through outages; data syncs when you reconnect.',
      },
      {
        icon: ChatBubbleLeftRightIcon,
        title: 'Help & onboarding',
        description: 'Guided setup, tutorials, and an in-app help center.',
      },
      {
        icon: BookmarkSquareIcon,
        title: 'Saved searches',
        description: 'Pin frequent inventory and receipt queries.',
      },
    ],
  },
]

const groups: CapabilityGroup[] = [
  {
    id: 'core',
    label: 'Core',
    title: 'Core strengths',
    description: 'Inventory, receipts, and how your team is organized.',
    items: coreItems,
  },
  {
    id: 'tools',
    label: 'Tools',
    title: 'Supporting tools',
    description: 'Helpful extras alongside your daily workflow.',
    items: toolsItems,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    title: 'For chains & auditors',
    description: 'Multi-branch governance aligned with Enterprise pricing.',
    items: enterpriseItems,
  },
  {
    id: 'more',
    label: 'More',
    title: 'More capabilities',
    description: 'Deeper options grouped by topic. Pick a filter below.',
    items: [],
  },
]

const activeGroup = ref(groups[0]!.id)
const activeMoreSub = ref(moreSubcategories[0]!.id)

const activeMeta = computed(() => {
  const group = groups.find((g) => g.id === activeGroup.value) ?? groups[0]!
  return { title: group.title, description: group.description }
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
