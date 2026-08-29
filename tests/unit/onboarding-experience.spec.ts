import { describe, it, expect } from 'vitest'
import { withOnboardingExperienceChoice } from '~/utils/onboarding-experience'

describe('withOnboardingExperienceChoice', () => {
  const base = {
    storeName: 'Lagos Main',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    storeDescription: '',
  }

  it('persists solo choice with onboarding flag', () => {
    expect(withOnboardingExperienceChoice(base, 'solo')).toEqual({
      ...base,
      experienceMode: 'solo',
      onboardingExperienceChosen: true,
    })
  })

  it('persists business choice with onboarding flag', () => {
    expect(withOnboardingExperienceChoice(base, 'business')).toEqual({
      ...base,
      experienceMode: 'business',
      onboardingExperienceChosen: true,
    })
  })

  it('normalizes unknown values to business (safe default)', () => {
    expect(withOnboardingExperienceChoice(base, 'team')).toMatchObject({
      experienceMode: 'business',
      onboardingExperienceChosen: true,
    })
  })
})
