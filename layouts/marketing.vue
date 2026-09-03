<template>
  <div class="landing-page landing-page--portfolio min-h-screen antialiased">
    <header
      class="landing-header"
      :class="{ 'landing-header--menu-open': mobileMenuOpen, 'landing-header--scrolled': headerScrolled }"
    >
      <div class="landing-header__shell">
        <div class="landing-header__pill">
          <NuxtLink
            to="/"
            class="landing-header__brand"
            aria-label="Storvv home"
            @click="mobileMenuOpen = false"
          >
            <img
              :src="landingLogoSrc"
              alt=""
              class="landing-header__logo"
              width="140"
              height="40"
            />
          </NuxtLink>

          <nav class="landing-header__links landing-header__desktop" aria-label="Primary">
            <a href="/#product" class="landing-nav-link" @click.prevent="goToSection('inventory')"
              >Product</a
            >
            <a
              href="/#capabilities-grid"
              class="landing-nav-link"
              @click.prevent="goToSection('capabilities-grid')"
              >Features</a
            >
            <NuxtLink to="/pricing" class="landing-nav-link">Pricing</NuxtLink>
            <a href="/#faq" class="landing-nav-link" @click.prevent="goToSection('faq')"
              >Resources</a
            >
          </nav>

          <div class="landing-header__actions">
            <ThemeToggle />
            <a :href="appOriginUrl" class="landing-header__sign-in">Sign in</a>
            <a :href="appOriginUrl" class="landing-header__cta">Get Started</a>
            <div class="landing-header__mobile">
              <NuxtLink
                to="/demo/dashboard"
                class="landing-header__cta landing-header__cta--compact"
                >Try demo</NuxtLink
              >
              <button
                type="button"
                class="landing-header__menu-btn"
                :aria-expanded="mobileMenuOpen"
                aria-controls="landing-mobile-nav"
                :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
                @click="mobileMenuOpen = !mobileMenuOpen"
              >
                <XMarkIcon
                  v-if="mobileMenuOpen"
                  class="landing-header__menu-icon"
                  aria-hidden="true"
                />
                <Bars3Icon v-else class="landing-header__menu-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <Transition name="landing-mobile-layer">
        <div
          v-if="mobileMenuOpen"
          class="landing-mobile-layer landing-page--portfolio md:hidden"
          role="presentation"
        >
          <button
            type="button"
            class="landing-mobile-backdrop"
            aria-label="Close menu"
            @click="mobileMenuOpen = false"
          />
          <div
            id="landing-mobile-nav"
            class="landing-mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <nav class="landing-mobile-panel__nav" aria-label="Primary">
              <a
                href="/#product"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    goToSection('inventory')
                    mobileMenuOpen = false
                  }
                "
                >Product</a
              >
              <a
                href="/#capabilities-grid"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    goToSection('capabilities-grid')
                    mobileMenuOpen = false
                  }
                "
                >Features</a
              >
              <NuxtLink
                to="/pricing"
                class="landing-mobile-nav-link"
                @click="mobileMenuOpen = false"
                >Pricing</NuxtLink
              >
              <a
                href="/#faq"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    goToSection('faq')
                    mobileMenuOpen = false
                  }
                "
                >Resources</a
              >
              <a
                :href="appOriginUrl"
                class="landing-mobile-nav-link"
                @click="mobileMenuOpen = false"
                >Sign in</a
              >
            </nav>
            <div class="landing-mobile-panel__cta-wrap">
              <a
                :href="appOriginUrl"
                class="landing-header__cta landing-mobile-panel__cta"
                @click="mobileMenuOpen = false"
              >
                Get Started
              </a>
              <a
                :href="appOriginUrl"
                class="landing-mobile-panel__secondary-cta"
                @click="mobileMenuOpen = false"
              >
                Start free
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <slot />

    <!-- Footer -->
    <footer class="landing-footer landing-footer--premium">
      <div class="landing-footer__inner">
        <div class="landing-footer__top landing-footer__columns">
          <div>
            <NuxtLink to="/" class="landing-footer__brand">
              <img
                :src="landingLogoSrc"
                alt="Storvv"
                class="landing-footer__logo"
                width="140"
                height="40"
              />
            </NuxtLink>
            <p class="landing-footer__tagline">
              Inventory, sales, payment links, analytics, and multi-branch tools for modern
              retailers - on web and iOS.
            </p>
          </div>

          <div>
            <p class="landing-footer__col-title">Product</p>
            <div class="landing-footer__links">
              <a href="/#inventory" class="landing-footer__link" @click.prevent="goToSection('inventory')"
                >Inventory</a
              >
              <a href="/#sales" class="landing-footer__link" @click.prevent="goToSection('sales')"
                >Sales</a
              >
              <a
                href="/#capabilities-grid"
                class="landing-footer__link"
                @click.prevent="goToSection('capabilities-grid')"
                >All features</a
              >
              <a href="/#analytics" class="landing-footer__link" @click.prevent="goToSection('analytics')"
                >Analytics</a
              >
              <NuxtLink to="/demo/dashboard" class="landing-footer__link">Try demo</NuxtLink>
            </div>
          </div>

          <div>
            <p class="landing-footer__col-title">Resources</p>
            <div class="landing-footer__links">
              <NuxtLink to="/pricing" class="landing-footer__link">Pricing</NuxtLink>
              <NuxtLink to="/security" class="landing-footer__link">Security</NuxtLink>
              <a href="/#faq" class="landing-footer__link" @click.prevent="goToSection('faq')">FAQ</a>
              <a href="/#contact" class="landing-footer__link" @click.prevent="goToSection('contact')"
                >Contact</a
              >
            </div>
          </div>

          <div>
            <p class="landing-footer__col-title">Company</p>
            <div class="landing-footer__links">
              <a href="mailto:hello@storvv.com" class="landing-footer__link">hello@storvv.com</a>
              <a
                href="https://www.instagram.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="landing-footer__link"
                >Instagram</a
              >
              <a
                href="https://x.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="landing-footer__link"
                >X</a
              >
              <NuxtLink to="/privacy" class="landing-footer__link">Privacy</NuxtLink>
              <NuxtLink to="/terms" class="landing-footer__link">Terms</NuxtLink>
            </div>
          </div>
        </div>

        <div class="landing-footer__bottom">
          <p>&copy; {{ new Date().getFullYear() }} Storvv. All rights reserved.</p>
          <p>
            Powered by Nuxt ·
            <a
              href="https://goz-portfolio-app.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              class="landing-footer__link"
              >Credits</a
            >
          </p>
        </div>
      </div>

      <!-- Cookie consent banner -->
      <div v-if="!cookiesAccepted" class="landing-cookie-banner">
        <p class="landing-cookie-banner__text">
          We use cookies on our website to help us provide the best browsing experience. By
          continuing to use our website you are deemed to have agreed to the use of cookies.
        </p>
        <div class="landing-cookie-banner__actions">
          <NuxtLink to="/privacy" class="landing-cookie-banner__link">Learn more</NuxtLink>
          <button type="button" class="landing-cookie-banner__btn" @click="acceptCookies">
            OK
          </button>
        </div>
      </div>
    </footer>

    <!-- Back to Top Button -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#1a1523] text-white hover:bg-[#111018] transition-colors flex items-center justify-center dark:bg-white dark:text-[#1a1523] dark:hover:bg-[#f4f4f5]"
        aria-label="Back to top"
      >
        <ArrowUpIcon class="w-5 h-5" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import { Bars3Icon, XMarkIcon, ArrowUpIcon } from '~/utils/app-icons'
