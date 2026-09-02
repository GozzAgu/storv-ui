import { initOfflineSync } from '~/composables/useOfflineMode'

/** Starts offline queue listeners once for the SPA shell. */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return
  initOfflineSync()
})
