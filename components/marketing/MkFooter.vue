<template>
  <footer class="mk-footer" aria-labelledby="mk-footer-title">
    <h2 id="mk-footer-title" class="ds-sr-only">Site footer</h2>
    <div class="mk-container">
      <div class="mk-footer__top">
        <div class="mk-footer__brand">
          <NuxtLink to="/" class="mk-footer__logo" aria-label="Storvv home">
            <img src="/brand/storvv-logo-reversed.png" alt="" width="122" height="28" />
          </NuxtLink>
          <div class="mk-footer__social">
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mk-footer__social-link"
              aria-label="Chat with Storvv on WhatsApp"
            >
              <MessageCircle :size="18" aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/_storvv_"
              target="_blank"
              rel="noopener noreferrer"
              class="mk-footer__social-link"
              aria-label="Storvv on Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://x.com/_storvv_"
              target="_blank"
              rel="noopener noreferrer"
              class="mk-footer__social-link"
              aria-label="Storvv on X"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.1 14.5Z"
                />
              </svg>
            </a>
            <a
              href="mailto:hello@storvv.com"
              class="mk-footer__social-link"
              aria-label="Email hello@storvv.com"
            >
              <Mail :size="18" aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav class="mk-footer__cols" aria-label="Footer">
          <div v-for="col in columns" :key="col.groups[0].title" class="mk-footer__col">
            <div v-for="group in col.groups" :key="group.title" class="mk-footer__group">
              <p class="mk-footer__col-title">{{ group.title }}</p>
              <ul class="mk-footer__links">
                <li v-for="link in group.links" :key="link.label">
                  <a
                    v-if="link.section"
                    :href="`/#${link.section}`"
                    class="mk-footer__link"
                    @click.prevent="goToSection(link.section)"
                  >
                    {{ link.label }}
                  </a>
                  <NuxtLink v-else-if="link.to" :to="link.to" class="mk-footer__link">
                    {{ link.label }}
                    <span v-if="link.soon" class="mk-footer__soon">Soon</span>
                  </NuxtLink>
                  <a
                    v-else
                    :href="link.href"
                    class="mk-footer__link"
                    v-bind="link.external ? { target: '_blank', rel: 'noopener' } : {}"
                    >{{ link.label }}</a
                  >
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>

      <div class="mk-footer__bar">
        <p class="mk-footer__legal">&copy; {{ year }} Storvv. All rights reserved.</p>
        <nav class="mk-footer__legal-links" aria-label="Legal">
          <NuxtLink to="/privacy" class="mk-footer__link">Privacy Policy</NuxtLink>
          <NuxtLink to="/terms" class="mk-footer__link">Terms</NuxtLink>
          <NuxtLink to="/security" class="mk-footer__link">Security</NuxtLink>
          <span class="mk-footer__region">
            <svg viewBox="0 0 3 2" width="18" height="12" aria-hidden="true" focusable="false">
              <rect width="3" height="2" fill="#fff" />
              <rect width="1" height="2" fill="#008751" />
              <rect x="2" width="1" height="2" fill="#008751" />
            </svg>
            Nigeria · NGN
          </span>
        </nav>
      </div>
    </div>

    <p class="mk-footer__word" aria-hidden="true">Storvv</p>
  </footer>
</template>

<script setup lang="ts">
import { Mail, MessageCircle } from '~/icons'
import { STORVV_CONTACT } from '~/utils/marketing-seo'
import { storvvWhatsappLink } from '~/utils/storvv-whatsapp'
import { useSectionScroll } from '~/composables/useSectionScroll'
import { useMarketingSigninUrl, useMarketingSignupUrl } from '~/composables/useMarketingSite'

const signupUrl = useMarketingSignupUrl()
const signinUrl = useMarketingSigninUrl()
const { goToSection } = useSectionScroll()
const year = new Date().getFullYear()

interface FooterLink {
  label: string
  to?: string
  section?: string
  href?: string
  soon?: boolean
  /** Opens in a new tab (WhatsApp). */
  external?: boolean
}

const whatsappUrl = storvvWhatsappLink('Hi Storvv, I have a question.')

/** Each column holds one or two titled groups, like the sections of a printed menu. */
const columns: { groups: { title: string; links: FooterLink[] }[] }[] = [
  {
    groups: [
      {
        title: 'Product',
        links: [
          { label: 'How it works', section: 'how-it-works' },
          { label: 'All features', to: '/features' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'Book a walkthrough', to: '?walkthrough=1' },
        ],
      },
      {
        title: 'Coming soon',
        links: [
          { label: 'Storefront', to: '/features#soon', soon: true },
          { label: 'Mobile apps', to: '/features#soon', soon: true },
        ],
      },
    ],
  },
  {
    groups: [
      {
        title: 'Company',
        links: [
          { label: 'About', to: '/about' },
          { label: 'Security', to: '/security' },
          { label: 'Help centre', to: '/help' },
          { label: 'FAQ', section: 'faq' },
        ],
      },
    ],
  },
  {
    groups: [
      {
        title: 'Contact',
        links: [
          { label: 'Chat on WhatsApp', href: whatsappUrl, external: true },
          { label: STORVV_CONTACT.phoneDisplay, href: `tel:${STORVV_CONTACT.phone}` },
          { label: STORVV_CONTACT.email, href: `mailto:${STORVV_CONTACT.email}` },
        ],
      },
      {
        title: 'Get started',
        links: [
          { label: 'Create your free store', href: signupUrl.value },
          { label: 'Sign in', href: signinUrl.value },
        ],
      },
    ],
  },
]
</script>
