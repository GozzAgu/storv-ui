/**
 * Dev/QA plan switcher gate. Never allowed on Vercel production or with a live Paystack key,
 * because the switcher grants paid plans without payment.
 *
 * `paystackSecretKey` is the key the app charges with (resolvePaystackSecretKey on the runtime
 * config); the env key is checked too, so either one being live refuses.
 */
export function isDevPlanSwitcherAllowed(
  env: NodeJS.ProcessEnv = process.env,
  paystackSecretKey = ''
): boolean {
  if (env.VERCEL_ENV === 'production') return false
  const keys = [paystackSecretKey, env.PAYSTACK_SECRET_KEY].map((k) => String(k || '').trim())
  if (keys.some((k) => k.startsWith('sk_live_'))) return false
  if (env.NODE_ENV === 'development') return true
  const flag = String(env.NUXT_PUBLIC_ALLOW_DEV_PLAN_SWITCHER || '')
    .trim()
    .toLowerCase()
  return flag === '1' || flag === 'true'
}
