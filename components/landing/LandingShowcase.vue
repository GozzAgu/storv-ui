<template>
  <div class="landing-showcase">
    <section
      id="hero"
      data-section-id="landing-hero"
      class="landing-hero scroll-animate scroll-animate-up"
      aria-labelledby="landing-hero-title"
    >
      <div class="landing-hero__grid landing-line-grid" aria-hidden="true" />
      <div class="landing-hero__inner landing-hero__inner--split">
        <div class="landing-hero__copy">
          <p class="landing-hero__badge landing-hero__reveal" style="--hero-i: 0">
            Retail operating system · Web &amp; mobile
          </p>
          <h1 id="landing-hero-title" class="landing-hero__title landing-hero__title--premium">
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 1"
              >Run your entire retail business</span
            >
            <span class="landing-hero__line landing-hero__reveal" style="--hero-i: 2">
              from one <span class="landing-hero__accent">intelligent platform.</span>
            </span>
          </h1>
          <p
            class="landing-hero__role landing-hero__role--premium landing-hero__reveal"
            style="--hero-i: 3"
          >
            Manage inventory, sales, customers, payment links, and multiple stores from one workspace -
            on web and iOS. Start with <strong>Solo</strong> for a focused owner layout or
            <strong>Business</strong> for the full team experience.
          </p>

          <div class="landing-hero__actions landing-hero__reveal" style="--hero-i: 4">
            <div class="landing-hero__cta-row">
              <a :href="appUrl" class="landing-pill-cta landing-pill-cta--hero"> Start for free </a>
              <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-pill-cta--secondary">
                Try demo
              </NuxtLink>
            </div>
            <div class="landing-hero__link-row">
              <a :href="appUrl" class="landing-hero__link">
                <span class="landing-hero__link-arrow" aria-hidden="true">→</span>
                {{ appHost }}
              </a>
            </div>
          </div>
        </div>

        <div class="landing-hero-mock landing-hero__visual landing-hero__reveal" style="--hero-i: 5">
          <div class="landing-hero-mock__card">
            <div class="landing-hero-mock__split">
              <div class="landing-hero-mock__boxes" aria-hidden="true">
                <span class="landing-hero-mock__box landing-hero-mock__box--a" />
                <span class="landing-hero-mock__box landing-hero-mock__box--b" />
                <span class="landing-hero-mock__box landing-hero-mock__box--c" />
                <div class="landing-hero-mock__overlay">
                  <strong>Dashboard overview</strong>
                  Three shops connected · One integrated view
                </div>
              </div>
              <div class="landing-hero-mock__panel">
                <p class="landing-hero-mock__panel-title">Track, clear, and manage.</p>
                <p class="landing-hero-mock__panel-sub">Every branch, one workspace</p>
                <ul class="landing-hero-mock__panel-list">
                  <li>Categories with optional subcategories</li>
                  <li>Quick Sale, leads & Paystack links</li>
                  <li>Solo or Business workspace at signup</li>
                  <li>Upgrade plans & billing in Settings (web + iOS)</li>
                </ul>
                <span class="landing-hero-mock__pill">Start free →</span>
              </div>
            </div>
            <div class="landing-hero-mock__stats">
              <div v-for="stat in heroStats" :key="stat.label" class="landing-hero-mock__stat">
                <p class="landing-hero-mock__stat-value">{{ stat.value }}</p>
                <p class="landing-hero-mock__stat-label">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <a
          href="#proof"
          class="landing-hero__scroll-hint landing-hero__reveal landing-hero__scroll-hint--split"
          style="--hero-i: 6"
        >
          <span class="landing-hero__scroll-hint-text">Scroll</span>
          <ChevronDownIcon class="landing-hero__scroll-hint-icon h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '~/utils/app-icons'
import { computed } from 'vue'

const props = defineProps<{
  logoSrc: string
  darkLogoSrc: string
  appUrl: string
}>()

const heroStats = [
  { value: '15+', label: 'Product areas' },
  { value: '3', label: 'Plans that scale' },
  { value: '1', label: 'Login, every store' },
] as const

const appHost = computed(() => {
  try {
    return new URL(props.appUrl).host
  } catch {
    return 'app.storvv.com'
  }
})
</script>
