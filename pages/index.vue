<template>
  <div>
    <!-- Hero -->
    <section class="mk-hero mk-hero--split" aria-labelledby="home-title">
      <div class="mk-hero__backdrop" aria-hidden="true" />
      <div class="mk-container mk-hero__grid">
        <div class="mk-hero__copy">
          <NuxtLink to="/#assistant" class="mk-pill mk-pill--link">
            <span class="mk-tag mk-tag--accent">New</span>
            Meet Storvv Assistant
            <ArrowRight :size="14" aria-hidden="true" />
          </NuxtLink>
          <h1 id="home-title" class="mk-h1 mk-hero__title">
            <span class="ds-sr-only">Run your shop without the guesswork.</span>
            <span aria-hidden="true">Run your</span>
            <span class="mk-rotator" aria-hidden="true">
              <Transition name="mk-word" mode="out-in">
                <span :key="shopWord" class="mk-rotator__word">{{ shopWord }}</span>
              </Transition>
            </span>
            <span aria-hidden="true">without the guesswork.</span>
          </h1>
          <p class="mk-lede">
            Know what's on every shelf and what came through the till, in real time, from any
            device.
          </p>
          <div class="mk-actions">
            <SButton variant="primary" size="lg" class="mk-btn" :to="appUrl">
              Start free
              <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
            </SButton>
            <SButton variant="secondary" size="lg" class="mk-btn" to="/demo/dashboard">
              Try the live demo
            </SButton>
          </div>
          <ul class="mk-hero__proof" aria-label="Good to know">
            <li><Check :size="16" aria-hidden="true" />Free forever for one store</li>
            <li><Check :size="16" aria-hidden="true" />No card needed</li>
            <li><Check :size="16" aria-hidden="true" />Set up in minutes</li>
          </ul>
        </div>

        <div class="mk-hero__visual">
          <div class="mk-hero__frame">
            <img
              class="mk-hero__photo"
              src="/marketing/hero-owner.webp"
              alt="A smiling boutique owner checking her sales on her phone behind the counter"
              width="864"
              height="1152"
              fetchpriority="high"
            />
          </div>

          <div class="mk-float mk-float--inverse mk-float--sale" aria-hidden="true">
            <span class="mk-float__icon mk-float__icon--success">
              <ReceiptText :size="18" />
            </span>
            <Transition name="mk-word" mode="out-in">
              <span :key="sale.amount" class="mk-float__body">
                <span class="mk-float__title">Sale completed · {{ sale.amount }}</span>
                <span class="mk-float__text">{{ sale.detail }}</span>
              </span>
            </Transition>
          </div>

          <div class="mk-glance" aria-hidden="true">
            <div class="mk-glance__head">
              <span class="mk-glance__label"><span class="mk-glance__live" />Today · Lagos</span>
              <span class="mk-mini__pill mk-mini__pill--success">
                <TrendingUp :size="12" />+18%
              </span>
            </div>
            <p class="mk-glance__value">₦1,240,000</p>
            <p class="mk-mini__sub">Revenue, vs ₦1.05m yesterday</p>
            <svg
              class="mk-glance__spark"
              viewBox="0 0 240 56"
              preserveAspectRatio="none"
              focusable="false"
            >
              <defs>
                <linearGradient id="mk-glance-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 44 L24 40 L48 42 L72 32 L96 35 L120 26 L144 29 L168 18 L192 22 L216 12 L240 8 L240 56 L0 56 Z"
                fill="url(#mk-glance-fill)"
              />
              <path
                d="M0 44 L24 40 L48 42 L72 32 L96 35 L120 26 L144 29 L168 18 L192 22 L216 12 L240 8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
            </svg>
            <dl class="mk-glance__stats">
              <div>
                <dt>Sales</dt>
                <dd>42</dd>
              </div>
              <div>
                <dt>Items sold</dt>
                <dd>118</dd>
              </div>
              <div>
                <dt>Low stock</dt>
                <dd class="mk-glance__warn">2</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <MkMarquee />
    </section>

    <MkIntro />

    <MkStats />

    <MkPlatform />

    <MkTour />

    <MkSetup />

    <MkAssistant />

    <!-- Pricing teaser -->
    <section id="pricing" class="mk-section mk-section--alt" aria-labelledby="home-pricing-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="home-pricing-title"
          eyebrow="Pricing"
          title="Start free."
          accent="Upgrade when you grow."
          :lede="`Prices in ${currency} for your region.`"
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
            title="Questions,"
            accent="answered."
            align="start"
          />
          <div id="contact" class="mk-contact-card">
            <h3 class="mk-h3">Still have a question?</h3>
            <p class="mk-card__text">We usually reply the same day.</p>
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
      title="Your first store is on us."
      lede="Set up Micro in minutes, right in your browser."
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, Check, ReceiptText, TrendingUp } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import MkAssistant from '~/components/marketing/MkAssistant.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkFaq, { type MkFaqItem } from '~/components/marketing/MkFaq.vue'
import MkTour from '~/components/marketing/MkTour.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import MkIntro from '~/components/marketing/MkIntro.vue'
import MkMarquee from '~/components/marketing/MkMarquee.vue'
import MkPlatform from '~/components/marketing/MkPlatform.vue'
import MkSetup from '~/components/marketing/MkSetup.vue'
import MkStats from '~/components/marketing/MkStats.vue'
import { MARKETING_PLANS, useMarketingPricing } from '~/composables/useMarketingPricing'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'

definePageMeta({ layout: 'marketing' })

const appUrl = useMarketingAppUrl()
const { currency, planPrice, periodSuffix } = useMarketingPricing()
const contactOpen = ref(false)

const shopWords = ['boutique', 'phone shop', 'mini-mart', 'pharmacy', 'supermarket', 'gadget store']

const sales = [
  { amount: '₦25,000', detail: 'Receipt sent on WhatsApp' },
  { amount: '₦485,000', detail: 'iPhone 13 · Paid by transfer' },
  { amount: '₦12,500', detail: 'Split between cash and card' },
]

const tick = ref(0)
const shopWord = computed(() => shopWords[tick.value % shopWords.length]!)
const sale = computed(() => sales[tick.value % sales.length]!)
let ticker: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ticker = setInterval(() => {
    if (!document.hidden) tick.value += 1
  }, 2800)
})

onBeforeUnmount(() => clearInterval(ticker))

const faq: MkFaqItem[] = [
  {
    q: 'Is Micro really free?',
    a: 'Yes. Micro is free forever for one store with up to 2 staff, including inventory, sales, receipts and customers. No card needed.',
  },
  {
    q: 'What do Medium and Enterprise add?',
    a: 'Medium adds a second store, analytics, sales leads and unlimited WhatsApp receipts. Enterprise covers 5 stores with 10 staff each plus stock transfers, and you can add more stores or staff seats any time. See the <a href="/pricing">full comparison</a>.',
    html: true,
  },
  {
    q: 'Can I use Storvv on my phone?',
    a: 'Yes, in your phone browser at app.storvv.com. iOS and Android apps are coming soon.',
  },
  {
    q: 'Can I try before signing up?',
    a: 'Yes. Open the <a href="/demo/dashboard">live demo</a> with sample data. No account needed.',
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
