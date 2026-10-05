import { describe, expect, it } from 'vitest'
import { suggestOnboardingLocale } from '~/utils/onboarding-locale'

const regions = [{ code: 'NG' }, { code: 'GB' }, { code: 'EU' }, { code: 'GH' }]
const currencies = [
  { code: 'NGN', region: 'NG' },
  { code: 'GBP', region: 'GB' },
  { code: 'EUR', region: 'EU' },
]

describe('suggestOnboardingLocale', () => {
  it('uses the first locale with a supported region', () => {
    expect(suggestOnboardingLocale(['en', 'en-NG'], regions, currencies)).toEqual({
      country: 'NG',
      currency: 'NGN',
    })
  })

  it('maps eurozone countries to Europe', () => {
    expect(suggestOnboardingLocale(['de-DE'], regions, currencies)).toEqual({
      country: 'EU',
      currency: 'EUR',
    })
  })

  it('leaves currency empty when the region has none listed', () => {
    expect(suggestOnboardingLocale(['en-GH'], regions, currencies)).toEqual({
      country: 'GH',
      currency: '',
    })
  })

  it('returns empty values when nothing matches', () => {
    expect(suggestOnboardingLocale(['en-US', 'fr'], regions, currencies)).toEqual({
      country: '',
      currency: '',
    })
  })
})
