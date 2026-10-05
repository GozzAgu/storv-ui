const EURO_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
])

type RegionOption = { code: string }
type CurrencyOption = { code: string; region: string }

/**
 * Suggest a starting country and currency for onboarding from browser locales
 * (e.g. `en-NG`). Returns empty strings when nothing matches so the user picks.
 */
export function suggestOnboardingLocale(
  locales: readonly string[],
  regions: readonly RegionOption[],
  currencies: readonly CurrencyOption[]
): { country: string; currency: string } {
  for (const locale of locales) {
    const subtag = locale.split(/[-_]/)[1]?.toUpperCase()
    if (!subtag || subtag.length !== 2) continue
    const country = EURO_COUNTRIES.has(subtag) ? 'EU' : subtag
    if (!regions.some((region) => region.code === country)) continue
    const currency = currencies.find((c) => c.region === country)?.code ?? ''
    return { country, currency }
  }
  return { country: '', currency: '' }
}
