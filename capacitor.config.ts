import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.storv.app',
  appName: 'Storv',
  webDir: 'dist',
  server: {
    iosScheme: 'capacitor',
  },
  ios: {
    /** Let CSS env(safe-area-inset-*) handle insets — avoids double gap with our fixed top bar. */
    contentInset: 'automatic',
  },
}

export default config