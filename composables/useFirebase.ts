import { getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, type Analytics } from 'firebase/analytics'

/**
 * Composable to access Firebase app and services
 */
export const useFirebase = () => {
  // Get Firebase app instance
  const getApp = (): FirebaseApp | null => {
    if (import.meta.server) return null

    const apps = getApps()
    if (apps.length === 0) {
      // This should not happen if plugin is loaded, but just in case
      console.warn('Firebase app not initialized. Make sure firebase plugin is loaded.')
      return null
    }
    return apps[0] || null
  }

  // Get Analytics instance
  const getAnalyticsInstance = (): Analytics | null => {
    if (import.meta.server) return null

    try {
      const app = getApp()
      if (!app) return null

      return getAnalytics(app)
    } catch (error) {
      console.warn('Analytics not available:', error)
      return null
    }
  }

  return {
    app: getApp(),
    analytics: getAnalyticsInstance(),
    getApp,
    getAnalyticsInstance,
  }
}
