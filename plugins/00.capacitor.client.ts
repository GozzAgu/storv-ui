import { isCapacitorNative, markCapacitorDocument } from '~/utils/capacitor-env'

/**
 * Capacitor shell: mark document, open sign-in (not marketing), keep page visible.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server || !isCapacitorNative()) return

  markCapacitorDocument()

  const router = useRouter()

  const goSignIn = () => {
    const path = router.currentRoute.value.path
    if (path === '/' || path === '/index.html') {
      void router.replace('/signin')
    }
  }

  goSignIn()

  router.beforeEach((to) => {
    if (to.path === '/' || to.path === '/index.html') {
      return '/signin'
    }
  })

  nuxtApp.hook('page:finish', goSignIn)

  if (typeof document !== 'undefined') {
    const reveal = () => {
      document.documentElement.classList.add('styles-loaded')
      document.documentElement.style.removeProperty('display')
      document.body?.style.removeProperty('display')
    }
    reveal()
    setTimeout(reveal, 50)
  }
})
