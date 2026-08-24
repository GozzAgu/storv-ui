import { onMounted, watch } from 'vue'
import { isDemoModeActive } from '~/utils/demo-mode'

const DEMO_NUDGE_SHOWN_KEY = 'storvv-demo-signup-nudge-shown'
const DEMO_PAGES_KEY = 'storvv-demo-pages-visited'
const MIN_PAGES_FOR_NUDGE = 3

/**
 * Shows a one-time signup prompt while exploring the interactive demo.
 */
export function useDemoConversionNudge() {
  const route = useRoute()
  const toast = useAppToast()
  const { isDemoDashboard } = useDashboardPaths()

  function hasShownNudge() {
    if (!import.meta.client) return true
    return sessionStorage.getItem(DEMO_NUDGE_SHOWN_KEY) === '1'
  }

  function markNudgeShown() {
    if (!import.meta.client) return
    sessionStorage.setItem(DEMO_NUDGE_SHOWN_KEY, '1')
  }

  function trackPageVisit(path: string) {
    if (!import.meta.client || !path.startsWith('/demo')) return
    const raw = sessionStorage.getItem(DEMO_PAGES_KEY)
    const pages = raw ? (JSON.parse(raw) as string[]) : []
    if (!pages.includes(path)) {
      pages.push(path)
      sessionStorage.setItem(DEMO_PAGES_KEY, JSON.stringify(pages))
    }
    maybeShowNudge(pages.length)
  }

  function maybeShowNudge(pageCount?: number) {
    if (!import.meta.client) return
    if (!isDemoModeActive() && !isDemoDashboard.value) return
    if (hasShownNudge()) return

    const count =
      pageCount ??
      (() => {
        const raw = sessionStorage.getItem(DEMO_PAGES_KEY)
        return raw ? (JSON.parse(raw) as string[]).length : 0
      })()

    if (count < MIN_PAGES_FOR_NUDGE) return

    markNudgeShown()
    toast.info('Enjoying the demo? Create a free account to save your own store data.', {
      duration: 8000,
      action: {
        label: 'Sign up',
        onClick: () => navigateTo('/signup'),
      },
    })
  }

  onMounted(() => {
    if (isDemoModeActive() || isDemoDashboard.value) {
      trackPageVisit(route.path)
    }
  })

  watch(
    () => route.path,
    (path) => {
      if (isDemoModeActive() || isDemoDashboard.value) {
        trackPageVisit(path)
      }
    }
  )

  return { maybeShowNudge }
}
