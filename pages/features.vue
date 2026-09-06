<template>
  <div>
    <section
      data-section-id="features-hero"
      class="features-hero scroll-animate scroll-animate-up"
      aria-labelledby="features-hero-title"
    >
      <div class="features-hero__inner">
        <div class="features-hero__copy">
          <p class="landing-label landing-label--blue">Product features</p>
          <h1 id="features-hero-title" class="features-hero__title">
            Everything Storvv includes - from stock to storefront.
          </h1>
          <p class="features-hero__lede">
            Inventory, sales, a public guest catalogue, payment links, analytics, and multi-branch
            tools. Browse by category below, then see the real app in screenshots.
          </p>
          <p class="features-hero__link">
            <NuxtLink to="/demo/dashboard" class="font-semibold underline-offset-2 hover:underline">
              Try the interactive demo
            </NuxtLink>
            - no signup required.
          </p>
        </div>
      </div>
    </section>

    <LandingCapabilities />

    <LandingAiShowcase />

    <LandingAppScreenshots :app-url="appOriginUrl" />

    <LandingMoat />

    <section
      data-section-id="features-cta"
      class="features-cta scroll-animate scroll-animate-up"
    >
      <div class="features-cta__inner">
        <h2 class="features-cta__title">Ready to run the shop from one place?</h2>
        <p class="features-cta__lede">
          Start on Micro for free, or explore plans and security on their own pages.
        </p>
        <div class="features-cta__actions">
          <a :href="appOriginUrl" class="landing-pill-cta">Get started</a>
          <NuxtLink to="/pricing" class="landing-pill-cta landing-pill-cta--outline">
            See pricing
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import { computed, onMounted } from 'vue'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const { setup: setupScrollAnimations } = useLandingScrollAnimations()
const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})

onMounted(() => {
  if (import.meta.client) {
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Features - Storvv retail OS',
  meta: [
    {
      name: 'description',
      content:
        'Explore Storvv features: inventory, sales, public storefront, payment links, analytics, multi-store sync, and the iOS app.',
    },
  ],
})
</script>

<style scoped>
.features-hero {
  padding: clamp(4rem, 10vw, 6.5rem) 1.25rem 2rem;
  background: #ffffff;
}

html.dark .features-hero {
  background: #080808;
}

.features-hero__inner {
  max-width: 48rem;
  margin: 0 auto;
}

.features-hero__title {
  margin-top: 0.5rem;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: #1a1523;
}

html.dark .features-hero__title {
  color: #ffffff;
}

.features-hero__lede {
  margin-top: 1rem;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: rgb(26 21 35 / 0.62);
}

html.dark .features-hero__lede {
  color: rgb(255 255 255 / 0.62);
}

.features-hero__link {
  margin-top: 1rem;
  font-size: 0.9375rem;
  color: rgb(26 21 35 / 0.72);
}

html.dark .features-hero__link {
  color: rgb(255 255 255 / 0.72);
}

.features-cta {
  padding: clamp(3.5rem, 8vw, 5rem) 1.25rem;
  background: #f5f5f7;
}

html.dark .features-cta {
  background: #0a0a0a;
}

.features-cta__inner {
  max-width: 40rem;
  margin: 0 auto;
  text-align: center;
}

.features-cta__title {
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #1a1523;
}

html.dark .features-cta__title {
  color: #ffffff;
}

.features-cta__lede {
  margin-top: 0.75rem;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(26 21 35 / 0.62);
}

html.dark .features-cta__lede {
  color: rgb(255 255 255 / 0.62);
}

.features-cta__actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}
</style>
