import { watch } from 'vue'

export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) return

  const { usePreferences } = await import('~/composables/usePreferences')
  const { initialize } = usePreferences()

  // Initialize preferences immediately (loads from localStorage first)
  // This ensures preferences are available right away
  await initialize()

  // Also set up a watcher to reload from Firestore when auth becomes available
  const { useFirebaseAuth } = await import('~/composables/useFirebaseAuth')
  const { currentUser, loading: authLoading } = useFirebaseAuth()
  
  // Watch for auth state changes and reload preferences from Firestore when user logs in
  watch([currentUser, authLoading], async ([user, loading]) => {
    if (!loading && user) {
      // User is authenticated, reload preferences from Firestore
      await initialize()
    }
  }, { immediate: true })
})
