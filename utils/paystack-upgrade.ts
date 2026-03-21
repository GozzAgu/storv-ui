import type { SubscriptionPlan } from '~/types/subscription'

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
 */
export async function initializePaystackSubscription(
  params: { planId: SubscriptionPlan; email: string; userId: string },
  fetcher: PaystackInitializeFetcher
): Promise<InitializeSubscriptionResult> {
  try {
    const res = await fetcher('/api/paystack/initialize', {
      method: 'POST',
      body: {
        planId: params.planId,
        email: params.email,
        userId: params.userId,
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
