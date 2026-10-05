<template>
  <div class="ds-root s-c mk">
    <header
      class="mk-header"
      :class="{ 'mk-header--scrolled': headerScrolled, 'mk-header--open': menuOpen }"
    >
      <div class="mk-container">
        <div class="mk-header__bar">
          <NuxtLink
            to="/"
            class="mk-header__brand"
            aria-label="Storvv home"
            @click="menuOpen = false"
          >
            <img :src="logoSrc" alt="" class="mk-header__logo" width="104" height="28" />
          </NuxtLink>

          <nav class="mk-header__nav" aria-label="Primary">
            <a href="/#product" class="mk-nav-link" @click.prevent="goToSection('product')"
              >Product</a
            >
            <NuxtLink v-for="link in pageLinks" :key="link.to" :to="link.to" class="mk-nav-link">
              {{ link.label }}
            </NuxtLink>
          </nav>

          <div class="mk-header__actions">
            <SIconButton :label="themeLabel" @click="toggleTheme">
              <Moon v-if="isDark" :size="18" aria-hidden="true" />
              <Sun v-else :size="18" aria-hidden="true" />
            </SIconButton>
            <SButton variant="ghost" class="mk-btn mk-btn--compact mk-header__signin" :to="appUrl">
              Sign in
            </SButton>
            <SButton variant="primary" class="mk-btn mk-btn--compact" :to="appUrl"
              >Start free</SButton
            >
            <SIconButton
              class="mk-header__menu"
              :label="menuOpen ? 'Close menu' : 'Open menu'"
              :aria-expanded="menuOpen"
              aria-controls="mk-menu"
              @click="menuOpen = !menuOpen"
            >
              <X v-if="menuOpen" :size="20" aria-hidden="true" />
              <Menu v-else :size="20" aria-hidden="true" />
            </SIconButton>
          </div>
        </div>
      </div>
    </header>

    <Transition name="mk-menu">
      <div v-if="menuOpen" class="mk-menu">
        <button
          type="button"
          class="mk-menu__scrim"
          aria-label="Close menu"
          @click="menuOpen = false"
        />
        <div id="mk-menu" class="mk-menu__panel">
          <nav class="mk-menu__nav" aria-label="Site menu">
            <a href="/#product" class="mk-menu__link" @click.prevent="openSection('product')"
              >Product</a
            >
            <NuxtLink
              v-for="link in pageLinks"
              :key="link.to"
              :to="link.to"
              class="mk-menu__link"
              @click="menuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <NuxtLink to="/demo/dashboard" class="mk-menu__link" @click="menuOpen = false">
              Live demo
            </NuxtLink>
          </nav>
          <div class="mk-menu__actions">
            <SButton variant="secondary" class="mk-btn" :to="appUrl">Sign in</SButton>
            <SButton variant="primary" class="mk-btn" :to="appUrl">Start free</SButton>
          </div>
        </div>
      </div>
    </Transition>

    <main>
      <slot />
    </main>

    <MkFooter />

    <div v-if="!cookiesAccepted" class="mk-cookie" role="region" aria-label="Cookie notice">
      <p>
        We use cookies to give you the best browsing experience. By continuing to use the site you
        agree to their use.
      </p>
      <div class="mk-cookie__actions">
        <NuxtLink to="/privacy" class="mk-link">Learn more</NuxtLink>
        <SButton variant="primary" size="sm" @click="acceptCookies">OK</SButton>
      </div>
    </div>

    <Transition name="mk-fade">
      <div v-if="showBackToTop && cookiesAccepted" class="mk-to-top">
        <SIconButton label="Back to top" variant="secondary" @click="scrollToTop">
          <ArrowUp :size="18" aria-hidden="true" />
        </SIconButton>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/marketing.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowUp, Menu, Moon, Sun, X } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import MkFooter from '~/components/marketing/MkFooter.vue'
import { useTheme } from '~/composables/useTheme'
import { useSectionScroll } from '~/composables/useSectionScroll'
import {
  useMarketingAppUrl,
  useMarketingLogo,
  useMarketingReveal,
} from '~/composables/useMarketingSite'

const route = useRoute()
const appUrl = useMarketingAppUrl()
const logoSrc = useMarketingLogo()
const { scrollToSection, scrollToTop, goToSection } = useSectionScroll()
const { actualTheme, setTheme, initTheme, applyTheme } = useTheme()
useMarketingReveal()

const pageLinks = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Security', to: '/security' },
]

const isDark = computed(() => actualTheme.value === 'dark')
const themeLabel = computed(() => (isDark.value ? 'Switch to light mode' : 'Switch to dark mode'))

function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}

function syncThemeColor() {
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', getComputedStyle(document.body).backgroundColor)
}

const menuOpen = ref(false)
const headerScrolled = ref(false)
const showBackToTop = ref(false)
const cookiesAccepted = ref(true)

function openSection(id: string) {
  menuOpen.value = false
  goToSection(id)
}

function acceptCookies() {
  cookiesAccepted.value = true
  localStorage.setItem('storvv-cookies-accepted', 'true')
}

function onScroll() {
  headerScrolled.value = window.scrollY > 8
  showBackToTop.value = window.scrollY > 800
}

let desktopQuery: MediaQueryList | null = null
function closeMenuOnDesktop() {
  if (desktopQuery?.matches) menuOpen.value = false
}

watch(actualTheme, () => requestAnimationFrame(syncThemeColor))

watch(
  () => route.path,
  () => {
    menuOpen.value = false
  }
)

// The layout stays mounted across client-side navigation, so hash links from other pages
// (e.g. `/#faq`) scroll here once the new page has rendered.
watch(
  () => route.fullPath,
  () => {
    if (!route.hash) return
    setTimeout(() => scrollToSection(route.hash.slice(1)), 150)
  }
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  initTheme()
  applyTheme()
  syncThemeColor()
  desktopQuery = window.matchMedia('(min-width: 900px)')
  desktopQuery.addEventListener('change', closeMenuOnDesktop)
  cookiesAccepted.value = !!localStorage.getItem('storvv-cookies-accepted')
  if (window.location.hash) {
    const id = window.location.hash.slice(1)
    setTimeout(() => scrollToSection(id), 100)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  document.body.style.overflow = ''
  desktopQuery?.removeEventListener('change', closeMenuOnDesktop)
  window.removeEventListener('scroll', onScroll)
})
</script>
