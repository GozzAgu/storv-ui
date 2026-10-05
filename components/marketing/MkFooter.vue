<template>
  <footer class="mk-footer" aria-labelledby="mk-footer-title">
    <h2 id="mk-footer-title" class="ds-sr-only">Site footer</h2>
    <div class="mk-container">
      <div class="mk-footer__top">
        <div class="mk-footer__brand">
          <NuxtLink to="/" class="mk-header__brand" aria-label="Storvv home">
            <img :src="logoSrc" alt="" class="mk-header__logo" width="104" height="28" />
          </NuxtLink>
          <p class="mk-card__text">
            The retail operating system for shops that want every sale, item, and branch in one
            place.
          </p>
          <p class="mk-pill">
            <span class="mk-pill__dot" aria-hidden="true" />
            Live on the web · iOS &amp; Android soon
          </p>
        </div>

        <nav class="mk-footer__cols" aria-label="Footer">
          <div v-for="col in columns" :key="col.title">
            <p class="mk-footer__col-title">{{ col.title }}</p>
            <ul class="mk-footer__links">
              <li v-for="link in col.links" :key="link.label">
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
                  <span v-if="link.soon" class="mk-tag">Soon</span>
                </NuxtLink>
                <a v-else :href="link.href" class="mk-footer__link">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div class="mk-footer__bar">
        <p>&copy; {{ year }} Storvv. All rights reserved.</p>
        <div class="mk-footer__social">
          <a
            href="mailto:hello@storvv.com"
            class="s-c s-icon-btn"
            aria-label="Email hello@storvv.com"
          >
            <Mail :size="16" aria-hidden="true" />
          </a>
          <a
            href="https://www.instagram.com/_storvv_"
            target="_blank"
            rel="noopener noreferrer"
            class="s-c s-icon-btn"
            aria-label="Storvv on Instagram"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
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
            class="s-c s-icon-btn"
            aria-label="Storvv on X"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path
                d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.1 14.5Z"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Mail } from '@lucide/vue'
import { useSectionScroll } from '~/composables/useSectionScroll'
import { useMarketingLogo } from '~/composables/useMarketingSite'

const logoSrc = useMarketingLogo()
const { goToSection } = useSectionScroll()
const year = new Date().getFullYear()

interface FooterLink {
  label: string
  to?: string
  section?: string
  href?: string
  soon?: boolean
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', section: 'product' },
      { label: 'Storvv Assistant', section: 'assistant' },
      { label: 'All features', to: '/features' },
      { label: 'Live demo', to: '/demo/dashboard' },
      { label: 'Storefront', to: '/features#soon', soon: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Pricing', to: '/pricing' },
      { label: 'Security', to: '/security' },
      { label: 'FAQ', section: 'faq' },
      { label: 'Contact', section: 'contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'hello@storvv.com', href: 'mailto:hello@storvv.com' },
    ],
  },
]
</script>
