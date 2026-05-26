import { watch } from 'vue'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { withTimeout } from '~/utils/with-timeout'
import { isDemoModeActive } from '~/utils/demo-mode'

export default defineNuxtPlugin(() => {
 if (import.meta.server) return

 if (isDemoModeActive()) {
 void (async () => {
 const { usePreferences } = await import('~/composables/usePreferences')
 usePreferences().initializeLocalOnly()
 })()
 return
 }

 const runInitialize = async (label: string) => {
 const { usePreferences } = await import('~/composables/usePreferences')
 const { initialize, initializeLocalOnly } = usePreferences()
 if (isCapacitorNative()) {
 initializeLocalOnly()
 return
 }
 await withTimeout(initialize(), 4000, label)
 }

 void runInitialize('preferences initialize')

 void (async () => {
 const { usePreferences } = await import('~/composables/usePreferences')
 const { initialize } = usePreferences()
 const { useFirebaseAuth } = await import('~/composables/useFirebaseAuth')
 const { currentUser, loading: authLoading } = useFirebaseAuth()

 watch(
 [currentUser, authLoading],
 async ([user, loading]) => {
 if (!loading && user) {
 if (isCapacitorNative()) {
 await withTimeout(initialize(), 8000, 'preferences after auth (native)')
 } else {
 await withTimeout(initialize(), 4000, 'preferences after auth')
 }
 }
 },
 { immediate: false }
 )
 })()
})
