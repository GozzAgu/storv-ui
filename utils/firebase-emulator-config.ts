/** Firebase never routes `demo-*` project ids to real cloud resources, so emulator mode cannot reach production. */
export const FIREBASE_EMULATOR_PROJECT_ID = 'demo-storvv'

export const FIREBASE_EMULATOR_HOST = '127.0.0.1'

/** Must match `emulators` in firebase.json. */
export const FIREBASE_EMULATOR_PORTS = { auth: 9099, firestore: 8080, storage: 9199 } as const

/** `public.firebaseEmulators`; Nuxt may hand runtime env overrides back as 1 or 'true'. */
export function isFirebaseEmulatorMode(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

/**
 * Web config for emulator mode. Replaces every `NUXT_PUBLIC_FIREBASE_*` value, so production
 * identifiers in `.env` never reach the browser while emulating.
 */
export const FIREBASE_EMULATOR_WEB_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: `${FIREBASE_EMULATOR_PROJECT_ID}.firebaseapp.com`,
  projectId: FIREBASE_EMULATOR_PROJECT_ID,
  storageBucket: `${FIREBASE_EMULATOR_PROJECT_ID}.appspot.com`,
  messagingSenderId: '',
  appId: '',
  measurementId: '',
}
