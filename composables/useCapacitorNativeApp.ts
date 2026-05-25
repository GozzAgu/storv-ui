import { Capacitor } from '@capacitor/core'
import { isCapacitorNative, markCapacitorDocument } from '~/utils/capacitor-env'

const STATE_KEY = 'capacitor-native-app'

function detectCapacitorNativeApp(): boolean {
 if (import.meta.server || typeof window === 'undefined') return false

 try {
 if (Capacitor.isNativePlatform()) return true
 } catch {
 /* ignore */
 }

 if (isCapacitorNative()) return true

 return document.documentElement.classList.contains('capacitor-native')
}

/** Shared flag: true when running in the Capacitor iOS/Android shell. */
export function useCapacitorNativeApp() {
 const isNativeApp = useState(STATE_KEY, () => detectCapacitorNativeApp())

 function refreshNativeAppFlag() {
 if (import.meta.server) return
 const native = detectCapacitorNativeApp()
 if (native) {
 isNativeApp.value = true
 markCapacitorDocument()
 }
 }

 if (import.meta.client) {
 refreshNativeAppFlag()
 onMounted(() => {
 refreshNativeAppFlag()
 setTimeout(refreshNativeAppFlag, 0)
 setTimeout(refreshNativeAppFlag, 100)
 })
 }

 return { isNativeApp }
}

export function setCapacitorNativeAppState(native: boolean) {
 if (import.meta.server) return
 useState(STATE_KEY, () => native).value = native
 if (native) markCapacitorDocument()
}
