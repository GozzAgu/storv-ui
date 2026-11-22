import { watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { withTimeout } from '~/utils/with-timeout'
import { isDemoModeActive } from '~/utils/demo-mode'
import { scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  // The demo shop shows its own settings (naira, Lagos time) on every demo page, in memory only;
  // leaving the demo puts the visitor's own saved preferences back.
  const router = useRouter()
  const userStore = useUserStore()
  let demoApplied = false
  watch(
    [() => router.currentRoute.value.path, () => userStore.userData?.preferences],
    async () => {
      const { usePreferences } = await import('~/composables/usePreferences')
      if (isDemoModeActive()) {
        usePreferences().applyDemoPreferences()
        demoApplied = true
      } else if (demoApplied) {
        usePreferences().initializeLocalOnly()
        demoApplied = false
      }
    },
    { immediate: true }
  )

  if (isDemoModeActive()) {
    void (async () => {
      const { usePreferences } = await import('~/composables/usePreferences')
      usePreferences().initializeLocalOnly()
      usePreferences().applyDemoPreferences()
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
