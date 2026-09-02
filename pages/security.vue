<template>
  <div>
    <section
      data-section-id="security-hero"
      class="security-hero scroll-animate scroll-animate-up"
      aria-labelledby="security-hero-title"
    >
      <div class="security-hero__inner">
        <div class="security-hero__copy">
          <p class="landing-label landing-label--blue">Security &amp; trust</p>
          <h1 id="security-hero-title" class="security-hero__title">
            Every account, every sale, every branch - accounted for.
          </h1>
          <p class="security-hero__lede">
            Storvv is built for retail teams who cannot afford downtime or a data leak. Below is
            exactly how sign-in, permissions, and your store's data are handled - no jargon, no
            marketing fog.
          </p>
        </div>
        <img
          src="/marketing/illustrations/verified-inventory-illustration.png"
          alt="A store clerk with a clipboard checking off a stocked shelf, representing verified, audited inventory"
          class="security-hero__illustration"
          loading="lazy"
          width="420"
          height="420"
        />
      </div>
    </section>

    <LandingSecurity />

    <section
      data-section-id="security-detail"
      class="security-detail scroll-animate scroll-animate-up"
      aria-labelledby="security-detail-title"
    >
      <div class="security-detail__inner">
        <h2 id="security-detail-title" class="security-detail__title">
          Common questions from due-diligence checklists
        </h2>
        <div class="security-detail__grid">
          <article v-for="item in detailItems" :key="item.title" class="security-detail__card">
            <h3 class="security-detail__card-title">{{ item.title }}</h3>
            <p class="security-detail__card-body">{{ item.body }}</p>
          </article>
        </div>
        <p class="security-detail__footer">
          Need a written answer for procurement or your accountant?
          <a href="mailto:hello@storvv.com" class="font-semibold underline-offset-2 hover:underline"
            >Email us directly</a
          >
          - founding-store applications and multi-branch reviews get a same-week reply.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import LandingSecurity from '~/components/landing/LandingSecurity.vue'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const { setup: setupScrollAnimations } = useLandingScrollAnimations()

const detailItems = [
  {
    title: 'Who can see what?',
    body:
      'Super admins see everything for their stores. Managers edit receipts, refunds, and catalog structure. Staff create sales but cannot change categories, pricing rules, or settings. Departments further scope which folders a login can even open.',
  },
  {
    title: 'How is a login protected?',
    body:
      'Authentication runs over an encrypted connection. Owners can turn on two-factor authentication for their account in Profile → Security, and passwords can be rotated at any time without contacting support.',
  },
  {
    title: 'Is there an audit trail?',
    body:
      'Medium and Enterprise keep a dated activity log of inventory, sales, and settings changes, viewable by super admins and managers - useful for handovers, disputes, and staff accountability.',
  },
  {
    title: 'Where does my data live, and who owns it?',
    body:
      'Your sales and stock records belong to you. Storvv uses them only to run the product for you - not to resell or share with third parties. Full detail in our Privacy Policy.',
  },
  {
    title: 'What happens if I cancel?',
    body:
      'Paid plans keep working until the end of the billing period you already paid for, then drop to Micro limits. Your data stays intact - nothing is deleted on downgrade.',
  },
  {
    title: 'Do you support enterprise procurement reviews?',
    body:
      'Yes. Enterprise includes priority support for security questionnaires, multi-branch rollout planning, and transfer/stock-loan workflow reviews before you commit.',
  },
] as const

onMounted(() => {
  if (import.meta.client) {
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Security & Trust - Storvv',
  meta: [
    {
      name: 'description',
      content:
        'How Storvv protects your retail business: secure sign-in, role-based permissions, activity logs, and data ownership - explained plainly for owners and procurement teams.',
    },
  ],
})
</script>

<style scoped>
.security-hero {
  padding: clamp(6rem, 12vw, 8.5rem) 1.25rem clamp(3rem, 6vw, 4rem);
  background: #f5f5f7;
}

html.dark .security-hero {
  background: #080808;
}

.security-hero__inner {
  max-width: 68rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2.5rem;
}

@media (min-width: 900px) {
  .security-hero__inner {
    flex-direction: row;
    justify-content: space-between;
    gap: 3rem;
  }
}

.security-hero__copy {
  max-width: 34rem;
}

.security-hero__title {
  margin-top: 0.5rem;
  font-size: clamp(1.875rem, 4.2vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.12;
  color: var(--landing-section-heading, #0f172a);
}

.security-hero__lede {
  margin-top: 1rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--landing-section-body, #334155);
}

.security-hero__illustration {
  flex-shrink: 0;
  width: 15rem;
  height: auto;
  border-radius: 1.5rem;
  object-fit: contain;
}

@media (min-width: 900px) {
  .security-hero__illustration {
    width: 17rem;
  }
}

.security-detail {
  padding: clamp(3rem, 8vw, 5rem) 1.25rem clamp(4rem, 9vw, 6rem);
  background: #ffffff;
}

html.dark .security-detail {
  background: #0d0d0d;
}

.security-detail__inner {
  max-width: 64rem;
  margin: 0 auto;
}

.security-detail__title {
  font-size: clamp(1.375rem, 2.6vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  text-align: center;
  color: var(--landing-section-heading, #0f172a);
}

.security-detail__grid {
  margin-top: 2rem;
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .security-detail__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.security-detail__card {
  border-radius: 1.25rem;
  background: #f5f5f7;
  padding: 1.35rem 1.5rem;
}

html.dark .security-detail__card {
  background: #1e1e1e;
}

.security-detail__card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--landing-section-heading, #0f172a);
}

.security-detail__card-body {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--landing-section-body, #475569);
}

.security-detail__footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9375rem;
  color: var(--landing-section-body, #334155);
}
</style>