import { useThemeStore } from '~/stores/theme'
import { useSectionScroll } from '~/composables/useSectionScroll'

const themeStore = useThemeStore()
const route = useRoute()
const { scrollToSection, scrollToTop, goToSection } = useSectionScroll()

/** Light wordmark for light canvas. */
const landingLogoSrc = computed(() =>
  themeStore.actualTheme === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

function applyLandingDocumentTheme() {
  if (!import.meta.client) return
  themeStore.initTheme()
  themeStore.applyTheme()
  const html = document.documentElement
  const isDark = html.classList.contains('dark')
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', isDark ? '#080808' : '#f5f5f7')
}

const mobileMenuOpen = ref(false)
const headerScrolled = ref(false)
const showBackToTop = ref(false)
const cookiesAccepted = ref(true)

const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})

let mobileMenuMql: MediaQueryList | null = null
function closeMobileMenuIfDesktop() {
  if (mobileMenuMql?.matches) mobileMenuOpen.value = false
}

watch(
  () => themeStore.actualTheme,
  () => applyLandingDocumentTheme()
)

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)

// `<NuxtLayout>` keeps this layout instance mounted across client-side page
// changes (it only remounts if the layout name itself changes), so the
// onMounted hash-scroll below only fires on a hard/first load. Client-side
// navigations to e.g. `/#faq` from another marketing page need this watcher
// instead - the target section lives on the page that just finished mounting.
watch(
  () => route.fullPath,
  () => {
    if (!import.meta.client || !route.hash) return
    const sectionId = route.hash.substring(1)
    setTimeout(() => scrollToSection(sectionId), 150)
  }
)

watch(mobileMenuOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

const acceptCookies = () => {
  cookiesAccepted.value = true
  if (import.meta.client) localStorage.setItem('storvv-cookies-accepted', 'true')
}

function handleScroll() {
  headerScrolled.value = window.scrollY > 24
  showBackToTop.value = window.scrollY > 400
}

onMounted(() => {
  if (import.meta.client) {
    applyLandingDocumentTheme()
    mobileMenuMql = window.matchMedia('(min-width: 768px)')
    mobileMenuMql.addEventListener('change', closeMobileMenuIfDesktop)
  }

  if (import.meta.client && !localStorage.getItem('storvv-cookies-accepted')) {
    cookiesAccepted.value = false
  }

  // Deep-link into a section on this page (e.g. arriving at /#faq from another page).
  if (import.meta.client && window.location.hash) {
    const sectionId = window.location.hash.substring(1)
    setTimeout(() => scrollToSection(sectionId), 100)
  }

  if (import.meta.client) {
    window.addEventListener('scroll', handleScroll)
    handleScroll()
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    mobileMenuMql?.removeEventListener('change', closeMobileMenuIfDesktop)
    mobileMenuMql = null
    themeStore.applyTheme()
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>
