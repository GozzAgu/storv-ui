export type PaystackCancelSubscriptionResponse = {
  success: boolean
  message?: string
  subscriptionStatus?: string
  subscription?: string
  subscriptionCurrentPeriodEnd?: string | null
}

export type CancelSubscriptionResult =
  | {
      ok: true
      subscriptionStatus: string
      subscription?: string
      subscriptionCurrentPeriodEnd?: string | null
    }
  | { ok: false; message: string }

/** Nuxt `$fetch` / `ofetch` compatible (intentionally loose so Nitro `$Fetch` passes) */
export type PaystackCancelFetcher = (
  url: string,
  opts?: unknown
) => Promise<PaystackCancelSubscriptionResponse>

/**
 * Cancel Paystack auto-renew for the signed-in account owner.
 * Paid features remain until subscriptionCurrentPeriodEnd when set.
 */
export async function cancelPaystackSubscription(
  params: { totpCode?: string },
  fetcher: PaystackCancelFetcher,
  apiBaseUrl?: string,
  authHeaders?: Record<string, string>
): Promise<CancelSubscriptionResult> {
  try {
    const base = (apiBaseUrl || '').replace(/\/$/, '')
    const url = base
      ? `${base}/api/paystack/cancel-subscription`
      : '/api/paystack/cancel-subscription'
    const res = await fetcher(url, {
      method: 'POST',
      headers: authHeaders,
      body: { totpCode: params.totpCode },
    })
    if (res.success) {
      return {
        ok: true,
        subscriptionStatus: res.subscriptionStatus || 'canceled',
        subscription: res.subscription,
        subscriptionCurrentPeriodEnd: res.subscriptionCurrentPeriodEnd,
      }
    }
    return { ok: false, message: res.message || 'Could not cancel subscription' }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    return {
      ok: false,
      message: e?.data?.message || e?.message || 'Failed to cancel subscription',
    }
  }
}
