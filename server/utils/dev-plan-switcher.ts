/**
 * Dev/QA plan switcher gate. Never allowed with a live Paystack key, because the switcher
 * grants paid plans without payment.
 */
export function isDevPlanSwitcherAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  const secret = String(env.PAYSTACK_SECRET_KEY || '').trim()
  if (secret.startsWith('sk_live_')) return false
  if (env.NODE_ENV === 'development') return true
  const flag = String(env.NUXT_PUBLIC_ALLOW_DEV_PLAN_SWITCHER || '')
    .trim()
    .toLowerCase()
  return flag === '1' || flag === 'true'
}
