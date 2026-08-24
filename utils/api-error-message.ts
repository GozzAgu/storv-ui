import { isCapacitorNative } from '~/utils/capacitor-env'
import { isApiBaseConfigured } from '~/utils/capacitor-api-base'

function isNetworkFetchFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed')
  )
}

/** Human-readable message from $fetch / ofetch errors (H3 createError, Resend, etc.). */
export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  const err = error as {
    data?: { message?: string; statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  const message =
    err?.data?.message ||
    err?.data?.statusMessage ||
    err?.statusMessage ||
    (error instanceof Error ? error.message : undefined) ||
    fallback

  if (isNetworkFetchFailure(error) && isCapacitorNative()) {
    if (!isApiBaseConfigured()) {
      return `${message}. Set NUXT_PUBLIC_API_BASE=https://app.storvv.com in .env and rebuild the mobile app (npm run cap:build).`
    }
    return `${message}. Check your connection and that app.storvv.com is deployed with the latest server code.`
  }

  return message
}
