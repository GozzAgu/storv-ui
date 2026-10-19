import { describe, it, expect } from 'vitest'
import { isTwoFactorVerifiedForSession } from '~/server/utils/two-factor-claims'

describe('two-factor claims', () => {
  it('verifies only the sign-in that passed 2FA', () => {
    expect(
      isTwoFactorVerifiedForSession({ auth_time: 1000, tfaSessions: [900, 1000] } as never)
    ).toBe(true)
  })

  it('does not verify a session stuck at the prompt when another sign-in passes 2FA', () => {
    // The attacker signed in at 1000; the owner passed 2FA on another device at 2000.
    expect(isTwoFactorVerifiedForSession({ auth_time: 1000, tfaSessions: [2000] } as never)).toBe(
      false
    )
  })

  it('ignores the old account-wide timestamp', () => {
    expect(isTwoFactorVerifiedForSession({ auth_time: 1000, tfaVerifiedAt: 5000 } as never)).toBe(
      false
    )
  })

  it('returns false when the claim is missing', () => {
    expect(isTwoFactorVerifiedForSession({ auth_time: 1000 } as never)).toBe(false)
  })
})
