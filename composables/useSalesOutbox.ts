import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  dismissFailedSale,
  listFailedSales,
  listQueuedSales,
  outboxVersion,
  requeueFailedSale,
  type FailedSale,
  type QueuedSale,
} from '~/utils/sales-outbox'

/** This user's offline sales on this device, kept up to date as they sync or fail. */
export function useSalesOutbox() {
  const authStore = useAuthStore()
  const uid = computed(() => authStore.currentUser?.uid ?? null)

  const queued = computed<QueuedSale[]>(() => {
    void outboxVersion.value
    return uid.value ? listQueuedSales(uid.value) : []
  })
  const failed = computed<FailedSale[]>(() => {
    void outboxVersion.value
    return uid.value ? listFailedSales(uid.value) : []
  })

  return {
    queued,
    failed,
    queuedCount: computed(() => queued.value.length),
    failedCount: computed(() => failed.value.length),
    /** Put a refused sale back in the queue; the caller then flushes. */
    retry(saleId: string) {
      if (uid.value) requeueFailedSale(uid.value, saleId)
    },
    dismiss(saleId: string) {
      if (uid.value) dismissFailedSale(uid.value, saleId)
    },
  }
}
