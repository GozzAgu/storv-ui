import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'

export type PaystackInitializeResponse = {
  success: boolean
  authorization_url?: string
  message?: string
}

export type InitializeSubscriptionResult =
  | { ok: true; authorizationUrl: string }
  | { ok: false; message: string }

/** Nuxt `$fetch` / `ofetch` compatible (intentionally loose so Nitro `$Fetch` passes) */
export type PaystackInitializeFetcher = (
  url: string,
  opts?: unknown
) => Promise<PaystackInitializeResponse>

/**
 * Start Paystack subscription upgrade (client). Pass `$fetch` from Nuxt or a mock in tests.
 * When `NUXT_PUBLIC_API_BASE` is set (separate API origin), the request goes to `{apiBase}/api/paystack/initialize`.
 */
export async function initializePaystackSubscription(
  params: {
    planId: SubscriptionPlan
    email: string
    userId: string
    billingCycle?: SubscriptionBillingCycle
  },
  fetcher: PaystackInitializeFetcher,
  apiBaseUrl?: string,
  authHeaders?: Record<string, string>
): Promise<InitializeSubscriptionResult> {
  try {
    const base = (apiBaseUrl || '').replace(/\/$/, '')
    const url = base ? `${base}/api/paystack/initialize` : '/api/paystack/initialize'
    const res = await fetcher(url, {
      method: 'POST',
      headers: authHeaders,
      body: {
        planId: params.planId,
        email: params.email,
        userId: params.userId,
        billingCycle: params.billingCycle || 'monthly',
      },
    })
    if (res.success && res.authorization_url) {
      return { ok: true, authorizationUrl: res.authorization_url }
    }
    return { ok: false, message: res.message || 'Could not start payment' }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    return {
      ok: false,
      message: e?.data?.message || e?.message || 'Failed to start payment',
    }
  }
}
