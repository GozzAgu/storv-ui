<template>
  <div>
    <!-- Marketing showcase: hero → problems → features → setup → multi-store -->
    <LandingShowcase
      :logo-src="marketingLogoSrc"
      :dark-logo-src="landingLogoSrc"
      :app-url="appOriginUrl"
    />

    <LandingProblemSolution />

    <LandingProof class="landing-proof--premium" />

    <LandingProductStories />

    <LandingCapabilities @navigate="scrollToSection" />

    <LandingAiShowcase />

    <LandingAppScreenshots :app-url="appOriginUrl" />

    <!-- Security teaser: full write-up lives on its own page -->
    <section
      id="security"
      data-section-id="security-teaser"
      class="landing-teaser scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
    >
      <div class="landing-teaser__inner">
        <img
          src="/marketing/illustrations/trust-badge-icon.png"
          alt=""
          class="landing-teaser__badge"
          loading="lazy"
          width="112"
          height="112"
        />
        <div class="landing-teaser__copy">
          <p class="landing-label landing-label--blue">Peace of mind</p>
          <h2 class="landing-teaser__title">Your business data deserves protection.</h2>
          <p class="landing-teaser__lede">
            Secure authentication, role-based permissions, and cloud infrastructure - built for
            retail teams who cannot afford downtime or data loss.
          </p>
          <ul class="landing-teaser__pillars">
            <li>Safe when you sign in</li>
            <li>Each person sees what they need</li>
            <li>Built to stay online</li>
          </ul>
        </div>
        <NuxtLink to="/security" class="landing-pill-cta landing-pill-cta--outline landing-teaser__cta">
          Read our security overview
        </NuxtLink>
      </div>
    </section>

    <!-- Pricing teaser: full plan breakdown and live prices live on /pricing -->
    <section
      id="pricing"
      data-section-id="pricing-teaser"
      class="landing-teaser landing-teaser--pricing scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
    >
      <div class="landing-teaser__inner">
        <div class="landing-teaser__copy landing-teaser__copy--center">
          <p class="landing-label landing-label--blue">Plans that scale</p>
          <h2 class="landing-teaser__title">Start free. Upgrade only when you outgrow it.</h2>
          <p class="landing-teaser__lede">
            Micro is free forever for one store. Medium adds analytics and leads. Enterprise adds
            multi-branch transfers and stock loans. Prices shown on the pricing page match your
            region automatically.
          </p>
        </div>
        <div class="landing-teaser__plans">
          <div v-for="plan in pricingTiers" :key="plan.name" class="landing-teaser__plan">
            <p class="landing-teaser__plan-name">{{ plan.name }}</p>
            <p class="landing-teaser__plan-detail">{{ plan.detail }}</p>
          </div>
        </div>
        <div class="landing-teaser__actions">
          <NuxtLink to="/pricing" class="landing-pill-cta landing-teaser__cta">
            See full pricing & compare plans
          </NuxtLink>
          <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-pill-cta--outline">
            Try demo
          </NuxtLink>
        </div>
      </div>
    </section>

    <LandingMoat />
    <LandingCaseStudies />
    <LandingPartners />

    <LandingFaq />

    <LandingContact @open-form="showContactFormModal = true" />

    <LandingFinalCta :app-url="appOriginUrl" />

    <!-- Contact Form Modal -->
    <Modal
      :model-value="showContactFormModal"
      @update:model-value="showContactFormModal = $event"
      size="xl"
      :show-close="true"
      :blur-backdrop="false"
    >
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Us</h3>
      </template>
      <div class="min-h-[500px]">
        <iframe
          v-if="showContactFormModal"
          src="https://forms.fillout.com/t/89G44ZqC6Zus"
          title="Contact form"
          class="w-full h-[600px] min-h-[500px] border-0 rounded-sm"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import { computed, onMounted, ref } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import { useThemeStore } from '~/stores/theme'
import { useSectionScroll } from '~/composables/useSectionScroll'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const themeStore = useThemeStore()
const { scrollToSection } = useSectionScroll()
const { setup: setupScrollAnimations } = useLandingScrollAnimations()

/** Light wordmark for light canvas. */
const marketingLogoSrc = '/storvv logo 2.png'
/** Wordmark that contrasts the current landing canvas. */
const landingLogoSrc = computed(() =>
  themeStore.actualTheme === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

const showContactFormModal = ref(false)
const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})

