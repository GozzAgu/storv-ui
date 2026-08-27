<template>
  <section id="product" aria-label="Product capabilities">
    <article
      v-for="(story, index) in stories"
      :key="story.id"
      :id="story.id"
      :data-section-id="`landing-story-${story.id}`"
      class="landing-story scroll-animate scroll-animate-up"
      :class="{ 'landing-story--reverse': index % 2 === 1 }"
    >
      <div class="landing-story__inner">
        <div class="landing-story__copy">
          <p class="landing-story__eyebrow">{{ story.eyebrow }}</p>
          <h2 class="landing-story__title">{{ story.title }}</h2>
          <p class="landing-story__lede">{{ story.lede }}</p>
          <ul v-if="story.bullets?.length" class="landing-story__bullets">
            <li v-for="bullet in story.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>

        <div class="landing-story__visual">
          <div class="landing-story__mock landing-glass">
            <div class="landing-story__mock-bar" aria-hidden="true">
              <span class="landing-story__mock-dot" />
              <span class="landing-story__mock-dot" />
              <span class="landing-story__mock-dot" />
            </div>

            <template v-if="story.visual === 'inventory'">
              <div
                v-for="row in inventoryRows"
                :key="row.name"
                class="landing-story__mock-row"
              >
                <div>
                  <p class="landing-story__mock-label">{{ row.name }}</p>
                  <p class="landing-story__mock-meta">{{ row.count }} products</p>
                </div>
                <span
                  class="landing-story__mock-pill"
                  :class="row.warn ? 'landing-story__mock-pill--warn' : ''"
                >
                  {{ row.status }}
                </span>
              </div>
            </template>

            <template v-else-if="story.visual === 'sales'">
              <div class="landing-story__mock-row">
                <div>
                  <p class="landing-story__mock-label">Quick Sale</p>
                  <p class="landing-story__mock-meta">iPhone 15 Pro · barcode scan</p>
                </div>
                <span class="landing-story__mock-pill">Paid</span>
              </div>
              <div class="landing-story__mock-row">
                <div>
                  <p class="landing-story__mock-label">Lead · Ada O.</p>
                  <p class="landing-story__mock-meta">WhatsApp enquiry · Negotiating</p>
                </div>
              </div>
              <div class="landing-story__mock-row">
                <div>
                  <p class="landing-story__mock-label">Payment link</p>
                  <p class="landing-story__mock-meta">₦890,000 · Paystack paid</p>
                </div>
              </div>
            </template>

            <template v-else-if="story.visual === 'branches'">
              <div
                v-for="branch in branchRows"
                :key="branch.name"
                class="landing-story__mock-row"
              >
                <div>
                  <p class="landing-story__mock-label">{{ branch.name }}</p>
                  <p class="landing-story__mock-meta">{{ branch.meta }}</p>
                </div>
                <span class="landing-story__mock-pill">{{ branch.status }}</span>
              </div>
            </template>

            <template v-else-if="story.visual === 'analytics'">
              <div
                v-for="row in analyticsRows"
                :key="row.label"
                class="landing-story__mock-row"
              >
                <div>
                  <p class="landing-story__mock-label">{{ row.label }}</p>
                  <p class="landing-story__mock-meta">{{ row.meta }}</p>
                </div>
                <span class="landing-story__mock-pill">{{ row.status }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
const stories = [
  {
    id: 'inventory',
    eyebrow: 'Inventory',
    title: 'Categories, serials, and stock you can trust.',
    lede:
      'Organize products in folders with optional subcategories, custom fields, and serial or quantity tracking per branch.',
    bullets: [
      'One-level subcategories (for example Toyota → Corolla)',
      'Serial lines or bulk counts with low-stock alerts',
      'Customer buybacks add trade-in stock at cost',
      'Department-scoped folder access for staff',
    ],
    visual: 'inventory' as const,
  },
  {
    id: 'sales',
    eyebrow: 'Sales & customers',
    title: 'From enquiry to receipt in one workspace.',
    lede:
      'Ring up sales with the full wizard or Quick Sale, track customers and balances, and collect remotely with Paystack links.',
    bullets: [
      'Create New Sale and Quick Sale with barcode support',
      'Sales leads pipeline (Medium+) before the receipt exists',
      'Customer balance ledger, refunds, and WhatsApp receipts',
      'Payment links on every plan for remote checkout',
    ],
    visual: 'sales' as const,
  },
  {
    id: 'solutions',
    eyebrow: 'Multi-store',
    title: 'One business. Every branch. One login.',
    lede:
      'Switch stores instantly, transfer stock on Enterprise, and copy category templates across branches without copying live quantities.',
    bullets: [
      'Region-aware branch names from your onboarding country',
      'Stock transfers with approval and transfer history',
      'Copy from branch for Enterprise template rollout',
      'Stock loans for serial inventory lent to borrowers',
    ],
    visual: 'branches' as const,
  },
  {
    id: 'analytics',
    eyebrow: 'Insights & team',
    title: 'Reports, audits, and help built in.',
    lede:
      'Medium and Enterprise unlock analytics, activity logs, and exports. Every plan includes Help center, onboarding, and Storvv Assistant.',
    bullets: [
      'Feature insights, charts, peak hours, and PDF/Excel export',
      'Activity logs for managers and owners',
      'Roles: super admin, manager, and staff with 2FA',
      'Web dashboard plus native iOS app with the same data',
    ],
    visual: 'analytics' as const,
  },
]

const inventoryRows = [
  { name: 'Smartphones', count: '320', status: 'Healthy', warn: false },
  { name: 'Accessories', count: '148', status: 'Low stock', warn: true },
  { name: 'Toyota · 3 subcategories', count: '64', status: 'Healthy', warn: false },
]

const branchRows = [
  { name: 'Lagos, Lekki', meta: '142 products · active branch', status: 'Active' },
  { name: 'Abuja, Wuse', meta: '98 products · active branch', status: 'Active' },
  { name: 'Transfer #104', meta: '12 units · Lagos → Abuja', status: 'In transit' },
]

const analyticsRows = [
  { label: 'Revenue (30d)', meta: '₦18.2M completed', status: 'Medium+' },
  { label: 'Low stock', meta: '6 categories need restock', status: 'Alert' },
  { label: 'Activity log', meta: 'Folder edited · 2h ago', status: 'Audit' },
]
</script>
