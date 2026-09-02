<template>
  <div>
    <section
      data-section-id="pricing-hero"
      class="pricing-hero scroll-animate scroll-animate-up"
      aria-labelledby="pricing-hero-title"
    >
      <div class="pricing-hero__inner">
        <div class="pricing-hero__copy">
          <p class="landing-label landing-label--blue">Plans that scale with your business</p>
          <h1 id="pricing-hero-title" class="pricing-hero__title">
            Start free. Pay only when Storvv is already paying for itself.
          </h1>
          <p class="pricing-hero__lede">
            Start on <strong>Micro</strong> - free, one store, full sales and inventory. Medium
            adds analytics, sales leads, and a second branch. Enterprise adds transfers, stock
            loans, and unlimited stores. Every payment link, on every plan, goes straight to your
            customers - wherever they're paying from.
          </p>
          <p class="pricing-hero__link">
            <NuxtLink to="/demo/dashboard" class="font-semibold underline-offset-2 hover:underline">
              Try the interactive demo
            </NuxtLink>
            - no signup required.
          </p>
        </div>
        <img
          src="/marketing/illustrations/payment-links-illustration.png"
          alt="A customer stepping out of a phone screen toward a mobile storefront, representing remote checkout with payment links"
          class="pricing-hero__illustration"
          loading="lazy"
          width="420"
          height="365"
        />
      </div>
    </section>

    <!-- Pricing -->
    <section
      id="pricing"
      data-section-id="pricing"
      class="landing-pricing scroll-animate scroll-animate-up"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-400">
          Showing prices in {{ pricing.currency }} based on your region.
        </p>
        <div
          class="mt-7 flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Billing cycle"
        >
          <button
            v-for="cycle in SUBSCRIPTION_BILLING_CYCLES"
            :key="cycle"
            type="button"
            :class="[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              selectedBillingCycle === cycle
                ? 'bg-[#1a1523] text-white dark:bg-white dark:text-[#1a1523]'
                : 'bg-white text-gray-600 hover:bg-[#eeeeef] dark:bg-[#1e1e1e] dark:text-gray-300 dark:hover:bg-[#282828]',
            ]"
            :aria-pressed="selectedBillingCycle === cycle"
            @click="selectedBillingCycle = cycle"
          >
            {{ BILLING_CYCLE_LABELS[cycle] }}
            <span
              v-if="cycle === 'yearly'"
              class="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300"
              >Save 15%</span
            >
            <span
              v-else-if="cycle === 'quarterly'"
              class="ml-1.5 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
              >Save 10%</span
            >
          </button>
        </div>
        <p class="mt-3 text-center text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Prices shown per billing cycle. Medium and Enterprise renew automatically until you
          cancel in Settings.
        </p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <!-- Micro: single store, 1 dept, 2 staff. No analytics, no multi-store sync. -->
          <div
            data-section-id="pricing-1"
            class="scroll-animate scroll-animate-scale stagger-1 rounded-3xl bg-white dark:bg-[#1e1e1e] p-6 flex flex-col transition duration-200 ease-out"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Micro</h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Single store, ideal with Solo workspace at signup
            </p>
            <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">FREE</p>
            <p class="text-sm text-gray-500">{{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li
                v-for="(line, i) in SUBSCRIPTION_FEATURE_SUMMARY.storvv_micro"
                :key="i"
                class="flex items-center gap-2"
              >
                <CheckIcon class="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{{ line }}
              </li>
              <li
                v-if="SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_micro"
                class="flex items-start gap-2 text-gray-500 dark:text-gray-500"
              >
                <span class="shrink-0">−</span> {{ SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_micro }}
              </li>
            </ul>
            <NuxtLink
              to="/demo/dashboard"
              class="landing-pill-cta landing-pill-cta--outline mt-4 flex w-full"
              >Try demo</NuxtLink
            >
            <a :href="appOriginUrl" class="landing-pill-cta mt-2 flex w-full">Start free</a>
          </div>
          <!-- Medium: 2 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
          <div
            data-section-id="pricing-2"
            class="scroll-animate scroll-animate-scale stagger-2 relative rounded-3xl bg-white p-6 flex flex-col dark:bg-[#1e1e1e]"
          >
            <p class="landing-pricing__badge">Most popular</p>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Medium</h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Growing business, multiple locations or teams
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                formatPlanPrice('medium')
              }}</span>
              <span v-if="planListPrice('medium')" class="text-sm text-gray-400 line-through">{{
                planListPrice('medium')
              }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}</p>
            <p class="mt-0.5 text-xs text-gray-400">
              Auto-renews
              {{
                selectedBillingCycle === 'yearly'
                  ? 'yearly'
                  : selectedBillingCycle === 'quarterly'
                    ? 'each quarter'
                    : 'monthly'
              }}
            </p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li
                v-for="(line, i) in SUBSCRIPTION_FEATURE_SUMMARY.storvv_medium"
                :key="i"
                class="flex items-center gap-2"
              >
                <CheckIcon class="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{{ line }}
              </li>
              <li
                v-if="SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_medium"
                class="flex items-start gap-2 text-gray-500 dark:text-gray-500"
              >
                <span class="shrink-0">−</span> {{ SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_medium }}
              </li>
            </ul>
            <a :href="appOriginUrl" class="landing-pill-cta mt-6 flex w-full">Get Started</a>
          </div>
          <!-- Enterprise: unlimited. Multi-store sync, priority support. -->
          <div
            data-section-id="pricing-3"
            class="scroll-animate scroll-animate-scale stagger-3 rounded-3xl bg-white dark:bg-[#1e1e1e] p-6 flex flex-col transition duration-200 ease-out"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Storvv Enterprise
            </h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Larger operations, central management
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                formatPlanPrice('enterprise')
              }}</span>
              <span v-if="planListPrice('enterprise')" class="text-sm text-gray-400 line-through">{{
                planListPrice('enterprise')
              }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}</p>
            <p class="mt-0.5 text-xs text-gray-400">
              Auto-renews
              {{
                selectedBillingCycle === 'yearly'
                  ? 'yearly'
                  : selectedBillingCycle === 'quarterly'
                    ? 'each quarter'
                    : 'monthly'
              }}
            </p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li
                v-for="(line, i) in SUBSCRIPTION_FEATURE_SUMMARY.storvv_enterprise"
                :key="i"
                class="flex items-center gap-2"
              >
                <CheckIcon class="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{{ line }}
              </li>
            </ul>
            <a :href="appOriginUrl" class="landing-pill-cta mt-6 flex w-full">Get Started</a>
          </div>
        </div>

        <div class="mt-10 max-w-4xl mx-auto rounded-2xl bg-white p-6 text-left dark:bg-[#1e1e1e] sm:p-8">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Solo vs Business workspace
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Separate from your paid plan. Choose during onboarding or switch anytime in Settings.
            Your Micro, Medium, or Enterprise limits still apply either way.
          </p>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl bg-[#f5f5f7] p-4 dark:bg-[#282828]">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">Solo · Just me</p>
              <p class="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                A focused workspace for running the shop yourself. Fewer menus up front: inventory,
                sales, and customers stay front and center.
              </p>
              <ul class="mt-3 space-y-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <li>· Departments, branch switcher, and multi-store tools hidden until you need them</li>
                <li>· Turn on team, branches, or payment links in Advanced features when ready</li>
                <li>· Great for owner-operators on Micro who do not want admin clutter</li>
              </ul>
            </div>
            <div class="rounded-xl bg-[#f5f5f7] p-4 dark:bg-[#282828]">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Business · Growing business
              </p>
              <p class="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                The full Storvv workspace with team, branches, and admin tools as your plan allows.
              </p>
              <ul class="mt-3 space-y-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <li>· Staff, departments, and multi-location navigation when your plan includes them</li>
                <li>· Payment links and advanced screens visible by default</li>
                <li>· Best when you already manage a team or multiple branches</li>
              </ul>
            </div>
          </div>

          <h4 class="mt-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Billing in Settings
          </h4>
          <p class="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            <strong class="font-medium text-gray-800 dark:text-gray-200">Plan</strong> is what you
            pay for (Micro, Medium, Enterprise). Solo and Business only change how much of the app
            we show, not your subscription price.
          </p>
          <ul class="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Live price preview before Paystack checkout (monthly, quarterly, or yearly)
            </li>
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Billing history, renewal status, and cancel auto-renew in Settings
            </li>
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Clear upgrade prompts when you hit plan limits (staff, WhatsApp, gated screens)
            </li>
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Solo, Business, and subscription tools on web and the native iOS app
            </li>
          </ul>
        </div>
      </div>

      <div class="mx-auto mt-8 max-w-2xl pt-6 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Still deciding?
          <a href="/#faq" @click.prevent="goToSection('faq')" class="font-semibold underline-offset-2 hover:underline"
            >Read the FAQ</a
          >
          or
          <NuxtLink to="/security" class="font-semibold underline-offset-2 hover:underline"
            >see how we protect your data</NuxtLink
          >.
        </p>
        <NuxtLink
          to="/demo/dashboard"
          class="landing-pill-cta landing-pill-cta--outline w-full sm:w-auto mt-4"
        >
          Try demo
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import { computed, onMounted, ref } from 'vue'
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLE_PERIOD_SUFFIX,
  SUBSCRIPTION_BILLING_CYCLES,
  deriveBillingAmount,
  deriveBillingListAmount,
  type SubscriptionBillingCycle,
} from '~/utils/subscription-billing'
import { SUBSCRIPTION_FEATURE_SUMMARY, SUBSCRIPTION_PLAN_NOT_INCLUDED } from '~/types/subscription'
import { CheckIcon } from '~/utils/app-icons'
import { useSectionScroll } from '~/composables/useSectionScroll'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const { goToSection } = useSectionScroll()
const { setup: setupScrollAnimations } = useLandingScrollAnimations()

