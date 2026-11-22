import { getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, type Analytics } from 'firebase/analytics'
import { firebaseEmulatorsEnabled } from '~/utils/firebase-emulators'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { isPublicPayPath } from '~/utils/pay-path'

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

  /**
   * Analytics, only where the Firebase plugin turns it on: never in the iOS/Android shell (loading
   * gtag.js there crashes the WKWebView's web process), the emulator or public pay links.
   */
  const getAnalyticsInstance = (): Analytics | null => {
    if (import.meta.server) return null
    if (isCapacitorNative() || isPublicPayPath(window.location.pathname)) return null

    try {
      const app = getApp()
      if (!app || firebaseEmulatorsEnabled()) return null

      return getAnalytics(app)
    } catch (error) {
      console.warn('Analytics not available:', error)
      return null
    }
  }

  return {
    app: getApp(),
    /** Created on first read, not on every useFirebase() call: most callers only need the app. */
    get analytics() {
      return getAnalyticsInstance()
    },
    getApp,
    getAnalyticsInstance,
  }
}
