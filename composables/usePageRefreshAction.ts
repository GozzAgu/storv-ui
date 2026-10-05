import { ref } from 'vue'
import {
  runDefaultDashboardRefresh,
  useDashboardPageRefreshHandler,
} from '~/composables/useDashboardPageRefresh'
import { useAppToast } from '~/composables/useAppToast'

/** Runs the current page's registered refresh handler, or the default dashboard refresh. */
export function usePageRefreshAction() {
  const handler = useDashboardPageRefreshHandler()
  const toast = useAppToast()
  const busy = ref(false)

  async function refresh() {
    if (busy.value) return
    busy.value = true
    try {
      if (handler.value) await handler.value()
      else await runDefaultDashboardRefresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh')
    } finally {
      busy.value = false
    }
  }

  return { busy, refresh }
}
