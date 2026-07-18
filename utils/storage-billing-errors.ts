/**
 * Detect Google Cloud Storage / Firebase billing blocks (not fixable in app code).
 */
export function isBillingDelinquentMessage(text: string): boolean {
  const t = text.toLowerCase()
  return (
    t.includes('delinquent') ||
    (t.includes('billing account') && t.includes('disabled')) ||
    t.includes('accountdisabled') ||
    (t.includes('billing') && t.includes('disabled') && t.includes('project'))
  )
}

/** Pull a string message from $fetch/ofetch errors or raw GCS JSON blobs */
export function extractUploadFailureMessage(apiErr: unknown): string {
  if (apiErr && typeof apiErr === 'object') {
    const d = (apiErr as { data?: unknown }).data
    if (typeof d === 'string') {
      try {
        const parsed = JSON.parse(d) as { error?: { message?: string } }
        const m = parsed?.error?.message
        if (typeof m === 'string') return m
      } catch {
        return d
      }
    }
    if (d && typeof d === 'object') {
      const o = d as Record<string, unknown>
      if (typeof o.message === 'string') return o.message
      const nested = o.error
      if (nested && typeof nested === 'object') {
        const em = (nested as { message?: string }).message
        if (typeof em === 'string') return em
        const errs = (nested as { errors?: { message?: string }[] }).errors
        if (Array.isArray(errs) && typeof errs[0]?.message === 'string') return errs[0].message
      }
    }
    const msg = (apiErr as { message?: string }).message
    if (typeof msg === 'string') return msg
  }
  if (apiErr instanceof Error) return apiErr.message
  return 'Upload failed'
}

export const BILLING_BLOCKED_USER_MESSAGE =
  'Your Firebase / Google Cloud project cannot use Storage right now because billing is disabled or overdue (delinquent). This is not an app bug. Open https://console.cloud.google.com/billing, then select your billing account, update the payment method or pay any outstanding balance, then wait a few minutes and try the upload again. Until billing is active, uploads will keep failing.'
