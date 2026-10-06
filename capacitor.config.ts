import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.storvv.app',
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
    /** Light canvas; AppBridgeViewController switches it for dark mode. */
    backgroundColor: '#f5f7ff',
  },
  plugins: {
    Keyboard: {
      /** Keyboard overlays the WebView; drawer padding follows keyboard height in CSS. */
      resize: 'none',
    },
  },
}

export default config
