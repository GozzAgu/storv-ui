import {
  clearDemoSession,
  isDemoRoutePath,
  markDemoSessionActive,
  toDemoDashboardPath,
} from '~/utils/demo-mode'
import { initDemoAuth, syncDemoToPinia } from '~/utils/demo-bridge'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.beforeEach(async (to) => {
    if (isDemoRoutePath(to.path)) {
      markDemoSessionActive()
      initDemoAuth()
      await syncDemoToPinia()
      return
    }

    if (to.path.startsWith('/dashboard') && !to.path.startsWith('/demo/dashboard')) {
      try {
        if (sessionStorage.getItem('storvv-demo-session') === '1') {
          return {
            path: toDemoDashboardPath(to.path),
            query: to.query,
            hash: to.hash,
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (!isDemoRoutePath(to.path) && !to.path.startsWith('/demo/dashboard')) {
      const fromDemo = router.options.history.state?.back
      if (typeof fromDemo === 'string' && isDemoRoutePath(fromDemo)) {
        clearDemoSession()
      }
    }
  })
})
