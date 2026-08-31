import { watch } from 'vue'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { withTimeout } from '~/utils/with-timeout'
import { isDemoModeActive } from '~/utils/demo-mode'
import { scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  if (isDemoModeActive()) {
    void (async () => {
      const { usePreferences } = await import('~/composables/usePreferences')
      usePreferences().initializeLocalOnly()
    })()
    return
  }

  void (async () => {
    const { usePreferences } = await import('~/composables/usePreferences')
    const { initialize, initializeLocalOnly } = usePreferences()
    const { useFirebaseAuth } = await import('~/composables/useFirebaseAuth')
    const { currentUser, loading: authLoading } = useFirebaseAuth()

    watch(
      [currentUser, authLoading],
      async ([user, loading]) => {
        if (loading) return
        if (user) {
          const runInitialize = () =>
            withTimeout(initialize(), isCapacitorNative() ? 8000 : 4000, 'preferences after auth')

          if (isCapacitorNative()) {
            scheduleNativeIdleWork(() => {
              void runInitialize()
            }, 1500)
          } else {
            await runInitialize()
          }
        } else {
          initializeLocalOnly()
        }
      },
      { immediate: true }
    )
  })()
})