const pricingTiers = [
  { name: 'Micro', detail: 'Free · 1 store, full sales & inventory' },
  { name: 'Medium', detail: 'Analytics, sales leads, a second branch' },
  { name: 'Enterprise', detail: 'Transfers, stock loans, unlimited stores' },
] as const

onMounted(() => {
  if (import.meta.client) {
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Storvv - The retail operating system for modern businesses',
  meta: [
    {
      name: 'description',
      content:
        'Storvv: inventory with subcategories, Quick Sale, sales leads, Paystack payment links, analytics, buybacks, stock loans, and multi-store sync. Web dashboard and iOS app.',
    },
  ],
})
</script>

<style scoped>
/* Hero: unified glass surfaces (mobile sync strip + desktop floats) */
.landing-hero-float-card {
  border-radius: 1.5rem;
  border: 0;
  background: #ffffff;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: background-color 300ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .landing-hero-float-card:hover {
    transform: none;
    border-color: transparent;
    background: #eeeeef;
    box-shadow: none;
  }
}

html.dark .landing-hero-float-card {
  background: #1e1e1e;
}

html.dark .landing-hero-float-card:hover {
  background: #282828;
}

@media (prefers-reduced-motion: reduce) {
  .landing-hero-float-card,
  .landing-hero-float-card:hover {
    transition: none;
    transform: none;
  }
}

/* Hero: faint blueprint mesh (readable center, fades at edges) */
.landing-hero-grid {
  background-image: linear-gradient(rgb(26 21 35 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(26 21 35 / 0.05) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
}

/* Hero headline: bg-clip-text + tight leading can shear descenders (y, g); give glyphs room */
.landing-hero-headline {
  overflow: visible;
}
.landing-hero-gradient-heading {
  overflow: visible;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  background-clip: text;
  -webkit-background-clip: text;
}

/* ── Compact teaser sections (security / pricing) ── */
.landing-teaser {
  padding: clamp(3.5rem, 8vw, 6rem) 1.25rem;
  background: #f5f5f7;
}

.landing-teaser--pricing {
  background: #ffffff;
}

html.dark .landing-teaser {
  background: #080808;
}

html.dark .landing-teaser--pricing {
  background: #0d0d0d;
}

.landing-teaser__inner {
  max-width: 60rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}

.landing-teaser .landing-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--storvv-blue-light, rgb(26 21 35 / 0.55));
}

@media (min-width: 800px) {
  .landing-teaser:not(.landing-teaser--pricing) .landing-teaser__inner {
    flex-direction: row;
    text-align: left;
    align-items: center;
  }
}

.landing-teaser__badge {
  flex-shrink: 0;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 1.25rem;
  object-fit: contain;
  background: #ffffff;
}

html.dark .landing-teaser__badge {
  background: #1e1e1e;
}

.landing-teaser__copy {
  flex: 1 1 auto;
  min-width: 0;
}

.landing-teaser__copy--center {
  max-width: 34rem;
}

.landing-teaser__title {
  margin-top: 0.4rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--landing-section-heading, #0f172a);
}

.landing-teaser__lede {
  margin-top: 0.65rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--landing-section-body, #334155);
}

.landing-teaser__pillars {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(26 21 35 / 0.6);
}

@media (min-width: 800px) {
  .landing-teaser__pillars {
    justify-content: flex-start;
  }
}

html.dark .landing-teaser__pillars {
  color: rgb(255 255 255 / 0.65);
}

.landing-teaser__cta {
  flex-shrink: 0;
  white-space: nowrap;
}

.landing-teaser__plans {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  max-width: 40rem;
}

@media (min-width: 640px) {
  .landing-teaser__plans {
    grid-template-columns: repeat(3, 1fr);
  }
}

.landing-teaser__plan {
  border-radius: 1rem;
  background: #f5f5f7;
  padding: 1rem 1.1rem;
}

html.dark .landing-teaser__plan {
  background: #1e1e1e;
}

.landing-teaser__plan-name {
  font-weight: 700;
  color: var(--landing-section-heading, #0f172a);
}

.landing-teaser__plan-detail {
  margin-top: 0.3rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--landing-section-body, #475569);
}

.landing-teaser__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}
</style>
