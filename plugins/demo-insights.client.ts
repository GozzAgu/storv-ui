import { trackDemoPage } from '~/utils/demo-tracker'

/** Anonymous demo page timing (see utils/demo-tracker). Does nothing outside /demo. */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  router.afterEach((to) => trackDemoPage(to.path))
  trackDemoPage(router.currentRoute.value.path)
})
