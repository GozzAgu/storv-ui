import { isCapacitorNative } from '~/utils/capacitor-env'
import { isApiBaseConfigured } from '~/utils/capacitor-api-base'

function isNetworkFetchFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed') ||
    msg.includes('<no response>')
  )
}

function stripOfetchPrefix(message: string): string {
  return message
    .replace(/^\[[A-Z]+\]\s+"[^"]+"\s*:\s*/i, '')
    .replace(/^<no response>\s*/i, '')
    .trim()
}

/** Human-readable message from $fetch / ofetch errors (H3 createError, Resend, etc.). */
export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  const err = error as {
    data?: { message?: string; statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  const raw =
    err?.data?.message ||
    err?.data?.statusMessage ||
    err?.statusMessage ||
    (error instanceof Error ? error.message : undefined) ||
    fallback

  const message = stripOfetchPrefix(String(raw)) || fallback

  if (isNetworkFetchFailure(error) || /failed to fetch/i.test(message)) {
    if (isCapacitorNative()) {
      if (!isApiBaseConfigured()) {
        return `${message}. Set NUXT_PUBLIC_API_BASE=https://app.storvv.com in .env and rebuild the mobile app (npm run cap:build).`
      }
      return `${message}. Check your connection and that app.storvv.com is deployed with the latest server code.`
    }
    return 'Could not reach the email service. Confirm the app server is running and try again, or copy the password below.'
  }

  return message
}
