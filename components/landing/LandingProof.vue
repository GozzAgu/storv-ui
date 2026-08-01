<template>
  <section
    id="proof"
    data-section-id="landing-proof"
    class="landing-proof scroll-animate scroll-animate-up"
    aria-labelledby="landing-proof-heading"
  >
    <div class="landing-proof__inner">
      <header class="landing-proof__header">
        <p class="landing-label landing-label--blue">Trusted by modern retailers</p>
        <h2 id="landing-proof-heading" class="landing-proof__title">
          Built for businesses that outgrow spreadsheets
        </h2>
        <p class="landing-proof__lede">
          From single-store shops to multi-branch operators, Storvv gives teams one place to manage
          stock, sales, and growth.
        </p>
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
  { value: '10,000+', label: 'Products managed on the platform' },
  { value: 'Multi-store', label: 'Ready for growing retailers' },
  { value: 'Growing teams', label: 'Built for businesses that scale' },
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
    title: 'Fewer “it’s finished” surprises',
    description:
      'Live counts per branch. Low-stock alerts before a customer walks away empty-handed.',
  },
  {
    metric: 'Branches',
    iconKey: 'branch',
    title: 'Every branch, one login',
    description:
      'Switch branches in a click. See sales and inventory per location without merged spreadsheets.',
  },
  {
    metric: 'Sales',
    iconKey: 'receipts',
    title: 'Sales and customers together',
    description:
      'Every sale saved with items and payment, including Paystack links when customers pay remotely.',
  },
]
</script>

<style scoped>
.landing-proof {
  padding: clamp(4rem, 9vw, 7rem) 1.25rem;
  background: #fff;
}

.landing-proof__inner {
  max-width: 72rem;
  margin: 0 auto;
}

.landing-proof__header {
  max-width: 40rem;
}

.landing-proof .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #143f8d;
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
  border: 1px solid rgba(20, 63, 141, 0.1);
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
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
  background: rgba(20, 63, 141, 0.08);
  color: #143f8d;
}

.landing-proof__metric {
  font-size: 0.9375rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #143f8d;
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
  border: 1px dashed rgba(20, 63, 141, 0.22);
  background: rgba(239, 246, 255, 0.5);
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
</style>
