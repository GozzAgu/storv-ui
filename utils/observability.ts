type ObservabilityContext = Record<string, unknown>

let sentryCapture: ((error: unknown, context?: ObservabilityContext) => void) | null = null

/** Called from the Sentry client plugin when a DSN is configured. */
export function registerSentryCapture(
  capture: (error: unknown, context?: ObservabilityContext) => void
) {
  sentryCapture = capture
}

export function captureException(error: unknown, context?: ObservabilityContext) {
  if (import.meta.dev) {
    console.error('[observability]', error, context ?? '')
  }
  try {
    sentryCapture?.(error, context)
  } catch {
    // Never throw from observability
  }
}

export function captureMessage(message: string, context?: ObservabilityContext) {
  if (import.meta.dev) {
    console.warn('[observability]', message, context ?? '')
  }
  try {
    sentryCapture?.(new Error(message), context)
  } catch {
    // Never throw from observability
  }
}
