const DEFAULT_APP_ORIGIN = 'https://app.storvv.com'

/**
 * Plan & billing on the website. The iOS app never sells Storvv plans or add-ons itself
 * (App Store rules on digital subscriptions); owners change them here instead.
 */
export function webBillingUrl(appOrigin?: string | null): string {
  const raw = String(appOrigin || '').trim().replace(/\/+$/, '')
  const origin = raw.startsWith('https://') ? raw : DEFAULT_APP_ORIGIN
  return `${origin}/dashboard/settings?tab=account#settings-subscription`
}
