<template>
  <div class="ds-root s-c mk">
    <header
      class="mk-header"
      :class="{
        'mk-header--scrolled': headerScrolled,
        'mk-header--open': menuOpen,
        'mk-header--overlay': route.path === '/' && !headerScrolled && !menuOpen,
      }"
    >
      <div class="mk-container">
        <div class="mk-header__bar">
          <NuxtLink
            to="/"
            class="mk-header__brand"
            aria-label="Storvv home"
            @click="menuOpen = false"
          >
            <img :src="logoSrc" alt="" class="mk-header__logo" width="82" height="22" />
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
            <SIconButton class="mk-header__theme" :label="themeLabel" @click="toggleTheme">
              <Moon v-if="isDark" :size="18" aria-hidden="true" />
              <Sun v-else :size="18" aria-hidden="true" />
            </SIconButton>
            <SButton
              variant="ghost"
              class="mk-btn mk-btn--compact mk-header__signin"
              :to="signinUrl"
            >
              Sign in
            </SButton>
            <SButton variant="primary" class="mk-btn mk-btn--compact mk-header__cta" :to="signupUrl"
              >Start free</SButton
            >
            <button
              ref="burgerEl"
              type="button"
              class="mk-burger"
              :class="{ 'mk-burger--open': menuOpen }"
              :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
              :aria-expanded="menuOpen"
              aria-controls="mk-menu"
              @click="menuOpen = !menuOpen"
              @keydown="onBurgerKeydown"
            >
              <span class="mk-burger__line" aria-hidden="true" />
              <span class="mk-burger__line" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <Transition name="mk-menu" @after-enter="focusFirstMenuItem">
      <div
        v-if="menuOpen"
        id="mk-menu"
        ref="menuEl"
        class="mk-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        @keydown="onMenuKeydown"
      >
        <div class="mk-menu__body">
          <nav aria-label="Site menu">
            <ul class="mk-menu__list" role="list">
              <li class="mk-menu__item mk-menu__stagger" style="--i: 0">
                <a href="/#product" class="mk-menu__link" @click.prevent="openSection('product')">
                  <span>Product</span>
                  <ChevronRight class="mk-menu__chevron" :size="18" aria-hidden="true" />
                </a>
              </li>
              <li
                v-for="(link, index) in pageLinks"
                :key="link.to"
                class="mk-menu__item mk-menu__stagger"
                :style="{ '--i': index + 1 }"
              >
                <NuxtLink
                  :to="link.to"
                  class="mk-menu__link"
                  :aria-current="route.path === link.to ? 'page' : undefined"
                  @click="menuOpen = false"
                >
                  <span>{{ link.label }}</span>
                  <ChevronRight class="mk-menu__chevron" :size="18" aria-hidden="true" />
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <NuxtLink
            to="/demo/dashboard"
            class="mk-menu__demo mk-menu__stagger"
            :style="{ '--i': pageLinks.length + 1 }"
            @click="menuOpen = false"
          >
            <span class="mk-menu__demo-icon" aria-hidden="true">
              <MonitorPlay :size="20" :stroke-width="1.75" />
            </span>
            <span class="mk-menu__demo-text">
              <span class="mk-menu__demo-title">Try the live demo</span>
              <span class="mk-menu__demo-sub">Sample data, no sign-up needed.</span>
            </span>
            <ArrowRight class="mk-menu__demo-arrow" :size="18" aria-hidden="true" />
          </NuxtLink>

          <div class="mk-menu__foot mk-menu__stagger" :style="{ '--i': pageLinks.length + 2 }">
            <div class="mk-menu__appearance">
              <span :id="appearanceLabelId" class="mk-menu__appearance-label">Appearance</span>
              <div class="mk-segmented" role="radiogroup" :aria-labelledby="appearanceLabelId">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  type="button"
                  role="radio"
                  class="mk-segmented__option"
                  :aria-checked="theme === option.value"
                  :aria-label="option.label"
                  @click="setTheme(option.value)"
                >
                  <component :is="option.icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div class="mk-menu__actions">
              <SButton variant="primary" class="mk-btn mk-menu__cta" :to="signupUrl"
                >Start free</SButton
              >
              <SButton variant="secondary" class="mk-btn mk-menu__cta" :to="signinUrl"
                >Sign in</SButton
              >
            </div>
            <p class="mk-menu__note">Free forever for one store. No card needed.</p>
          </div>
        </div>
      </div>
    </Transition>

    <main>
      <slot />
    </main>

    <MkFooter />

    <div
      v-if="!cookiesAccepted && !menuOpen"
      class="mk-cookie"
      role="region"
      aria-label="Cookie notice"
    >
      <p>
        We use essential cookies to keep you signed in, and analytics cookies to improve Storvv.
        <NuxtLink to="/privacy" class="mk-link mk-cookie__more">Learn more</NuxtLink>
      </p>
      <div class="mk-cookie__actions">
        <SButton variant="ghost" class="mk-cookie__btn" @click="chooseCookies('essential')">
          Essential only
        </SButton>
        <SButton variant="secondary" class="mk-cookie__btn" @click="chooseCookies('all')">
          Accept all
        </SButton>
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
import '~/assets/css/marketing-home.css'
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { ArrowRight, ArrowUp, ChevronRight, Monitor, MonitorPlay, Moon, Sun } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import MkFooter from '~/components/marketing/MkFooter.vue'
import { useTheme } from '~/composables/useTheme'
import { useSectionScroll } from '~/composables/useSectionScroll'
import {
  useMarketingLogo,
  useMarketingReveal,
  useMarketingSigninUrl,
  useMarketingSignupUrl,
} from '~/composables/useMarketingSite'
import { readCookieChoice, saveCookieChoice, type CookieChoice } from '~/utils/cookie-consent'

