import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '~/stores/theme'

/** Where "Sign in" and "Start free" send people. */
export function useMarketingAppUrl() {
  const runtimeConfig = useRuntimeConfig()
  return computed(() => {
    const origin = runtimeConfig.public.appOrigin
    return typeof origin === 'string' && origin.length > 0 ? origin : 'https://app.storvv.com'
  })
}

/** Where "Start free" goes: straight to account creation, not the sign-in screen. */
export function useMarketingSignupUrl() {
  const appUrl = useMarketingAppUrl()
  return computed(() => `${appUrl.value.replace(/\/$/, '')}/signup`)
}

export function useMarketingSigninUrl() {
  const appUrl = useMarketingAppUrl()
  return computed(() => `${appUrl.value.replace(/\/$/, '')}/signin`)
}

/** Wordmark that contrasts the current theme. */
export function useMarketingLogo() {
  const themeStore = useThemeStore()
  return computed(() =>
    themeStore.actualTheme === 'dark' ? '/brand/storvv-logo-reversed.png' : '/brand/storvv-logo.png'
  )
}

/**
 * Fades `.mk-reveal` blocks in as they scroll into view. Also picks up blocks added later (a new
 * page, a tab switch, a hot reload in development), since an unobserved block would stay hidden.
 */
export function useMarketingReveal() {
  const route = useRoute()
  let observer: IntersectionObserver | null = null
  let mutations: MutationObserver | null = null
  let pending = 0

  function scan() {
    pending = 0
    if (!observer) return
    document
      .querySelectorAll('.mk-reveal:not([data-revealed])')
      .forEach((el) => observer?.observe(el))
  }

  function scheduleScan() {
    if (!pending) pending = requestAnimationFrame(scan)
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          // An attribute, not a class: Vue rewrites `class` on reactive bindings and would drop it.
          entry.target.setAttribute('data-revealed', '')
          observer?.unobserve(entry.target)
        }
      },
      // Any part showing counts: a tall block (a table, a card grid) that only peeks in after a
      // jump to its anchor must not sit there invisible
      { rootMargin: '0px 0px -40px 0px', threshold: 0 }
    )
    scan()
    mutations = new MutationObserver(scheduleScan)
    mutations.observe(document.body, { childList: true, subtree: true })
  })

  watch(
    () => route.path,
    () => nextTick(() => setTimeout(scan, 50))
  )

  // The route watcher can fire before the next page has rendered; rescan once it has
  const stopHook = useNuxtApp().hook('page:finish', () => nextTick(scan))

  onBeforeUnmount(() => {
    stopHook()
    cancelAnimationFrame(pending)
    mutations?.disconnect()
    mutations = null
    observer?.disconnect()
    observer = null
  })
}

/**
 * True while a page's own filled call to action (marked `data-mk-primary`) is on screen, so the
 * header can step its "Start free" button down to an outline and keep one filled button in view.
 */
export function usePagePrimaryInView() {
  const inView = ref(false)

  // A couple of marked elements at most, so a rect check per scroll is cheap
  function check() {
    const height = window.innerHeight
    // Anything behind the sticky header is out of view
    const top = document.querySelector('.mk-header')?.getBoundingClientRect().bottom ?? 0
    inView.value = [...document.querySelectorAll('[data-mk-primary]')].some((el) => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.bottom > top && rect.top < height
    })
  }

  // Recheck once the next page has mounted; a route watcher fires before it renders
  const stopHook = useNuxtApp().hook('page:finish', () => nextTick(check))

  onMounted(() => {
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    check()
  })

  onBeforeUnmount(() => {
    stopHook()
    window.removeEventListener('scroll', check)
    window.removeEventListener('resize', check)
  })

  return inView
}
