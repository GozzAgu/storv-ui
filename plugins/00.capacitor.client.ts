import { isCapacitorNative, markCapacitorDocument } from '~/utils/capacitor-env'
import { isCapacitorMarketingRoot, redirectCapacitorRootToSignIn } from '~/utils/capacitor-root-path'

/**
 * Capacitor shell: reveal document, force /signin (not marketing /), keep router guard.
 */
export default defineNuxtPlugin({
  name: 'capacitor-native',
  enforce: 'pre',
  setup(nuxtApp) {
    if (import.meta.server || !isCapacitorNative()) return

    markCapacitorDocument()

    if (redirectCapacitorRootToSignIn()) return

    const router = useRouter()

    router.beforeEach((to) => {
      if (isCapacitorMarketingRoot(to.path)) {
        return '/signin'
      }
    })

    nuxtApp.hook('page:finish', () => {
      if (isCapacitorMarketingRoot(router.currentRoute.value.path)) {
        void router.replace('/signin')
      }
    })

    markCapacitorDocument()
    setTimeout(markCapacitorDocument, 0)
  },
})
