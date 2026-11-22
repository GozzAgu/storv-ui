import {
  clearDemoSession,
  isDemoRoutePath,
  markDemoSessionActive,
  toDemoDashboardPath,
} from '~/utils/demo-mode'
import { initDemoAuth, syncDemoToPinia } from '~/utils/demo-bridge'
import { DEMO_CLOSED_REDIRECT, canOpenDemo } from '~/utils/demo-access'

/**
 * Demo routes share the same theme system as the signed-in dashboard.
 * Only toggle a document hook for optional demo-specific CSS. never force dark/light here,
 * or navigation fights `useThemeStore().applyTheme()` and the theme flips between pages.
 */
function applyDemoDocumentTheme(active: boolean) {
  if (!import.meta.client) return
  const html = document.documentElement
  const wasActive = html.classList.contains('demo-dashboard')
  html.classList.toggle('demo-dashboard', active)

  if (wasActive === active) return

  if (!active) {
    const themeStore = useThemeStore()
    if (themeStore.initialized) {
      themeStore.applyTheme()
    } else {
      html.classList.remove('dark')
      html.style.colorScheme = ''
    }
  }
}

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const demoAccessKey = String(useRuntimeConfig().public.demoAccessKey || '')

  if (import.meta.client) {
    applyDemoDocumentTheme(isDemoRoutePath(window.location.pathname))
  }

  router.beforeEach(async (to) => {
    if (isDemoRoutePath(to.path)) {
      // Closed to the public: send them to book a walkthrough instead.
      if (!canOpenDemo(to.query, demoAccessKey, import.meta.dev)) {
        clearDemoSession()
        applyDemoDocumentTheme(false)
        return { ...DEMO_CLOSED_REDIRECT, replace: true }
      }
      applyDemoDocumentTheme(true)
      markDemoSessionActive()
      initDemoAuth()
      await syncDemoToPinia()
      return
    }

    applyDemoDocumentTheme(false)

    if (to.path.startsWith('/dashboard') && !to.path.startsWith('/demo/dashboard')) {
      try {
        if (sessionStorage.getItem('storvv-demo-session') === '1') {
          return {
            path: toDemoDashboardPath(to.path),
            query: to.query,
            hash: to.hash,
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (!isDemoRoutePath(to.path) && !to.path.startsWith('/demo/dashboard')) {
      const fromDemo = router.options.history.state?.back
      if (typeof fromDemo === 'string' && isDemoRoutePath(fromDemo)) {
        clearDemoSession()
      }
    }
  })
})
