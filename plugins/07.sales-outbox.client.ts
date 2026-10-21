import { watch } from 'vue'
import { onIdTokenChanged } from 'firebase/auth'
import { useSalesApi } from '~/composables/useSalesApi'
import { useAppToast } from '~/composables/useAppToast'
import { useAuthStore } from '~/stores/auth'
import { isDemoModeActive } from '~/utils/demo-mode'
import { markServerReached } from '~/utils/sales-outbox'

/**
 * Sends sales queued offline once the device is signed in and online, and whenever the
 * connection comes back. Tells the cashier what was recorded and what the server refused.
 *
 * Also notes when the server last issued this user a fresh sign-in token (it does so about
 * hourly while online, and refuses once the account is disabled or its sessions are revoked),
 * which limits how long a till can keep selling offline.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore()
  const { flushQueued } = nuxtApp.runWithContext(() => useSalesApi()) as ReturnType<
    typeof useSalesApi
  >
  const toast = useAppToast()

  async function flush() {
    // The demo records sales on the device only; there is no server to send them to.
    if (!authStore.currentUser || isDemoModeActive()) return
    const result = await flushQueued().catch(() => null)
    if (!result) return
    if (result.recorded.length) {
      const n = result.recorded.length
      toast.success(
        `${n} sale${n === 1 ? '' : 's'} saved offline ${n === 1 ? 'was' : 'were'} recorded`
      )
    }
    for (const { sale, message } of result.failed) {
      toast.error(
        `Offline sale (${sale.summary}) could not be recorded: ${message} It’s listed under Sales so it can be re-entered.`,
        12000
      )
    }
  }

  const auth = authStore.getAuthInstance()
  if (auth) {
    onIdTokenChanged(auth, (user) => {
      if (!user) return
      user
        .getIdTokenResult()
        .then((token) => markServerReached(user.uid, Date.parse(token.issuedAtTime)))
        .catch(() => {
          /* offline with an expired token: nothing new from the server */
        })
    })
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
