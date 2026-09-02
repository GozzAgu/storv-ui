<template>
  <section
    id="proof"
    data-section-id="landing-proof"
    class="landing-proof scroll-animate scroll-animate-up"
    aria-labelledby="landing-proof-heading"
  >
    <div class="landing-proof__inner">
      <header class="landing-proof__header">
        <div class="landing-proof__header-copy">
          <p class="landing-label landing-label--blue">Trusted by modern retailers</p>
          <h2 id="landing-proof-heading" class="landing-proof__title">
            Built for businesses that outgrow spreadsheets
          </h2>
          <p class="landing-proof__lede">
            From Solo owner-operators on Micro to multi-branch Enterprise teams: pick the workspace
            that fits how you run the shop, then scale plans as you grow.
          </p>
        </div>
        <img
          src="/marketing/illustrations/analytics-illustration.png"
          alt="An analytics dashboard with revenue charts and a stopwatch, representing fast reporting"
          class="landing-proof__header-visual"
          loading="lazy"
          width="360"
          height="288"
        />
      </header>

      <div class="landing-proof__stats" aria-label="Platform highlights">
        <div v-for="stat in proofStats" :key="stat.label">
          <p class="landing-proof__stat-value">{{ stat.value }}</p>
          <p class="landing-proof__stat-label">{{ stat.label }}</p>
        </div>
      </div>

      <div class="landing-proof__grid">
        <article v-for="card in proofCards" :key="card.title" class="landing-proof__card">
          <span class="landing-proof__card-icon" aria-hidden="true">
            <MarketingFeatureIcon :name="card.iconKey" size="md" />
          </span>
          <p class="landing-proof__metric">{{ card.metric }}</p>
          <h3 class="landing-proof__card-title">{{ card.title }}</h3>
          <p class="landing-proof__card-desc">{{ card.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MarketingFeatureIconKey } from '~/utils/marketing-feature-icons'

const proofStats = [
  { value: 'Solo', label: 'Focused workspace for owner-operators' },
  { value: 'Medium+', label: 'Analytics, leads & Paystack auto-renew' },
  { value: 'Enterprise', label: 'Transfers, stock loans & template copy' },
]

const proofCards: Array<{
  metric: string
  iconKey: MarketingFeatureIconKey
  title: string
  description: string
}> = [
  {
    metric: 'Stock',
    iconKey: 'inventory',
    title: 'Live inventory per branch',
    description:
      'Serial or quantity modes, subcategories, buybacks, and low-stock alerts before shelves run empty.',
  },
  {
    metric: 'Sales',
    iconKey: 'receipts',
    title: 'Receipts, leads & remote pay',
    description:
      'Wizard or Quick Sale checkout, sales leads pipeline, customer ledger, and Paystack payment links.',
  },
  {
    metric: 'Branches',
    iconKey: 'branch',
    title: 'Multi-store from one login',
    description:
      'Switch branches instantly. Enterprise adds transfers, copy-from-branch, and stock loans.',
  },
  {
    metric: 'Insights',
    iconKey: 'analytics',
    title: 'Analytics & audit trail',
    description:
      'Feature insights, exports, peak-hour charts, and activity logs on Medium and Enterprise.',
  },
  {
    metric: 'Team',
    iconKey: 'departments',
    title: 'Roles that match the floor',
    description:
      'Super admin, manager, and staff logins with department folder access and optional 2FA.',
  },
  {
    metric: 'Mobile',
    iconKey: 'dashboard',
    title: 'Web + iOS native app',
    description:
      'Same data on desktop and iPhone: tabs, pull-to-refresh, swipe actions, native sheets, and full subscription management in Settings.',
  },
]
</script>

<style scoped>
.landing-proof {
  padding: clamp(4rem, 9vw, 7rem) 1.25rem;
  background: #f5f5f7;
}

.landing-proof__inner {
  max-width: 72rem;
  margin: 0 auto;
}

.landing-proof__header {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 1.75rem;
}

@media (min-width: 900px) {
  .landing-proof__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2.5rem;
  }
}

.landing-proof__header-copy {
  max-width: 34rem;
}

.landing-proof__header-visual {
  flex: 0 0 auto;
  width: 11rem;
  height: auto;
  border-radius: 1.25rem;
  object-fit: contain;
  background: #ffffff;
  padding: 0.5rem;
}

@media (min-width: 900px) {
  .landing-proof__header-visual {
    width: 14rem;
  }
}

html.dark .landing-proof__header-visual {
  background: #1e1e1e;
}

.landing-proof .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(26 21 35 / 0.55);
}

.landing-proof__title {
  margin-top: 0.5rem;
  font-size: clamp(1.5rem, 3.2vw, 2.125rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--landing-section-heading, #0f172a);
}

.landing-proof__lede {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--landing-section-body, #334155);
}

.landing-proof__grid {
  margin-top: 2rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .landing-proof__grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
}

.landing-proof__card {
  border-radius: 1rem;
  border: 0;
  background: #ffffff;
  padding: 1.25rem 1.35rem;
}

.landing-proof__card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin-bottom: 0.75rem;
  border-radius: 0.625rem;
  background: #f4f4f5;
  color: rgb(26 21 35 / 0.55);
}

.landing-proof__metric {
  font-size: 0.9375rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(26 21 35 / 0.55);
}

.landing-proof__card-title {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--landing-section-heading, #0f172a);
}

.landing-proof__card-desc {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--landing-section-body, #475569);
}

.landing-proof__founding {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: flex-start;
  border-radius: 1rem;
  border: 1px dashed rgb(26 21 35 / 0.08);
  background: #ffffff;
  padding: 1.5rem 1.35rem;
}

@media (min-width: 640px) {
  .landing-proof__founding {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.75rem;
  }
}

.landing-proof__founding-title {
  margin-top: 0.35rem;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--landing-section-heading, #0f172a);
}

.landing-proof__founding-desc {
  margin-top: 0.5rem;
  max-width: 36rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--landing-section-body, #334155);
}

.landing-proof .landing-label--muted {
  font-size: 0.75rem;
  color: var(--landing-section-body, #475569);
}

.landing-proof__founding-cta {
  flex-shrink: 0;
  white-space: nowrap;
}

html.dark .landing-proof {
  background: #080808;
}

html.dark .landing-proof__card {
  background: #1e1e1e;
}

html.dark .landing-proof__card-icon {
  background: #282828;
  color: rgb(255 255 255 / 0.62);
}

html.dark .landing-proof .landing-label,
html.dark .landing-proof__metric {
  color: rgb(255 255 255 / 0.62);
}

html.dark .landing-proof__founding {
  border: 0;
  background: #1e1e1e;
}
</style>
