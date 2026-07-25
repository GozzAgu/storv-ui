import { describe, it, expect } from 'vitest'
import { isTwoFactorVerifiedForSession } from '~/server/utils/two-factor-claims'

describe('two-factor claims', () => {
  it('requires tfaVerifiedAt to be at or after auth_time', () => {
    expect(
      isTwoFactorVerifiedForSession({
        auth_time: 1000,
        tfaVerifiedAt: 1000,
      } as never)
    ).toBe(true)

    expect(
      isTwoFactorVerifiedForSession({
        auth_time: 2000,
        tfaVerifiedAt: 1000,
      } as never)
    ).toBe(false)
  })

  it('returns false when claim is missing', () => {
    expect(isTwoFactorVerifiedForSession({ auth_time: 1000 } as never)).toBe(false)
  })
})
