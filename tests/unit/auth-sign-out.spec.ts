import { describe, expect, it, beforeEach } from 'vitest'
import {
  SIGN_OUT_PENDING_KEY,
  clearSignOutPending,
  isSignOutPending,
  markSignOutPending,
} from '~/utils/auth-sign-out'

describe('auth-sign-out helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('marks and clears sign-out pending flag', () => {
    expect(isSignOutPending()).toBe(false)
    markSignOutPending()
    expect(isSignOutPending()).toBe(true)
    expect(sessionStorage.getItem(SIGN_OUT_PENDING_KEY)).toBe('1')
    clearSignOutPending()
    expect(isSignOutPending()).toBe(false)
  })
})
