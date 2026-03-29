<template>
  <div class="w-full max-w-none space-y-4 pb-10 sm:space-y-5 sm:pb-12">
    <header
      class="rounded-sm border border-gray-200/80 bg-white/90 px-4 py-4 dark:border-gray-800/80 dark:!bg-dashboard-card sm:px-5 sm:py-5"
    >
      <div class="min-w-0">
        <p class="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          Help
        </p>
        <h1 class="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
          Help center
        </h1>
        <p class="mt-1 max-w-2xl text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          How Storvv works: permissions, screens, and plan limits. Filter topics by keyword or open a common screen below.
        </p>
      </div>

      <div class="mt-3 space-y-3 border-t border-gray-100/90 pt-3 dark:border-gray-800/80">
        <label for="help-search" class="sr-only">Search help articles</label>
        <div class="relative max-w-md">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            stroke-width="1.75"
          />
          <input
            id="help-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            placeholder="Search help topics..."
            class="w-full rounded-sm border border-gray-200/90 bg-white py-2 pl-8 pr-3 text-[11px] text-gray-900 placeholder:text-gray-400 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/50"
          />
        </div>
        <div v-if="searchQuery" class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            @click="searchQuery = ''"
          >
            Clear search
          </button>
        </div>

        <div>
          <p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Popular topics
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="topic in popularTopics"
              :key="topic.query"
              type="button"
              class="rounded-full border border-gray-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-primary-300/60 hover:bg-primary-50/80 hover:text-primary-800 dark:border-gray-700 dark:!bg-dashboard-card/60 dark:text-gray-200 dark:hover:border-primary-600/50 dark:hover:bg-primary-950/40 dark:hover:text-primary-200"
              @click="searchQuery = topic.query"
            >
              {{ topic.label }}
            </button>
          </div>
        </div>

        <div>
          <p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Common screens
          </p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="link in quickScreenLinks"
              :key="link.to"
              :to="link.to"
              class="inline-flex items-center rounded-full border border-gray-200/90 bg-gray-50/90 px-2.5 py-1 text-[11px] font-medium text-gray-800 transition-colors hover:border-primary-300/50 hover:bg-white hover:text-primary-800 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:hover:border-primary-600/40 dark:hover:bg-gray-800"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-col items-start gap-4 lg:flex-row lg:gap-5">
      <nav
        aria-label="Topics"
        class="w-full shrink-0 rounded-sm border border-gray-200/80 bg-white/95 p-3 dark:border-gray-800/70 dark:!bg-dashboard-card lg:sticky lg:top-14 lg:z-10 lg:w-52 lg:max-h-[calc(100dvh-4rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:p-3.5"
      >
        <p class="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          On this page
        </p>
        <ul class="space-y-0.5">
          <li v-for="cat in filteredCategories" :key="cat.id">
            <a
              :href="`#${cat.id}`"
              class="block rounded-sm px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100"
              @click.prevent="scrollToSection(cat.id)"
              v-html="highlightText(cat.title, trimmedSearch)"
            ></a>
          </li>
        </ul>
        <p v-if="filteredCategories.length === 0" class="py-2 text-xs text-gray-500 dark:text-gray-400">
          No topics match "{{ searchQuery }}". Try another word or clear the filter.
        </p>
      </nav>

      <div class="min-w-0 flex-1 space-y-8">
        <section
          v-for="cat in filteredCategories"
          :id="cat.id"
          :key="cat.id"
          class="scroll-mt-24 sm:scroll-mt-28"
        >
          <div class="mb-3 flex items-start gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gray-200/80 bg-gray-50/90 dark:border-gray-700/60 dark:bg-gray-800/50"
            >
              <component :is="cat.icon" class="h-4 w-4 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
            </div>
            <div class="min-w-0">
              <h2
                class="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100"
                v-html="highlightText(cat.title, trimmedSearch)"
              ></h2>
              <p
                class="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
                v-html="highlightText(cat.blurb, trimmedSearch)"
              ></p>
            </div>
          </div>

          <div class="space-y-3">
            <article
              v-for="(article, idx) in cat.articles"
              :key="idx"
              class="rounded-sm border border-gray-200/80 bg-white/95 px-4 py-3.5 dark:border-gray-800/70 dark:!bg-dashboard-card sm:px-4 sm:py-4"
            >
              <h3
                class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-100"
                v-html="highlightText(article.title, trimmedSearch)"
              ></h3>
              <div class="mt-2 space-y-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                <p
                  v-for="(para, pIdx) in article.body"
                  :key="pIdx"
                  v-html="highlightText(para, trimmedSearch)"
                ></p>
                <ul
                  v-if="article.bullets?.length"
                  class="list-disc space-y-1 pl-4 marker:text-gray-400 dark:marker:text-gray-500"
                >
                  <li
                    v-for="(b, bIdx) in article.bullets"
                    :key="bIdx"
                    v-html="highlightText(b, trimmedSearch)"
                  ></li>
                </ul>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <button
      v-show="showBackToTop"
      type="button"
      class="fixed bottom-5 right-5 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/90 bg-white text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:!bg-dashboard-card dark:text-gray-100 dark:hover:bg-gray-800"
      aria-label="Back to top"
      @click="scrollToTop"
    >
      <ArrowUpIcon class="h-4 w-4" stroke-width="2" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  ArrowUpIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  Squares2X2Icon,
  CubeIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Help center - Storvv',
})

