/** Structured server-side error logging (CI, Vercel logs, optional Sentry forwarding). */
export function logServerError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  const payload = {
    scope,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  }
  console.error(JSON.stringify(payload))
}
