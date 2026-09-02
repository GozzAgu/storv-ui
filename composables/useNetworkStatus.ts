import { computed } from 'vue'
import { useOfflineMode } from '~/composables/useOfflineMode'

/** Shared online/offline signal for dashboard banners and POS hints. */
export function useNetworkStatus() {
  const { isOnline, pendingCount, isSyncing } = useOfflineMode()

  const isOffline = computed(() => !isOnline.value)
  const hasPendingSync = computed(() => pendingCount.value > 0)

  return {
    isOnline,
    isOffline,
    pendingCount,
    hasPendingSync,
    isSyncing,
  }
}
