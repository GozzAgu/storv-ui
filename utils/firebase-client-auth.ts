import { getApps, type FirebaseApp } from 'firebase/app'
import {
 browserLocalPersistence,
 getAuth,
 indexedDBLocalPersistence,
 initializeAuth,
 type Auth,
} from 'firebase/auth'

let primaryAuth: Auth | null = null

import { isCapacitorNative } from '~/utils/capacitor-env'

export { isCapacitorNative }

function initAuthForApp(app: FirebaseApp): Auth {
 // IndexedDB persistence can hang on Capacitor WKWebView — use localStorage only on native.
 const persistence = isCapacitorNative()
 ? browserLocalPersistence
 : [indexedDBLocalPersistence, browserLocalPersistence]

 try {
 return initializeAuth(app, { persistence })
 } catch (error: unknown) {
 const code = (error as { code?: string })?.code
 if (code === 'auth/already-initialized') {
 return getAuth(app)
 }
 console.warn('[Firebase Auth] initializeAuth failed, falling back to getAuth:', error)
 return getAuth(app)
 }
}

/**
 * Primary Firebase Auth for the default app. Uses `initializeAuth` with persistence
 * suited for Capacitor WKWebView (indexedDB + localStorage fallback).
 */
export function getFirebaseClientAuth(): Auth | null {
 if (import.meta.server) return null

 const apps = getApps()
 const app = apps[0]
 if (!app) return null

 if (!primaryAuth) {
 primaryAuth = initAuthForApp(app)
 }
 return primaryAuth
}

/** Secondary app auth (e.g. staff creation) — separate FirebaseApp instance. */
export function getFirebaseClientAuthForApp(app: FirebaseApp): Auth {
 try {
 return initializeAuth(app, {
 persistence: browserLocalPersistence,
 })
 } catch (error: unknown) {
 const code = (error as { code?: string })?.code
 if (code === 'auth/already-initialized') {
 return getAuth(app)
 }
 return getAuth(app)
 }
}
