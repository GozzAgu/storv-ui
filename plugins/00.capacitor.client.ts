import { Capacitor } from '@capacitor/core'
import { setCapacitorNativeAppState } from '~/composables/useCapacitorNativeApp'
import { isCapacitorNative, markCapacitorDocument } from '~/utils/capacitor-env'
import {
  isCapacitorMarketingRoot,
  redirectCapacitorRootToSignIn,
} from '~/utils/capacitor-root-path'
import { startNativeKeyboardHandling } from '~/composables/useNativeKeyboardInset'
import { stripNativeWebFontLinks, scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'

function detectNativeShell(): boolean {
  if (import.meta.server) return false
  try {
    if (Capacitor.isNativePlatform()) return true
  } catch {
    /* ignore */
  }
  if (isCapacitorNative()) return true
  return document.documentElement.classList.contains('capacitor-native')
}

/**
 * Capacitor shell: reveal document, force /signin (not marketing /), keep router guard.
 */
export default defineNuxtPlugin({
  name: 'capacitor-native',
  enforce: 'pre',
  setup(nuxtApp) {
    if (import.meta.server) return

    const native = detectNativeShell()
    setCapacitorNativeAppState(native)
    if (!native) return

    markCapacitorDocument()
    stripNativeWebFontLinks()
    void startNativeKeyboardHandling()

    let iosNativeStylesLoaded = false
    const loadIosNativeStyles = () => {
      if (iosNativeStylesLoaded) return
      iosNativeStylesLoaded = true
      void import('~/assets/css/ios-native.css')
    }

    if (redirectCapacitorRootToSignIn()) return

    const router = useRouter()

    router.beforeEach((to) => {
      if (isCapacitorMarketingRoot(to.path)) {
        return '/signin'
      }
    })

    router.afterEach((to) => {
      if (to.path.startsWith('/dashboard')) {
        loadIosNativeStyles()
      }
    })

    scheduleNativeIdleWork(() => {
      const path = router.currentRoute.value.path
      if (path.startsWith('/dashboard') || path === '/signin' || path === '/signup') {
        loadIosNativeStyles()
      }
    }, 900)

    nuxtApp.hook('page:finish', () => {
      if (isCapacitorMarketingRoot(router.currentRoute.value.path)) {
        void router.replace('/signin')
      }
    })

    markCapacitorDocument()
    setTimeout(markCapacitorDocument, 0)
  },
})
