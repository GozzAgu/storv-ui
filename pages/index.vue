<template>
  <div>
    <MkHero />

    <MkIntro />

    <MkBento />

    <MkStats />

    <MkPlatform />

    <MkTour />

    <MkImpact />

    <MkSetup />

    <!-- Pricing teaser -->
    <section id="pricing" class="mk-section mk-section--alt" aria-labelledby="home-pricing-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="home-pricing-title"
          eyebrow="Pricing"
          title="Start free."
          accent="Grow when ready."
          :lede="`Prices in ${currency}.`"
        />
        <div class="mk-plans">
          <article
            v-for="plan in MARKETING_PLANS"
            :key="plan.id"
            class="mk-plan mk-reveal"
            :class="{ 'mk-plan--featured': plan.featured }"
          >
            <span v-if="plan.featured" class="mk-plan__badge">Most popular</span>
            <div>
              <h3 class="mk-plan__name">{{ plan.name }}</h3>
              <p class="mk-plan__for">{{ plan.for }}</p>
            </div>
            <p class="mk-plan__price">
              <template v-if="plan.id === 'micro'">
                <span class="mk-plan__amount">Free</span>
                <span class="mk-plan__period">forever</span>
              </template>
              <template v-else>
                <span class="mk-plan__amount">{{ planPrice(plan.id) }}</span>
                <span class="mk-plan__period">{{ periodSuffix }}</span>
              </template>
            </p>
            <SButton
              :variant="plan.featured ? 'primary' : 'secondary'"
              class="mk-btn"
              block
              :to="appUrl"
            >
              {{ plan.cta }}
            </SButton>
          </article>
        </div>
        <p class="mk-hero__note mk-pricing-more">
          <NuxtLink to="/pricing" class="mk-link">
            Compare every plan
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </p>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="mk-section" aria-labelledby="home-faq-title">
      <div class="mk-container mk-faq-layout">
        <div class="mk-faq-layout__aside">
          <MkSectionHead
            title-id="home-faq-title"
            eyebrow="FAQ"
            title="Quick"
            accent="answers."
            align="start"
          />
          <div id="contact" class="mk-contact-card">
            <h3 class="mk-h3">Still stuck?</h3>
            <p class="mk-card__text">We reply the same day.</p>
            <div class="mk-actions">
              <SButton
                variant="secondary"
                class="mk-btn mk-btn--compact"
                @click="contactOpen = true"
              >
                Contact us
              </SButton>
              <a href="mailto:hello@storvv.com" class="mk-link">hello@storvv.com</a>
            </div>
          </div>
        </div>
        <MkFaq :items="faq" />
      </div>
    </section>

    <MkCta
      class="mk-section--tight-top"
      title="Your first store is"
      accent="on us."
      lede="Micro in minutes, in your browser."
      :primary="{ label: 'Start free', to: appUrl }"
      :secondary="{ label: 'Try the live demo', to: '/demo/dashboard' }"
    />

    <SDialog v-model:open="contactOpen" title="Contact us" size="lg">
      <iframe
        v-if="contactOpen"
        src="https://forms.fillout.com/t/89G44ZqC6Zus"
        title="Contact form"
        class="mk-contact-frame"
      />
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import MkBento from '~/components/marketing/MkBento.vue'
import MkHero from '~/components/marketing/MkHero.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkFaq, { type MkFaqItem } from '~/components/marketing/MkFaq.vue'
import MkTour from '~/components/marketing/MkTour.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import MkImpact from '~/components/marketing/MkImpact.vue'
import MkIntro from '~/components/marketing/MkIntro.vue'
import MkPlatform from '~/components/marketing/MkPlatform.vue'
import MkSetup from '~/components/marketing/MkSetup.vue'
import MkStats from '~/components/marketing/MkStats.vue'
import { MARKETING_PLANS, useMarketingPricing } from '~/composables/useMarketingPricing'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'

definePageMeta({ layout: 'marketing' })

const appUrl = useMarketingAppUrl()
const { currency, planPrice, periodSuffix } = useMarketingPricing()
const contactOpen = ref(false)

const faq: MkFaqItem[] = [
  {
    q: 'Is Micro really free?',
    a: 'Yes. One store, up to 2 staff, inventory, sales, receipts and customers. No card.',
  },
  {
    q: 'What do Medium and Enterprise add?',
    a: 'Medium: second store, analytics, leads, unlimited WhatsApp receipts. Enterprise: 5 stores, 10 staff each, transfers. Add more any time. <a href="/pricing">Compare plans</a>.',
    html: true,
  },
  {
    q: 'Can I use Storvv on my phone?',
    a: 'Yes. app.storvv.com in your browser. iOS and Android apps are coming.',
  },
  {
    q: 'What if my internet drops?',
    a: 'You need a connection to complete a sale. Mobile data or a hotspot is enough. Saved work stays in the cloud.',
  },
  {
    q: 'Do I need special hardware?',
    a: 'No. Use the phone, tablet or laptop you already have. Camera barcode scan, WhatsApp or PDF receipts.',
  },
  {
    q: 'Can I import my stock list?',
    a: 'Yes. Excel (.xlsx / .xls) into any category. Storvv reports what was added or skipped.',
  },
  {
    q: 'Which payments can I record?',
    a: 'Cash, card, transfer, OPay, Moniepoint, Palmpay, Kuda, USSD, mobile money, and splits. Edit the list in Settings.',
  },
  {
    q: 'Is my data safe?',
    a: 'Sales save to the cloud as you work. Roles limit what staff see. Optional two-step sign-in. Export to Excel any time.',
  },
  {
    q: 'Can I try before signing up?',
    a: 'Yes. The <a href="/demo/dashboard">live demo</a>. No account needed.',
    html: true,
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes, from Settings. Nothing is deleted when you move to a smaller plan.',
  },
]

useHead({
  title: 'Storvv - The retail operating system for modern businesses',
  meta: [
    {
      name: 'description',
      content:
        'Storvv: inventory, sales, analytics, and multi-store tools for retailers. Web dashboard today, iOS and Android apps coming soon.',
    },
  ],
})
</script>
