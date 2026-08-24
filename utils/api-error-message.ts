/** Human-readable message from $fetch / ofetch errors (H3 createError, Resend, etc.). */
export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  const err = error as {
    data?: { message?: string; statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  return (
    err?.data?.message ||
    err?.data?.statusMessage ||
    err?.statusMessage ||
    (error instanceof Error ? error.message : undefined) ||
    fallback
  )
}
