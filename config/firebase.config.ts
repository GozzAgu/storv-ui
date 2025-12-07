// Firebase configuration
// Uses environment variables from .env file via Nuxt runtime config
// This composable can be used in Nuxt context (plugins, components, etc.)
export const getFirebaseConfig = () => {
  const config = useRuntimeConfig()
  
  const firebaseConfig = {
    apiKey: config.public.firebase.apiKey || '',
    authDomain: config.public.firebase.authDomain || '',
    projectId: config.public.firebase.projectId || '',
    storageBucket: config.public.firebase.storageBucket || '',
    messagingSenderId: config.public.firebase.messagingSenderId || '',
    appId: config.public.firebase.appId || '',
    measurementId: config.public.firebase.measurementId || ''
  }
  
  // Log warning if critical config is missing (only in development)
  if (import.meta.dev) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('[Firebase Config] Missing required configuration. Please check your .env file.')
    }
  }
  
  return firebaseConfig
}

