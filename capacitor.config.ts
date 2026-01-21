import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.storv.app',
  appName: 'Storv',
  webDir: 'dist',
  server: {
    iosScheme: 'capacitor'
  }
}

export default config