const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})

const selectedBillingCycle = ref<SubscriptionBillingCycle>('monthly')
const locale = ref('en-NG')
const pricingRegion = ref<'NG' | 'US' | 'GB' | 'EU'>('NG')

const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

const pricingByRegion = {
  NG: {
    currency: 'NGN',
    medium: { monthly: 10000, yearly: 100000, yearlyList: 120000 },
    enterprise: { monthly: 25000, yearly: 200000, yearlyList: 300000 },
  },
  US: {
    currency: 'USD',
    medium: { monthly: 7, yearly: 70, yearlyList: 84 },
    enterprise: { monthly: 19, yearly: 190, yearlyList: 228 },
  },
  GB: {
    currency: 'GBP',
    medium: { monthly: 6, yearly: 60, yearlyList: 72 },
    enterprise: { monthly: 15, yearly: 150, yearlyList: 180 },
  },
  EU: {
    currency: 'EUR',
    medium: { monthly: 7, yearly: 70, yearlyList: 84 },
    enterprise: { monthly: 17, yearly: 170, yearlyList: 204 },
  },
} as const

const pricing = computed(() => pricingByRegion[pricingRegion.value])

const formatPrice = (amount: number) =>
  new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: pricing.value.currency,
    maximumFractionDigits: 0,
  }).format(amount)

