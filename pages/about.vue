<template>
  <div>
    <!-- Hero -->
    <section class="mk-hero mk-hero--page" aria-labelledby="about-title">
      <div class="mk-container">
        <div class="mk-hero__copy">
          <p class="mk-eyebrow">About Storvv</p>
          <h1 id="about-title" class="mk-h1">
            Built for shops that sell, <span class="mk-accent">in every branch.</span>
          </h1>
          <p class="mk-lede">
            Storvv is point of sale and inventory software for gadget stores, supermarkets,
            pharmacies, dealers and wholesalers. Prices are in naira, it records the ways Nigerian
            customers pay, and a real person answers when you get in touch.
          </p>
          <div class="mk-actions mk-actions--center">
            <SButton variant="primary" size="lg" class="mk-btn" to="#contact"> Contact us </SButton>
            <SButton variant="secondary" size="lg" class="mk-btn" :to="signupUrl">
              Create your free store
            </SButton>
          </div>
        </div>
      </div>
    </section>

    <!-- What we stand for: each point is a commitment already made elsewhere on the site -->
    <section class="mk-section mk-section--alt" aria-labelledby="about-promises-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="about-promises-title"
          eyebrow="How we work"
          title="Simple to start,"
          accent="honest as you grow."
        />
        <ul class="mk-grid mk-grid--3">
          <li v-for="promise in promises" :key="promise.title" class="mk-card mk-reveal">
            <span class="mk-card__icon">
              <component :is="promise.icon" :size="20" aria-hidden="true" />
            </span>
            <h3 class="mk-card__title">{{ promise.title }}</h3>
            <p class="mk-card__text">{{ promise.text }}</p>
            <NuxtLink :to="promise.link.to" class="mk-link mk-about__more">
              {{ promise.link.label }}
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="mk-section" aria-labelledby="about-contact-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="about-contact-title"
          eyebrow="Contact"
          title="Talk to a person,"
          accent="not a ticket queue."
          lede="Questions before you sign up, help with your account, or a written answer for procurement: pick whichever is easiest."
        />
        <ul class="mk-grid mk-grid--4">
          <li v-for="channel in channels" :key="channel.title" class="mk-card mk-reveal">
            <span class="mk-card__icon">
              <component :is="channel.icon" :size="20" aria-hidden="true" />
            </span>
            <h3 class="mk-card__title">{{ channel.title }}</h3>
            <p class="mk-card__text">{{ channel.text }}</p>
            <a
              v-if="channel.href"
              :href="channel.href"
              class="mk-link mk-about__more"
              v-bind="channel.external ? { target: '_blank', rel: 'noopener' } : {}"
            >
              {{ channel.action }}
              <ArrowRight :size="16" aria-hidden="true" />
            </a>
            <button
              v-else
              type="button"
              class="mk-link mk-about__more mk-about__btn"
              @click="walkthrough.open('landing_cta')"
            >
              {{ channel.action }}
              <ArrowRight :size="16" aria-hidden="true" />
            </button>
          </li>
        </ul>

        <p class="mk-about__social">
          Follow Storvv on
          <a :href="STORVV_CONTACT.instagram" target="_blank" rel="noopener" class="mk-link"
            >Instagram</a
          >
          and <a :href="STORVV_CONTACT.x" target="_blank" rel="noopener" class="mk-link">X</a>.
        </p>
      </div>
    </section>

    <MkCta
      title="Your first store"
      accent="is on us."
      lede="Set up Micro in about ten minutes, in the browser on the phone or laptop you already have."
      :primary="{ label: 'Create your free store', to: signupUrl }"
      walkthrough
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowRight,
  CalendarDays,
  Gift,
  Headset,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingSeo } from '~/composables/useMarketingSeo'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'
import { useWalkthrough } from '~/composables/useWalkthrough'
import { STORVV_CONTACT, breadcrumbJsonLd, organizationJsonLd } from '~/utils/marketing-seo'
import { storvvWhatsappLink } from '~/utils/storvv-whatsapp'

definePageMeta({ layout: 'marketing' })

const signupUrl = useMarketingSignupUrl()
const walkthrough = useWalkthrough()

const promises = [
  {
    icon: Gift,
    title: 'Free to start',
    text: 'Micro is free forever for one store and two staff. No card needed, and you only pay when you need more branches or people.',
    link: { label: 'See pricing', to: '/pricing' },
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours',
    text: 'Every person gets their own login and permissions, and you can download your data any time. Downgrading never deletes it.',
    link: { label: 'How we protect it', to: '/security' },
  },
  {
    icon: Headset,
    title: 'Help from real people',
    text: 'Ask on WhatsApp, by phone or by email and someone from Storvv replies, usually the same day.',
    link: { label: 'Browse the help centre', to: '/help' },
  },
]

const channels = computed(() => [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    text: `Chat with us on ${STORVV_CONTACT.phoneDisplay}. The quickest way to reach us.`,
    action: 'Chat on WhatsApp',
    href: storvvWhatsappLink('Hi Storvv, I have a question.'),
    external: true,
  },
  {
    icon: Phone,
    title: 'Phone',
    text: `Prefer to talk? Call ${STORVV_CONTACT.phoneDisplay}.`,
    action: 'Call us',
    href: `tel:${STORVV_CONTACT.phone}`,
  },
  {
    icon: Mail,
    title: 'Email',
    text: `Write to ${STORVV_CONTACT.email} for anything that needs a written answer.`,
    action: 'Send an email',
    href: `mailto:${STORVV_CONTACT.email}`,
  },
  {
    icon: CalendarDays,
    title: 'Walkthrough',
    text: 'A free, 20-minute tour of Storvv with our team, set up around your shop.',
    action: 'Book a walkthrough',
  },
])

useMarketingSeo({
  title: 'About and contact · Storvv',
  description: `Storvv is point of sale and inventory software for shops in Nigeria. Contact us on WhatsApp or by phone on ${STORVV_CONTACT.phoneDisplay}, or email ${STORVV_CONTACT.email}.`,
  path: '/about',
  jsonLd: [organizationJsonLd(), breadcrumbJsonLd('About', '/about')],
})
</script>

<style scoped>
.mk-about__more {
  margin-top: auto;
  padding-top: var(--s-space-1);
}

.mk-about__btn {
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.mk-about__social {
  margin-top: var(--s-space-4);
  text-align: center;
  color: var(--s-text-2);
}
</style>
