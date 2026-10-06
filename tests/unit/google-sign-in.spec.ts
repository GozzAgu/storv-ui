import { beforeEach, describe, expect, it } from 'vitest'
import type { UserData } from '~/composables/useUser'
import { isGoogleSignInCancelled, mapGoogleSignInError } from '~/utils/google-sign-in'
import { isOnboardingCompleteForSession } from '~/utils/onboarding-session'
import { resolvePostSignInDestination } from '~/utils/post-sign-in-destination'

function user(overrides: Partial<UserData>): UserData {
  return { uid: 'u1', email: 'a@b.com', name: 'Shop', role: 'superAdmin', ...overrides } as UserData
}

describe('google sign-in errors', () => {
  it('treats a closed popup or dismissed native sheet as a quiet cancel', () => {
    expect(isGoogleSignInCancelled({ code: 'auth/popup-closed-by-user' })).toBe(true)
    expect(isGoogleSignInCancelled(new Error('The user canceled the sign-in flow.'))).toBe(true)
    expect(isGoogleSignInCancelled({ code: 'auth/network-request-failed' })).toBe(false)
  })

  it('explains when the email already uses a password', () => {
    expect(mapGoogleSignInError({ code: 'auth/account-exists-with-different-credential' })).toMatch(
      /email and password/
    )
  })

  it('falls back to the original message', () => {
    expect(mapGoogleSignInError(new Error('Boom'))).toBe('Boom')
  })
})

describe('resolvePostSignInDestination', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('sends new owners to onboarding', () => {
    expect(resolvePostSignInDestination(user({ hasCompletedOnboarding: false }))).toBe(
      '/dashboard/onboarding'
    )
  })

  it('sends onboarded owners to the dashboard and remembers it for the session', () => {
    expect(resolvePostSignInDestination(user({ hasCompletedOnboarding: true }))).toBe('/dashboard')
    expect(isOnboardingCompleteForSession('u1')).toBe(true)
  })

  it('sends staff who must reset their password to change-password', () => {
    expect(resolvePostSignInDestination(user({ role: 'staff', mustChangePassword: true }))).toBe(
      '/dashboard/change-password'
    )
    expect(resolvePostSignInDestination(user({ role: 'staff' }))).toBe('/dashboard')
  })
})
