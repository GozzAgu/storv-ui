/**
 * The visitor's cookie choice from the marketing banner. Analytics storage stays denied until
 * they accept all (Firebase consent mode, applied in plugins/01.firebase.client.ts).
 */
export type CookieChoice = 'all' | 'essential'

const KEY = 'storvv-cookie-choice'
/** Before the choice existed, pressing OK on the banner meant accepting all cookies. */
const LEGACY_KEY = 'storvv-cookies-accepted'

export function readCookieChoice(): CookieChoice | null {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'all' || value === 'essential') return value
    if (localStorage.getItem(LEGACY_KEY)) return 'all'
  } catch {
    /* storage blocked: ask again */
  }
  return null
}

export function analyticsConsent(choice: CookieChoice | null): 'granted' | 'denied' {
  return choice === 'all' ? 'granted' : 'denied'
}

export function saveCookieChoice(choice: CookieChoice): void {
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    /* storage blocked: the choice applies to this visit only */
  }
  void import('firebase/analytics')
    .then(({ setConsent }) =>
      setConsent({ analytics_storage: analyticsConsent(choice), ad_storage: 'denied' })
    )
    .catch(() => undefined)
}
