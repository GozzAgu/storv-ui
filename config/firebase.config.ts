// Firebase configuration
// Uses environment variables from .env file via Nuxt runtime config
// This composable can be used in Nuxt context (plugins, components, etc.)
export const getFirebaseConfig = () => {
  const config = useRuntimeConfig()
  
  return {
    apiKey: config.public.firebase.apiKey,
    authDomain: config.public.firebase.authDomain,
    projectId: config.public.firebase.projectId,
    storageBucket: config.public.firebase.storageBucket,
    messagingSenderId: config.public.firebase.messagingSenderId,
    appId: config.public.firebase.appId,
    measurementId: config.public.firebase.measurementId
  }
}