type PaidPlan = 'medium' | 'enterprise'

const formatPlanPrice = (plan: PaidPlan) => {
  const monthly = pricing.value[plan].monthly
  if (selectedBillingCycle.value === 'yearly') {
    return formatPrice(pricing.value[plan].yearly)
  }
  return formatPrice(deriveBillingAmount(monthly, selectedBillingCycle.value))
}

const planListPrice = (plan: PaidPlan): string | null => {
  if (selectedBillingCycle.value === 'monthly') return null
  if (selectedBillingCycle.value === 'yearly') {
    return formatPrice(pricing.value[plan].yearlyList)
  }
  return formatPrice(deriveBillingListAmount(pricing.value[plan].monthly, 'quarterly'))
}

const detectPricingRegion = () => {
  const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-NG'
  locale.value = browserLocale

  const regionCode = browserLocale.split('-')[1]?.toUpperCase()
  if (regionCode === 'NG') {
    pricingRegion.value = 'NG'
    return
  }
  if (regionCode === 'GB') {
    pricingRegion.value = 'GB'
    return
  }
  if (regionCode === 'US') {
    pricingRegion.value = 'US'
    return
  }
  if (regionCode && EU_COUNTRY_CODES.has(regionCode)) {
    pricingRegion.value = 'EU'
    return
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (timeZone.startsWith('Africa/Lagos')) {
    pricingRegion.value = 'NG'
    return
  }
  if (timeZone.startsWith('Europe/London')) {
    pricingRegion.value = 'GB'
    return
  }
  if (timeZone.startsWith('Europe/')) {
    pricingRegion.value = 'EU'
    return
  }

  pricingRegion.value = 'US'
}

onMounted(() => {
  if (import.meta.client) {
    detectPricingRegion()
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Pricing - Storvv',
  meta: [
    {
      name: 'description',
      content:
        'Storvv pricing: Micro is free for one store. Medium adds analytics and sales leads. Enterprise adds multi-branch transfers and stock loans. Paystack billing, cancel anytime.',
    },
  ],
})
</script>

<style scoped>
.pricing-hero {
  padding: clamp(6rem, 12vw, 8.5rem) 1.25rem clamp(3rem, 6vw, 4rem);
  background: #f5f5f7;
}

html.dark .pricing-hero {
  background: #080808;
}

.pricing-hero__inner {
  max-width: 68rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2.5rem;
}

@media (min-width: 900px) {
  .pricing-hero__inner {
    flex-direction: row;
    justify-content: space-between;
    gap: 3rem;
  }
}

.pricing-hero__copy {
  max-width: 34rem;
}

.pricing-hero__title {
  margin-top: 0.5rem;
  font-size: clamp(1.875rem, 4.2vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.12;
  color: var(--landing-section-heading, #0f172a);
}

.pricing-hero__lede {
  margin-top: 1rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--landing-section-body, #334155);
}

.pricing-hero__link {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  color: var(--landing-section-body, #334155);
}

.pricing-hero__illustration {
  flex-shrink: 0;
  width: 16rem;
  height: auto;
  object-fit: contain;
}

@media (min-width: 900px) {
  .pricing-hero__illustration {
    width: 19rem;
  }
}

.landing-pricing {
  padding: clamp(2rem, 6vw, 3rem) 1.25rem clamp(4rem, 9vw, 6rem);
}
</style>
