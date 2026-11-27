<template>
  <div>
    <MkHero />

    <MkFlow />

    <MkInterlude variant="journey" />

    <MkFeatureCarousel id="product" />

    <MkIntro />

    <MkOnboarding />

    <MkCompare />

    <MkInterlude variant="branches" />

    <MkTestimonials />

    <!-- Pricing teaser: one strip, three plans side by side -->
    <section id="pricing" class="mk-section mkp" aria-labelledby="home-pricing-title">
      <div class="mk-container">
        <div class="mkp__head">
          <MkSectionHead
            title-id="home-pricing-title"
            eyebrow="Pricing"
            title="Start free."
            accent="Grow when you're ready."
            lede="Prices in naira. Change or cancel your plan any time."
            align="start"
          />
          <div class="mkp__aside">
            <MkTrialOffer />
            <NuxtLink to="/pricing" class="mkp__compare">
              Compare every plan
              <ArrowRight :size="16" :stroke-width="2" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <ol ref="plansEl" class="mkp__plans" @scroll.passive="onPlansScroll">
          <li
            v-for="(plan, i) in MARKETING_PLANS"
            :key="plan.id"
            class="mkp__plan mk-reveal"
            :class="{ 'is-featured': plan.featured }"
          >
            <p class="mkp__index">
              <span>{{ String(i + 1).padStart(2, '0') }}</span>
              <span v-if="plan.featured" class="mkp__tag">Most popular</span>
            </p>
            <h3 class="mkp__name">{{ plan.name }}</h3>
            <p class="mkp__for">{{ plan.for }}</p>
            <p class="mkp__price">
              <template v-if="plan.id === 'micro'">
                <span class="mkp__amount">Free</span>
                <span class="mkp__period">forever</span>
              </template>
              <template v-else>
                <span class="mkp__amount"
                  ><span class="mkp__cur">{{ priceParts(planPrice(plan.id)).symbol }}</span
                  >{{ priceParts(planPrice(plan.id)).value }}</span
                >
                <span class="mkp__period">{{ periodSuffix }}</span>
              </template>
            </p>
            <p class="mkp__terms">
              {{ plan.id === 'micro' ? 'No card needed' : 'Billed monthly · cancel any time' }}
            </p>
            <ul class="mkp__list">
              <li v-for="line in plan.highlights" :key="line">
                <Check :size="16" :stroke-width="2" aria-hidden="true" />
                {{ line }}
              </li>
            </ul>
            <!-- Outline only: the filled button on each screen is the free-store signup. -->
            <NuxtLink :to="signupUrl" class="mkp__btn">
              {{ plan.cta }}
              <ArrowRight :size="16" :stroke-width="2" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ol>
        <!-- Phones: the plans swipe sideways; this shows which one is in view -->
        <div class="mkp__pager" aria-hidden="true">
          <span
            v-for="(plan, i) in MARKETING_PLANS"
            :key="plan.id"
            class="mkp__pager-dot"
            :class="{ 'is-on': planInView === i }"
          />
          <span class="mkp__pager-label">{{ MARKETING_PLANS[planInView]?.name }}</span>
        </div>
      </div>
    </section>

    <MkCta
      title="Your first store is"
      accent="on us."
      lede="Set up Micro in about ten minutes, in the browser on the phone or laptop you already have."
      :primary="{ label: 'Create your free store', to: signupUrl }"
      walkthrough
    />

    <!-- FAQ -->
    <section id="faq" class="mk-section mk-section--tight-top" aria-labelledby="home-faq-title">
      <div class="mk-container mk-container--narrow">
        <MkSectionHead
          title-id="home-faq-title"
          eyebrow="FAQ"
          title="Questions,"
          accent="answered."
        />
        <MkFaq :items="faq" />
        <p id="contact" class="mk-faq-contact">
          Still stuck? We reply the same day.
          <button type="button" class="mk-link mk-faq-contact__btn" @click="contactOpen = true">
            Contact us
          </button>
          or email
          <a href="mailto:hello@storvv.com" class="mk-link">hello@storvv.com</a>
        </p>
      </div>
    </section>

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
import MkTestimonials from '~/components/marketing/MkTestimonials.vue'
import { faqJsonLd, organizationJsonLd, softwareJsonLd, websiteJsonLd } from '~/utils/marketing-seo'
import { marketingSoftwareOffers } from '~/composables/useMarketingPricing'
import { useMarketingSeo } from '~/composables/useMarketingSeo'
import { onMounted, ref } from 'vue'
import { ArrowRight, Check } from '~/icons'
import SDialog from '~/components/s/SDialog.vue'
import MkHero from '~/components/marketing/MkHero.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkFaq, { type MkFaqItem } from '~/components/marketing/MkFaq.vue'
import MkFeatureCarousel from '~/components/marketing/MkFeatureCarousel.vue'
import MkCompare from '~/components/marketing/MkCompare.vue'
import MkFlow from '~/components/marketing/MkFlow.vue'
import MkInterlude from '~/components/marketing/MkInterlude.vue'
import MkIntro from '~/components/marketing/MkIntro.vue'
import MkOnboarding from '~/components/marketing/MkOnboarding.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import MkTrialOffer from '~/components/marketing/MkTrialOffer.vue'
import { MARKETING_PLANS, useMarketingPricing } from '~/composables/useMarketingPricing'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'

