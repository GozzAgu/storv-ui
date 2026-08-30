declare module '#app' {
  interface NuxtApp {
    $trackEvent?: (name: string, params?: Record<string, unknown>) => void
    $firebaseAnalytics?: import('firebase/analytics').Analytics
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $trackEvent?: (name: string, params?: Record<string, unknown>) => void
  }
}

export {}
