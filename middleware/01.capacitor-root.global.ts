import { isCapacitorNative } from '~/utils/capacitor-env'
import { isCapacitorMarketingRoot } from '~/utils/capacitor-root-path'

/** Native app must not mount the marketing homepage at `/`. */
export default defineNuxtRouteMiddleware((to) => {
 if (import.meta.server || !isCapacitorNative()) return
 if (isCapacitorMarketingRoot(to.path)) {
 return navigateTo('/signin', { replace: true })
 }
})
