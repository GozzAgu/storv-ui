// Firebase configuration
// Uses environment variables from .env file via Nuxt runtime config
// This composable can be used in Nuxt context (plugins, components, etc.)

import { resolveFirebaseStorageBucket } from '~/utils/firebase-storage-bucket'

export const getFirebaseConfig = () => {
  const config = useRuntimeConfig()

  const projectId = config.public.firebase.projectId || ''
  const storageBucket = resolveFirebaseStorageBucket(
    projectId,
    config.public.firebase.storageBucket || ''
  )

  if (import.meta.dev && !(config.public.firebase.storageBucket || '').trim() && projectId) {
    console.warn(
      '[Firebase Config] NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET is unset; using:',
      storageBucket,
      'Copy the exact value from Firebase Console → Project settings if uploads fail (*.appspot.com on older projects).'
    )
  }

  const firebaseConfig = {
    apiKey: config.public.firebase.apiKey || '',
    authDomain: config.public.firebase.authDomain || '',
    projectId,
    storageBucket,
    messagingSenderId: config.public.firebase.messagingSenderId || '',
    appId: config.public.firebase.appId || '',
    measurementId: config.public.firebase.measurementId || '',
  }

  if (import.meta.dev) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('[Firebase Config] Missing required configuration. Please check your .env file.')
    }
  }

  return firebaseConfig
}
