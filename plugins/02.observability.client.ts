import * as Sentry from '@sentry/vue'
import { registerSentryCapture } from '~/utils/observability'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn as string | undefined

  if (!dsn) return

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    environment: import.meta.dev ? 'development' : 'production',
    tracesSampleRate: import.meta.dev ? 1.0 : 0.1,
    enabled: !import.meta.dev || process.env.NUXT_PUBLIC_SENTRY_DEV === '1',
  })

  registerSentryCapture((error, context) => {
    Sentry.captureException(error, context ? { extra: context } : undefined)
  })

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    Sentry.captureException(error, { extra: { vueInfo: info } })
  })
})