type Article = {
  title: string
  body: string[]
  bullets?: string[]
}

type Category = {
  id: string
  title: string
  blurb: string
  icon: Component
  articles: Article[]
}

const categories: Category[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    blurb: 'Roles, stores, and first-time setup inside Storvv.',
    icon: SparklesIcon,
    articles: [
      {
        title: 'What Storvv does in this app',
        body: [
          'Storvv is your operational workspace: inventory lives in folders and items, sales are recorded as receipts (with customers on the same Sales screen), and optional areas include Analytics, Activity Logs, Departments, and Multi-Store Sync depending on your subscription.',
          'Nearly all data is tied to the store that is active for your session. Super admins switch stores from the store selector in the header; managers and staff work inside the store they have been assigned.',
          'The sidebar lists real product routes: Dashboard, Inventory, Receipts, Analytics, Activity Logs, Multi-Store Sync, Help center, Settings, and Profile. Items such as Analytics or Multi-Store Sync only appear when your plan includes them.',
        ],
      },
      {
        title: 'Super admin, manager, and staff',
        body: [
          'Super admins are account owners: they can edit Settings (store profile, inventory defaults, receipt numbering, Paystack subscription upgrades), create folders and edit item definitions, delete receipts, create staff logins, and run Multi-Store Sync when the plan allows.',
          'Staff users sign in with their own email and password. A staff user is either a store manager or standard staff. Managers can edit receipts and run refunds; standard staff are mostly read-only for inventory structure and settings but can still create new receipts.',
          'Only super admins can create inventory folders, change item rows, or delete receipts. Only super admins can add staff accounts; managers cannot.',
        ],
        bullets: [
          'If a control is missing or disabled, check role (super admin vs staff) and subscription first.',
          'Use separate logins per teammate so Activity Logs stay meaningful.',
        ],
      },
      {
        title: 'Account setup (onboarding)',
        body: [
          'New accounts complete Account setup on the Onboarding wizard: currency and country (used for every money field and format), then store details. Finish onboarding before relying on totals in reports.',
          'The Dashboard can show a Tutorial that highlights key UI areas; complete or dismiss it from the Dashboard when you are ready.',
        ],
      },
    ],
  },
  {
    id: 'navigation-search',
    title: 'Navigation & search',
    blurb: 'Sidebar, store switcher, global search, and theme.',
    icon: Squares2X2Icon,
    articles: [
      {
        title: 'Sidebar and header',
        body: [
          'The sidebar collapses on desktop to an icon rail or expands to show labels. On mobile, open it with the grid button in the top bar.',
          'The header shows the active page name (on medium screens and up), opens Global Search, shows the store selector for super admins only, theme toggle, notifications, and your profile menu (Profile, Settings, Sign out).',
        ],
      },
      {
        title: 'Global search (⌘K / Ctrl+K)',
        body: [
          'Click Search in the header or press ⌘K on Mac / Ctrl+K on Windows. The modal searches receipts, inventory, and customers and offers quick filters by entity type.',
          'Use arrow keys to move through results, Enter to open a result, Esc to close; this matches the on-screen hints.',
        ],
      },
      {
        title: 'Working in the correct store',
        body: [
          'Super admins must pick the right store in the header before editing inventory, recording sales, or reading Analytics; each screen reads the active store’s data only.',
          'If Analytics says to select a store, use the header selector (super admins) or ask an admin to confirm you have an assigned store.',
        ],
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    blurb: 'Folders page, folder detail, items, and Storvv permissions.',
    icon: CubeIcon,
    articles: [
      {
        title: 'Folders list (/dashboard/inventory)',
        body: [
          'The Inventory entry opens Folders with the subtitle “Organize products into folders and manage stock in one place”. Search, sort, and paginate folders; super admins can create, rename, delete, and bulk-delete folders where the UI provides those actions.',
          'Storvv Micro may show DuplicateFeatureUpsellBanner messaging next to the title when folder limits apply; upgrade paths point toward Settings and higher plans.',
        ],
      },
      {
        title: 'Inside a folder (/dashboard/inventory/[id])',
        body: [
          'Each folder opens a table of items with the columns your account template defines. Use pagination and filters from the toolbar as needed.',
          'Row actions (three-dot menu) include History (item timeline), Add discount / Discount for line-level pricing, and Edit item when the item is not locked. Items tied to completed sales can be restricted so catalog edits do not fight receipt history.',
        ],
      },
      {
        title: 'Who can change inventory',
        body: [
          'Folder creation, item creation, and editing item definitions require a super admin. Managers and staff pick from the catalog when building receipts but cannot create folders or redefine items.',
          'Quantities typically move when receipts complete or refunds process; use those flows plus super-admin corrections rather than informal workarounds.',
        ],
      },
    ],
  },
  {
    id: 'sales-receipts-customers',
    title: 'Sales: receipts & customers',
    blurb: 'The Sales page (/dashboard/receipts), permissions, and refunds.',
    icon: ReceiptPercentIcon,
    articles: [
      {
        title: 'Sales page: Receipts and Customers tabs',
        body: [
          'Sidebar label is Receipts, but the page title reads “Sales” with subtitle “Manage receipts, customers, and returns”. Two tabs exist: Receipts (default) and Customers.',
          'Receipts shows totals for receipt count, sales amount, today, and month, plus search, status filters (All, Completed, Pending, Refunded), and date filters (All dates, Today, This week, This month). Use fullscreen mode for dense lists; filters stay pinned at the top.',
          'Use the “New receipt” button in the receipts table toolbar (top of the list) to open Create New Receipt.',
        ],
      },
      {
        title: 'Create New Receipt (three steps)',
        body: [
          'The modal title is “Create New Receipt” with subtitle “Select folder, items, then enter receipt details.” Step 1: Select Folder (search folders; empty state tells you to create folders in Inventory first). Step 2: Select Items and quantities from that folder. Step 3: Receipt Details; customer fields, payment method, Completed or Pending status, and notes.',
          'Super admins can enable swap-in style lines inside the receipt flow when your business records trade-ins alongside standard SKUs.',
        ],
      },
      {
        title: 'Receipt actions and roles',
        body: [
          'View, print, and PDF actions run from the receipt detail and timeline views where those buttons appear. Refunds use the return flow on each receipt for users with edit rights.',
          'Super admins and store managers may edit receipt-level details and process refunds; standard staff cannot change completed receipts that way. Only super admins can delete a receipt from the delete action, which may offer a short undo window in the notification.',
        ],
      },
      {
        title: 'Customers tab',
        body: [
          'Switch to Customers to search and maintain the customer directory used when filling receipt details. The tab has its own pagination and fullscreen option parallel to receipts.',
        ],
      },
      {
        title: 'Returns and refunds',
        body: [
          'Returns are processed per receipt via the Return flow (not a separate third tab). Filter the Receipts list with status Refunded to audit completed refunds.',
          'Bookmarks to /dashboard/returns redirect into Sales; stay on the Receipts tab and open the return / refund action on the row when you have permission.',
        ],
        bullets: [
          'Match the correct receipt before refunding so inventory and totals reconcile.',
          'If something looks wrong after a refund, managers and super admins should coordinate before editing underlying data.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    blurb: '/dashboard/analytics: metrics, charts, exports.',
    icon: ChartBarIcon,
    articles: [
      {
        title: 'Analytics page',
        body: [
          'Analytics & Reports (/dashboard/analytics) appears when your subscription exposes it in the sidebar (Storvv Medium and Enterprise include analytics navigation; Storvv Micro focuses on core sales and inventory).',
          'You must select a store first; the page shows a centered prompt with a link to Settings if nothing is selected.',
          'Use the period picker: Daily, Weekly, or Monthly. Cards summarize total revenue (with % change vs previous), total sales and order counts, average order value, low stock count, and refund totals.',
        ],
      },
      {
        title: 'Charts and exports',
        body: [
          'Charts include revenue trend visuals for the active period label.',
          'Export PDF and Export Excel buttons in the header download reports for the current store and period; they disable while an export is running.',
        ],
      },
    ],
  },
  {
    id: 'activity-logs',
    title: 'Activity Logs',
    blurb: '/dashboard/activity: inventory audit trail.',
    icon: ShieldCheckIcon,
    articles: [
      {
        title: 'Who sees Activity Logs',
        body: [
          'Activity Logs is limited to super admins and store managers. Standard staff see an access denied message.',
          'The feature requires Storvv Medium or Storvv Enterprise. Micro accounts see an upgrade notice with a shortcut to Settings.',
          'Pick a store, then review the table columns User, Action, Item, and Date. Empty state explains that editing inventory will produce entries over time.',
        ],
      },
    ],
  },
  {
    id: 'departments-staff',
    title: 'Departments & staff',
    blurb: 'Department routes and how staff accounts are created.',
    icon: BuildingOfficeIcon,
    articles: [
      {
        title: 'Departments',
        body: [
          'The department directory is at /dashboard/departments; opening a department goes to /dashboard/departments/[id] for staff and department settings. Super admins also see each store in the sidebar under Stores; expand a store to open department shortcuts or “View departments” for that location.',
          'Use these screens to organize teams, roles, and staff per department. How many departments and staff you can add depends on your plan; check caps and upgrades in Settings.',
        ],
      },
      {
        title: 'Creating staff',
        body: [
          'Super admins create staff logins with email and password (share credentials securely outside the app; there is no automated invite email in the default flow). Managers cannot create staff.',
          'Assign each person as store manager or standard staff so receipt edits, refunds, and locked-down areas match their role.',
        ],
      },
    ],
  },
  {
    id: 'multi-store',
    title: 'Multi-Store Sync',
    blurb: '/dashboard/multi-store-sync: Enterprise transfers.',
    icon: ArrowsRightLeftIcon,
    articles: [
      {
        title: 'Access',
        body: [
          'Multi-Store Sync lives at /dashboard/multi-store-sync. Storvv Enterprise unlocks it in the sidebar; super admins are the only role that can use the tools. Staff users see “Access restricted”.',
        ],
      },
      {
        title: 'Transfer Items, Consolidated Reports, Transfer History',
        body: [
          'Transfer Items: pick source store, destination store, destination folder, then SKUs and quantities. The page explains the flow request → approve → in transit (optional tracking) → complete so stock updates in both branches.',
          'Consolidated Reports summarizes performance across locations; Transfer History lists past transfers for auditing.',
        ],
      },
    ],
  },
  {
    id: 'settings-subscription',
    title: 'Settings & subscription',
    blurb: '/dashboard/settings: Paystack upgrades and store defaults.',
    icon: Cog6ToothIcon,
    articles: [
      {
        title: 'Super-admin-only editing',
        body: [
          'Only super admins can edit Settings. Others see a View only banner while fields stay disabled.',
          'Super admins manage account logo, Paystack subscription upgrades between Storvv Micro, Medium, and Enterprise, store profile data (branch name, business type, contact fields), inventory defaults (low stock threshold, default category), and receipt numbering (prefix + next number).',
        ],
      },
      {
        title: 'Plan tiers',
        body: [
          'Storvv Micro: core dashboard, inventory, Sales (receipts + customers + refunds), notifications, Help center, Profile.',
          'Storvv Medium adds Analytics, Activity Logs, Departments, and higher caps for stores, departments, and staff.',
          'Storvv Enterprise adds Multi-Store Sync with unlimited-scale positioning for stores/departments/staff per marketing copy inside Settings.',
        ],
      },
    ],
  },
  {
    id: 'profile-notifications',
    title: 'Profile, password & notifications',
    blurb: '/dashboard/profile, security, and alerts.',
    icon: UserCircleIcon,
    articles: [
      {
        title: 'Profile & 2FA',
        body: [
          'Profile (/dashboard/profile) is where you manage your name, contact info, and security; Two-Factor Authentication can be turned on or off using the prompts on that page.',
          'Password changes use the Change password screen (/dashboard/change-password), linked from Profile.',
        ],
      },
      {
        title: 'Notifications',
        body: [
          'Click the bell for the dropdown NotificationsPanel. Full-page alerts live at /dashboard/notifications using the same component in page mode.',
        ],
      },
      {
        title: 'Help center search',
        body: [
          'The search box on this page filters only these help topics; it does not search your store data. Use Global Search in the header for receipts, inventory, and customers.',
        ],
      },
    ],
  },
]

const router = useRouter()

const searchQuery = ref('')
const showBackToTop = ref(false)

const popularTopics = [
  { label: 'Staff & roles', query: 'staff' },
  { label: 'Receipts & refunds', query: 'receipt' },
  { label: 'Inventory & folders', query: 'inventory' },
  { label: 'Plans & billing', query: 'plan' },
  { label: 'Departments', query: 'department' },
] as const

const quickScreenLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory', to: '/dashboard/inventory' },
  { label: 'Receipts', to: '/dashboard/receipts' },
  { label: 'Settings', to: '/dashboard/settings' },
  { label: 'Profile', to: '/dashboard/profile' },
] as const

const trimmedSearch = computed(() => searchQuery.value.trim())

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Safe for v-html: escapes source text, wraps case-insensitive query matches in <mark>. */
function highlightText(text: string, needle: string): string {
  const escaped = escapeHtml(text)
  const q = needle.trim()
  if (!q) {
    return escaped
  }
  const qEscaped = escapeHtml(q)
  const re = new RegExp(escapeRegExp(qEscaped), 'gi')
  return escaped.replace(
    re,
    (m) =>
      `<mark class="rounded px-0.5 bg-amber-200/95 text-gray-900 dark:bg-amber-400/30 dark:text-gray-100">${m}</mark>`,
  )
}

function textMatches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

const filteredCategories = computed(() => {
  const n = searchQuery.value.trim()
  if (!n) {
    return categories
  }

  return categories
    .map((cat) => {
      const catText = `${cat.title} ${cat.blurb}`
      const articles = cat.articles.filter((a) => {
        const inTitle = textMatches(a.title, n)
        const inBody = a.body.some((p) => textMatches(p, n))
        const inBullets = a.bullets?.some((b) => textMatches(b, n)) ?? false
        return inTitle || inBody || inBullets
      })
      const catMatch = textMatches(catText, n)
      if (articles.length > 0) {
        return { ...cat, articles }
      }
      if (catMatch) {
        return cat
      }
      return null
    })
    .filter((c): c is Category => c !== null)
})

function scrollToSection(id: string) {
  if (!import.meta.client) return
  router.replace({ hash: `#${id}` })
  nextTick(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function scrollToTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onHelpScroll() {
  if (!import.meta.client) return
  showBackToTop.value = window.scrollY > 320
}

onMounted(() => {
  if (!import.meta.client) return
  const h = window.location.hash
  if (h.length > 1) {
    const id = h.slice(1)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  onHelpScroll()
  window.addEventListener('scroll', onHelpScroll, { passive: true })
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', onHelpScroll)
  }
})
</script>
