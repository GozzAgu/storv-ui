import { describe, expect, it, beforeEach } from 'vitest'
import {
  markOnboardingCompleteForSession,
  isOnboardingCompleteForSession,
  clearOnboardingCompleteForSession,
} from '~/utils/onboarding-session'

describe('onboarding-session', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('marks and reads onboarding complete for a uid', () => {
    markOnboardingCompleteForSession('user-1')
    expect(isOnboardingCompleteForSession('user-1')).toBe(true)
    expect(isOnboardingCompleteForSession('user-2')).toBe(false)
  })

  it('clears onboarding session for matching uid', () => {
    markOnboardingCompleteForSession('user-1')
    clearOnboardingCompleteForSession('user-1')
    expect(isOnboardingCompleteForSession('user-1')).toBe(false)
  })

  it('clear without uid removes stored value', () => {
    markOnboardingCompleteForSession('user-1')
    clearOnboardingCompleteForSession()
    expect(isOnboardingCompleteForSession('user-1')).toBe(false)
  })
})
