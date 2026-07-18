import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.storv.app',
  appName: 'Storvv',
  webDir: 'dist',
  server: {
    iosScheme: 'capacitor',
  },
  ios: {
    /**
     * Edge-to-edge WebView; safe areas via CSS env(safe-area-inset-*).
     * "automatic" shrinks the WebView and shows black letterboxing above/below the app.
     */
    contentInset: 'never',
    backgroundColor: '#f3f4f6',
  },
}

export default config
