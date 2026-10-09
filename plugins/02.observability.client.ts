import * as Sentry from '@sentry/vue'
import { registerSentryCapture } from '~/utils/observability'
import { scrubPayPath } from '~/utils/pay-path'

function scrubCrumb(crumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  if (crumb.message) crumb.message = scrubPayPath(crumb.message)
  for (const key of ['url', 'from', 'to']) {
    if (typeof crumb.data?.[key] === 'string') crumb.data[key] = scrubPayPath(crumb.data[key])
  }
  return crumb
}

/** Payment-link tokens are bearer secrets; they must not reach Sentry in URLs or breadcrumbs. */
function scrubEvent<T extends Sentry.Event>(event: T): T {
  if (event.request?.url) event.request.url = scrubPayPath(event.request.url)
  if (event.request?.headers?.Referer) {
    event.request.headers.Referer = scrubPayPath(event.request.headers.Referer)
  }
  if (event.transaction) event.transaction = scrubPayPath(event.transaction)
  event.breadcrumbs?.forEach(scrubCrumb)
  return event
}

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
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeBreadcrumb: scrubCrumb,
  })

  registerSentryCapture((error, context) => {
    Sentry.captureException(error, context ? { extra: context } : undefined)
  })

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    Sentry.captureException(error, { extra: { vueInfo: info } })
  })
})
