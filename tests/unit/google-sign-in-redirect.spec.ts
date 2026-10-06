import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from 'firebase/auth'

const firebaseAuth = vi.hoisted(() => ({
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  browserPopupRedirectResolver: {},
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  signInWithCredential: vi.fn(),
  ...firebaseAuth,
}))

vi.mock('~/utils/capacitor-env', () => ({ isCapacitorNative: () => false }))

const { consumeGoogleRedirectResult, hasPendingGoogleRedirect, signInWithGoogle } = await import(
  '~/utils/google-sign-in'
)

const auth = {} as Auth

describe('web Google sign-in', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('uses the popup when the browser allows it', async () => {
    firebaseAuth.signInWithPopup.mockResolvedValue({ user: { uid: 'u1' } })
    await expect(signInWithGoogle(auth)).resolves.toEqual({ user: { uid: 'u1' } })
    expect(firebaseAuth.signInWithRedirect).not.toHaveBeenCalled()
    expect(hasPendingGoogleRedirect()).toBe(false)
  })

  it('falls back to a full-page redirect when popups are blocked', async () => {
    firebaseAuth.signInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked' })
    firebaseAuth.signInWithRedirect.mockResolvedValue(undefined)
    await signInWithGoogle(auth)
    expect(firebaseAuth.signInWithRedirect).toHaveBeenCalledOnce()
    expect(hasPendingGoogleRedirect()).toBe(true)
  })

  it('does not redirect when the person closed the popup', async () => {
    firebaseAuth.signInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' })
    await expect(signInWithGoogle(auth)).rejects.toEqual({ code: 'auth/popup-closed-by-user' })
    expect(firebaseAuth.signInWithRedirect).not.toHaveBeenCalled()
  })

  it('finishes a pending redirect once, then clears it', async () => {
    sessionStorage.setItem('storv_google_redirect_pending', '1')
    firebaseAuth.getRedirectResult.mockResolvedValue({ user: { uid: 'u2' } })
    await expect(consumeGoogleRedirectResult(auth)).resolves.toEqual({ user: { uid: 'u2' } })
    expect(hasPendingGoogleRedirect()).toBe(false)
    await expect(consumeGoogleRedirectResult(auth)).resolves.toBeNull()
    expect(firebaseAuth.getRedirectResult).toHaveBeenCalledOnce()
  })
})
