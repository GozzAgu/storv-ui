import {
  clearDemoSession,
  isDemoRoutePath,
  markDemoSessionActive,
  toDemoDashboardPath,
} from '~/utils/demo-mode'
import { initDemoAuth, syncDemoToPinia } from '~/utils/demo-bridge'

function applyDemoDocumentTheme(active: boolean) {
  if (!import.meta.client) return
  const html = document.documentElement
  html.classList.toggle('demo-dashboard', active)

  if (active) {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', '#050508')
    return
  }

  const themeStore = useThemeStore()
  if (themeStore.initialized) {
    themeStore.applyTheme()
  } else {
    html.classList.remove('dark')
    html.style.colorScheme = 'light'
  }
}

export default defineNuxtPlugin(() => {
  const router = useRouter()

  if (import.meta.client) {
    applyDemoDocumentTheme(isDemoRoutePath(window.location.pathname))
  }

  router.beforeEach(async (to) => {
    if (isDemoRoutePath(to.path)) {
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
