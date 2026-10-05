import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useThemeStore } from '~/stores/theme'

/** Where "Sign in" and "Start free" send people. */
export function useMarketingAppUrl() {
  const runtimeConfig = useRuntimeConfig()
  return computed(() => {
    const origin = runtimeConfig.public.appOrigin
    return typeof origin === 'string' && origin.length > 0 ? origin : 'https://app.storvv.com'
  })
}

/** Wordmark that contrasts the current theme. */
export function useMarketingLogo() {
  const themeStore = useThemeStore()
  return computed(() =>
    themeStore.actualTheme === 'dark' ? '/brand/storvv-logo-reversed.png' : '/brand/storvv-logo.png'
  )
}

/**
 * Fades `.mk-reveal` blocks in as they scroll into view. Rescans after every route change
 * because the marketing layout stays mounted across pages.
 */
export function useMarketingReveal() {
  const route = useRoute()
  let observer: IntersectionObserver | null = null

  function scan() {
    if (!observer) return
    document
      .querySelectorAll('.mk-reveal:not([data-revealed])')
      .forEach((el) => observer?.observe(el))
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
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    )
    scan()
  })

  watch(
    () => route.path,
    () => nextTick(() => setTimeout(scan, 50))
  )

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}
