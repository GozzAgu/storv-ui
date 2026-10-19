import { watch } from 'vue'
import { useSalesApi } from '~/composables/useSalesApi'
import { useAppToast } from '~/composables/useAppToast'
import { useAuthStore } from '~/stores/auth'

/**
 * Sends sales queued offline once the device is signed in and online, and whenever the
 * connection comes back. Tells the cashier what was recorded and what the server refused.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore()
  const { flushQueued } = nuxtApp.runWithContext(() => useSalesApi()) as ReturnType<
    typeof useSalesApi
  >
  const toast = useAppToast()

  async function flush() {
    if (!authStore.currentUser) return
    const result = await flushQueued().catch(() => null)
    if (!result) return
    if (result.recorded.length) {
      const n = result.recorded.length
      toast.success(
        `${n} sale${n === 1 ? '' : 's'} saved offline ${n === 1 ? 'was' : 'were'} recorded`
      )
    }
    for (const { sale, message } of result.failed) {
      toast.error(`Offline sale (${sale.summary}) could not be recorded: ${message}`, 12000)
    }
  }

  window.addEventListener('online', () => void flush())
  watch(
    () => authStore.currentUser?.uid,
    (uid) => {
      if (uid) void flush()
    },
    { immediate: true }
  )
})