const route = useRoute()
const signupUrl = useMarketingSignupUrl()
const signinUrl = useMarketingSigninUrl()
const logoSrc = useMarketingLogo()
const { scrollToSection, scrollToTop, goToSection } = useSectionScroll()
const { theme, actualTheme, setTheme, initTheme, applyTheme } = useTheme()
useMarketingReveal()

const pageLinks = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Security', to: '/security' },
  { label: 'Help', to: '/help' },
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

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

const appearanceLabelId = useId()
const menuOpen = ref(false)
const menuEl = ref<HTMLElement | null>(null)
const burgerEl = ref<HTMLButtonElement | null>(null)
const headerScrolled = ref(false)

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusFirstMenuItem() {
  menuEl.value?.querySelector<HTMLElement>('.mk-menu__link')?.focus({ preventScroll: true })
}

/* The burger stays above the sheet, so it is part of the focus loop and Tab never leaves the menu */
function onMenuKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !menuEl.value || !burgerEl.value) return
  const items = [burgerEl.value, ...menuEl.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
  const first = items[0]!
  const last = items[items.length - 1]!
  if (event.shiftKey && document.activeElement === menuEl.value.querySelector(FOCUSABLE)) {
    event.preventDefault()
    first.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function onBurgerKeydown(event: KeyboardEvent) {
  if (!menuOpen.value || event.key !== 'Tab') return
  const items = menuEl.value ? [...menuEl.value.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
  if (!items.length) return
  event.preventDefault()
  ;(event.shiftKey ? items[items.length - 1]! : items[0]!).focus()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && menuOpen.value) menuOpen.value = false
}
const showBackToTop = ref(false)
const cookiesAccepted = ref(true)

function openSection(id: string) {
  menuOpen.value = false
  goToSection(id)
}

/** Visitor's cookie choice; analytics stays off unless they accept all (see 01.firebase.client). */
function chooseCookies(choice: CookieChoice) {
  cookiesAccepted.value = true
  saveCookieChoice(choice)
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

watch(menuOpen, (open, wasOpen) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open && wasOpen && menuEl.value?.contains(document.activeElement)) {
    void nextTick(() => burgerEl.value?.focus({ preventScroll: true }))
  }
})

onMounted(() => {
  initTheme()
  applyTheme()
  syncThemeColor()
  desktopQuery = window.matchMedia('(min-width: 900px)')
  desktopQuery.addEventListener('change', closeMenuOnDesktop)
  cookiesAccepted.value = readCookieChoice() !== null
  if (window.location.hash) {
    const id = window.location.hash.slice(1)
    setTimeout(() => scrollToSection(id), 100)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('keydown', onDocumentKeydown)
  onScroll()
})

onUnmounted(() => {
  document.body.style.overflow = ''
  desktopQuery?.removeEventListener('change', closeMenuOnDesktop)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>
