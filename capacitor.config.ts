import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.storv.app',
  appName: 'Storv',
  webDir: 'dist',
  server: {
    iosScheme: 'capacitor',
  },
  ios: {
    /** Respect notch / status bar — WebView content inset matches safe areas. */
    contentInset: 'always',
  },
}

export default config