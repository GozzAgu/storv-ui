import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, type Analytics } from 'firebase/analytics'
import { getFirebaseConfig } from '~/config/firebase.config'
import { isCapacitorNative } from '~/utils/firebase-client-auth'

export default defineNuxtPlugin(() => {
  let app: FirebaseApp | undefined
  let analytics: Analytics | undefined

  // Only run on client side
  if (import.meta.client) {
    try {
      // Get Firebase config from environment variables
      const firebaseConfig = getFirebaseConfig()

      // Validate that required Firebase config values are present
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        const errorMessage =
          'Storvv cloud configuration is missing. Required environment variables are not set.'
        console.error('[Storvv cloud]', errorMessage)

        // Show user-friendly error in browser
        if (typeof window !== 'undefined') {
          // Create error overlay
          const errorOverlay = document.createElement('div')
          errorOverlay.id = 'firebase-config-error'
          errorOverlay.style.cssText = `
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 bottom: 0;
 background: rgba(0, 0, 0, 0.8);
 display: flex;
 align-items: center;
 justify-content: center;
 z-index: 9999;
 padding: 20px;
 `
          errorOverlay.innerHTML = `
 <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
 <h2 style="color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Configuration error</h2>
 <p style="color: #374151; font-size: 16px; margin-bottom: 20px; line-height: 1.6;">
 Storvv could not start because required cloud settings are missing. Please contact support if this persists.
 </p>
 <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
 Configure the required Storvv cloud settings in your deployment platform and rebuild the application. Contact support if you need help.
 </p>
 </div>
 `
          document.body.appendChild(errorOverlay)
        }

        return {
          provide: {
            firebaseApp: undefined,
            firebaseAnalytics: undefined,
          },
        }
      }

      // Initialize Firebase only if it hasn't been initialized
      if (!getApps().length) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApps()[0]
      }

      // Analytics can hang or fail in Capacitor WKWebView - skip on native shells
      if (typeof window !== 'undefined' && !isCapacitorNative()) {
        try {
          analytics = getAnalytics(app)
        } catch (error) {
          console.warn('Firebase Analytics initialization failed:', error)
        }
      }
    } catch (error: any) {
      console.error('[Storvv cloud] Initialization error:', error)

      // Show error overlay if Firebase fails to initialize
      if (typeof window !== 'undefined' && error?.code !== 'app/duplicate-app') {
        const errorOverlay = document.createElement('div')
        errorOverlay.id = 'firebase-init-error'
        errorOverlay.style.cssText = `
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 bottom: 0;
 background: rgba(0, 0, 0, 0.8);
 display: flex;
 align-items: center;
 justify-content: center;
 z-index: 9999;
 padding: 20px;
 `
        errorOverlay.innerHTML = `
 <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
 <h2 style="color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Unable to start Storvv</h2>
 <p style="color: #374151; font-size: 16px; margin-bottom: 20px; line-height: 1.6;">
 Storvv could not connect to cloud services. Please check your configuration and try again.
 </p>
 <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
 <p style="color: #6b7280; font-size: 14px; font-family: monospace; word-break: break-all;">
 ${error?.message || 'Unknown error'}
 </p>
 </div>
 <button onclick="location.reload()" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; font-weight: 600;">
 Reload Page
 </button>
 </div>
 `
        document.body.appendChild(errorOverlay)
      }
    }
  }

  return {
    provide: {
      firebaseApp: app,
      firebaseAnalytics: analytics,
    },
  }
})
