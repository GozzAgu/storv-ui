import { createError } from 'h3'

export type PaymentsV2GateReason =
  | 'flag_off'
  | 'live_key_without_allow'
  | 'live_decisions_not_approved'

export type PaymentsV2Gate =
  | { enabled: true; live: boolean }
  | { enabled: false; live: boolean; reason: PaymentsV2GateReason }

/** The decisions doc counts as approved only with an exact `Status: approved` line. */
export function isPaystackDecisionsApproved(markdown: string | null | undefined): boolean {
  return typeof markdown === 'string' && /^status:\s*approved\s*$/im.test(markdown)
}

/**
 * Payments V2 runs only with PAYMENTS_V2_ENABLED=1. With a live Paystack key it also needs
 * PAYMENTS_V2_ALLOW_LIVE=1 and docs/payments/paystack-decisions.md marked approved.
 */
export function evaluatePaymentsV2Gate(
  env: NodeJS.ProcessEnv,
  decisionsMarkdown: string | null
): PaymentsV2Gate {
  const live = String(env.PAYSTACK_SECRET_KEY || '')
    .trim()
    .startsWith('sk_live_')
  if (env.PAYMENTS_V2_ENABLED !== '1') return { enabled: false, live, reason: 'flag_off' }
  if (live && env.PAYMENTS_V2_ALLOW_LIVE !== '1') {
    return { enabled: false, live, reason: 'live_key_without_allow' }
  }
  if (live && !isPaystackDecisionsApproved(decisionsMarkdown)) {
    return { enabled: false, live, reason: 'live_decisions_not_approved' }
  }
  return { enabled: true, live }
}

/**
 * Plans that may use payment links. Config, not code: PAYMENTS_V2_LINK_PLANS=all (default during
 * the beta) or a comma list such as `storvv_medium,storvv_enterprise`. Confirmation and payment
 * events are on every plan regardless.
 */
export function paymentLinksAllowedForPlan(plan: string, env: NodeJS.ProcessEnv): boolean {
  const raw = String(env.PAYMENTS_V2_LINK_PLANS || 'all').trim()
  if (raw === 'all') return true
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .includes(plan)
}

async function loadPaystackDecisions(): Promise<string | null> {
  try {
    const raw = await useStorage('assets:payments-docs').getItem('paystack-decisions.md')
    if (raw == null) return null
    return typeof raw === 'string' ? raw : Buffer.from(raw as Uint8Array).toString('utf8')
  } catch {
    return null
  }
}

export async function getPaymentsV2Gate(
  env: NodeJS.ProcessEnv = process.env
): Promise<PaymentsV2Gate> {
  const live = String(env.PAYSTACK_SECRET_KEY || '')
    .trim()
    .startsWith('sk_live_')
  return evaluatePaymentsV2Gate(env, live ? await loadPaystackDecisions() : null)
}

/** Payments V2 routes 404 when the feature is off, so they look absent rather than broken. */
export async function requirePaymentsV2(): Promise<void> {
  const gate = await getPaymentsV2Gate()
  if (!gate.enabled) throw createError({ statusCode: 404, message: 'Not found' })
}
