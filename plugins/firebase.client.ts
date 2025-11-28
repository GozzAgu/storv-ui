import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, type Analytics } from 'firebase/analytics'
import { firebaseConfig } from '~/config/firebase.config'

export default defineNuxtPlugin(() => {
  let app: FirebaseApp | undefined
  let analytics: Analytics | undefined

  // Only run on client side
  if (import.meta.client) {
    // Initialize Firebase only if it hasn't been initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app)
      } catch (error) {
        // Analytics might fail in development or if not enabled
        console.warn('Firebase Analytics initialization failed:', error)
      }
    }
  }

  return {
    provide: {
      firebaseApp: app,
      firebaseAnalytics: analytics
    }
  }
})

