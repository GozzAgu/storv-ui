<template>
  <footer class="sfoot" aria-labelledby="sfoot-title">
    <h2 id="sfoot-title" class="sr-only">Storvv site footer</h2>
    <div class="sfoot__panel">
      <div class="sfoot__top">
        <div class="sfoot__brand">
          <NuxtLink to="/" class="sfoot__logo-link" aria-label="Storvv home">
            <img :src="logoSrc" alt="Storvv" class="sfoot__logo" width="132" height="38" />
          </NuxtLink>
          <p class="sfoot__tagline">
            The retail operating system for shops that want every sale, item, and branch in one
            place.
          </p>
          <p class="sfoot__avail">
            <span class="sfoot__dot" aria-hidden="true" />
            Live on the web · iOS &amp; Android apps coming soon
          </p>
        </div>

        <nav class="sfoot__cols" aria-label="Footer">
          <div v-for="col in columns" :key="col.title" class="sfoot__col">
            <p class="sfoot__col-title">{{ col.title }}</p>
            <ul class="sfoot__links">
              <li v-for="link in col.links" :key="link.label">
                <NuxtLink v-if="link.to" :to="link.to" class="sfoot__link">
                  {{ link.label }}
                  <span v-if="link.soon" class="sfoot__soon">Soon</span>
                </NuxtLink>
                <a
                  v-else-if="link.section"
                  :href="`/#${link.section}`"
                  class="sfoot__link"
                  @click.prevent="goToSection(link.section)"
                >
                  {{ link.label }}
                  <span v-if="link.soon" class="sfoot__soon">Soon</span>
                </a>
                <a v-else :href="link.href" class="sfoot__link">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div class="sfoot__bar">
        <p class="sfoot__copy">&copy; {{ year }} Storvv. All rights reserved.</p>
        <div class="sfoot__social">
          <a
            href="mailto:hello@storvv.com"
            class="sfoot__social-link"
            aria-label="Email hello@storvv.com"
          >
            <Mail class="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="https://www.instagram.com/_storvv_"
            target="_blank"
            rel="noopener noreferrer"
            class="sfoot__social-link"
            aria-label="Storvv on Instagram"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
          </a>
          <a
            href="https://x.com/_storvv_"
            target="_blank"
            rel="noopener noreferrer"
            class="sfoot__social-link"
            aria-label="Storvv on X"
          >
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.1 14.5Z" />
            </svg>
          </a>
        </div>
      </div>

      <p class="sfoot__wordmark" aria-hidden="true">Storvv</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Mail } from '@lucide/vue'
import { useThemeStore } from '~/stores/theme'
import { useSectionScroll } from '~/composables/useSectionScroll'

const themeStore = useThemeStore()
const { goToSection } = useSectionScroll()

const logoSrc = computed(() =>
  themeStore.actualTheme === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png',
)

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
      { label: 'Inventory', section: 'inventory' },
      { label: 'Sales', section: 'sales' },
      { label: 'Storvv Assistant', section: 'assistant' },
      { label: 'Storefront', section: 'storefront', soon: true },
      { label: 'All features', to: '/features' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Pricing', to: '/pricing' },
      { label: 'Security', to: '/security' },
      { label: 'FAQ', section: 'faq' },
      { label: 'Contact', section: 'contact' },
      { label: 'hello@storvv.com', href: 'mailto:hello@storvv.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
]
</script>

<style scoped>
.sfoot {
  padding: clamp(1rem, 2vw, 1.5rem) 1.25rem 1.25rem;
  background: #f5f5f7;
}

.sfoot__panel {
  position: relative;
  max-width: 72rem;
  margin: 0 auto;
  overflow: hidden;
  padding: clamp(1.75rem, 4vw, 3rem) clamp(1.25rem, 4vw, 3rem) 0;
  border-radius: 2rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.07);
  box-shadow: 0 30px 60px -48px rgb(20 63 141 / 0.35);
}

.sfoot__panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(91 127 224 / 0.6), transparent);
}

.sfoot__top {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 2.5rem;
}

@media (min-width: 960px) {
  .sfoot__top {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr);
    gap: 4rem;
  }
}

.sfoot__logo {
  display: block;
  width: auto;
  height: 2.1rem;
}

.sfoot__tagline {
  max-width: 22rem;
  margin-top: 1rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #475569;
}

.sfoot__avail {
  margin-top: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
}

.sfoot__dot {
  flex-shrink: 0;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #10b981;
  box-shadow: 0 0 0 3px rgb(16 185 129 / 0.18);
}

.sfoot__cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem 1.5rem;
}

@media (min-width: 640px) {
  .sfoot__cols {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.sfoot__col-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #94a3b8;
}

.sfoot__links {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.6rem;
}

.sfoot__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #334155;
  transition: color 180ms ease;
  overflow-wrap: anywhere;
}

.sfoot__link:hover {
  color: #143f8d;
}

.sfoot__soon {
  padding: 0.05rem 0.4rem;
  border-radius: 9999px;
  background: rgb(91 127 224 / 0.12);
  color: #143f8d;
  font-size: 0.62rem;
  font-weight: 700;
}

.sfoot__bar {
  position: relative;
  z-index: 1;
  margin-top: clamp(2.25rem, 5vw, 3rem);
  padding: 1.1rem 0;
  border-top: 1px solid rgb(15 23 42 / 0.07);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}

.sfoot__copy {
  font-size: 0.8rem;
  color: #64748b;
}

.sfoot__social {
  display: flex;
  gap: 0.4rem;
}

.sfoot__social-link {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 9999px;
  background: #f5f5f7;
  color: #334155;
  transition: background-color 200ms ease, color 200ms ease, transform 200ms ease;
}

.sfoot__social-link:hover {
  background: #143f8d;
  color: #ffffff;
  transform: translateY(-2px);
}

.sfoot__wordmark {
  padding: 0.5rem 0 clamp(1.25rem, 3vw, 2rem);
  font-size: clamp(3rem, 9vw, 6.5rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  text-align: center;
  background: linear-gradient(180deg, rgb(20 63 141 / 0.08), rgb(91 127 224 / 0.03));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  user-select: none;
  pointer-events: none;
}

@media (max-width: 520px) {
  .sfoot__bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Dark */
html.dark .sfoot {
  background: #080808;
}

html.dark .sfoot__panel {
  background: #121212;
  border-color: rgb(255 255 255 / 0.07);
  box-shadow: none;
}

html.dark .sfoot__tagline,
html.dark .sfoot__link {
  color: rgb(255 255 255 / 0.7);
}

html.dark .sfoot__link:hover {
  color: #a9bcf5;
}

html.dark .sfoot__col-title,
html.dark .sfoot__copy,
html.dark .sfoot__avail {
  color: rgb(255 255 255 / 0.45);
}

html.dark .sfoot__soon {
  background: rgb(112 144 240 / 0.16);
  color: #a9bcf5;
}

html.dark .sfoot__bar {
  border-top-color: rgb(255 255 255 / 0.07);
}

html.dark .sfoot__social-link {
  background: rgb(255 255 255 / 0.06);
  color: rgb(255 255 255 / 0.75);
}

html.dark .sfoot__social-link:hover {
  background: #4876c7;
  color: #ffffff;
}

html.dark .sfoot__wordmark {
  background-image: linear-gradient(180deg, rgb(169 188 245 / 0.08), rgb(169 188 245 / 0.02));
}

@media (prefers-reduced-motion: reduce) {
  .sfoot__social-link,
  .sfoot__link {
    transition: none;
  }
}
</style>