definePageMeta({ layout: 'marketing' })

const signupUrl = useMarketingSignupUrl()
const { planPrice, periodSuffix } = useMarketingPricing()
/** "₦15,000" → symbol "₦", value "15,000", so the symbol can sit small beside the figure */
function priceParts(price: string) {
  const match = price.match(/^(\D*)(.*)$/)
  return { symbol: match?.[1]?.trim() ?? '', value: match?.[2] ?? price }
}
const contactOpen = ref(false)

// Phones: the plans sit in a swipeable row that opens on the featured plan
const plansEl = ref<HTMLElement | null>(null)
const planInView = ref(
  Math.max(
    0,
    MARKETING_PLANS.findIndex((plan) => plan.featured)
  )
)
function onPlansScroll() {
  const el = plansEl.value
  const first = el?.firstElementChild as HTMLElement | null
  if (!el || !first) return
  const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
  planInView.value = Math.min(MARKETING_PLANS.length - 1, Math.round(el.scrollLeft / step))
}
onMounted(() => {
  const el = plansEl.value
  if (!el || el.scrollWidth <= el.clientWidth) return
  const featured = el.children[planInView.value] as HTMLElement | undefined
  if (featured)
    el.scrollLeft =
      featured.offsetLeft - el.offsetLeft - (el.clientWidth - featured.offsetWidth) / 2
})

const faq: MkFaqItem[] = [
  {
    q: 'Is Micro really free?',
    a: 'Yes. One store, up to 2 staff, inventory, sales, receipts, customers and returns. No card, no time limit.',
  },
  {
    q: 'What do Medium and Enterprise add?',
    a: 'Medium: a second store, transfers between them, reports, sales leads, customer balances, supplier returns and 50 WhatsApp receipts a month. Enterprise: 5 stores with 10 staff each, stock loans and unlimited WhatsApp receipts; add stores or staff seats any time. <a href="/pricing">Compare plans</a>.',
    html: true,
  },
  {
    q: 'Can I use Storvv on my phone?',
    a: 'Yes. app.storvv.com in your browser. iOS and Android apps are coming.',
  },
  {
    q: 'What if my internet drops?',
    a: 'Keep selling. Sales made offline are saved on the device and recorded as soon as you are back online. Anything that needs a manager to approve it waits for a connection.',
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
    a: 'Cash, card, transfer, OPay, Moniepoint, PalmPay, Kuda, USSD, mobile money, and splits. Edit the list in Settings.',
  },
  {
    q: 'Is my data safe?',
    a: 'Sales save to the cloud as you work. Roles limit what staff see. Optional two-step sign-in. Export to Excel any time.',
  },
  {
    q: 'Can I try before signing up?',
    a: 'Yes. <a href="/?walkthrough=1">Book a free walkthrough</a> and we’ll show you around a sample shop. Or start free on Micro, no card needed.',
    html: true,
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes, from Settings. Nothing is deleted when you move to a smaller plan.',
  },
]

useMarketingSeo({
  title: 'Storvv · Point of sale and inventory for shops in every branch',
  description:
    'Point of sale and inventory software for gadget stores, supermarkets, pharmacies and dealers in Nigeria. Sell, track stock across branches and send receipts on WhatsApp. Free for one store.',
  path: '/',
  jsonLd: [
    organizationJsonLd(),
    websiteJsonLd(),
    softwareJsonLd(marketingSoftwareOffers()),
    faqJsonLd(faq),
  ],
})
</script>
