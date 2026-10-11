import { describe, expect, it } from 'vitest'
import {
  apiErrorCode,
  isEmailVerificationRequiredError,
  isTotpCodeRequiredError,
  isTwoFactorRequiredError,
} from '~/utils/security-api-errors'

/** Shape of a $fetch error for `createError({ statusCode: 403, data: { code } })` on the server. */
function fetchError(code: string) {
  return { statusCode: 403, data: { statusCode: 403, message: 'x', data: { code } } }
}

describe('security API error codes', () => {
  it('reads the code from a $fetch error body', () => {
    expect(apiErrorCode(fetchError('TFA_REQUIRED'))).toBe('TFA_REQUIRED')
    expect(isTwoFactorRequiredError(fetchError('TFA_REQUIRED'))).toBe(true)
    expect(isEmailVerificationRequiredError(fetchError('EMAIL_VERIFICATION_REQUIRED'))).toBe(true)
    expect(isTotpCodeRequiredError(fetchError('TFA_CODE_REQUIRED'))).toBe(true)
  })

  it('reads the code from an in-app error', () => {
    expect(isTwoFactorRequiredError({ data: { code: 'TFA_REQUIRED' } })).toBe(true)
  })

  it('ignores other errors', () => {
    expect(isTwoFactorRequiredError(fetchError('OWNER_ONLY'))).toBe(false)
    expect(apiErrorCode(new Error('boom'))).toBeUndefined()
    expect(apiErrorCode(null)).toBeUndefined()
  })
})
