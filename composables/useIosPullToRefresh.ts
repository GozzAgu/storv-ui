/**
 * iOS pull-to-refresh uses the shared dashboard page refresh registry
 * so the header refresh button and PTR stay in sync.
 */
import {
  useDashboardPageRefreshHandler,
  useDashboardPageRefreshRegister,
} from '~/composables/useDashboardPageRefresh'

/** Pages register their refresh logic (home, sales, analytics, etc.). */
export function useIosPullToRefreshRegister(handler: () => Promise<void>) {
  return useDashboardPageRefreshRegister(handler)
}

export function useIosPullToRefreshHandler() {
  return useDashboardPageRefreshHandler()
}
