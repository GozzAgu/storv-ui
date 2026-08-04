import { describe, expect, it } from 'vitest'
import {
  AUTH_ACTION_PATH,
  getAuthActionContinueUrl,
  getAuthActionErrorCopy,
  getFirebaseAuthActionCodeSettings,
  getFirebaseAuthActionUrl,
  isSupportedAuthActionMode,
  parseFirebaseAuthActionFromLocation,
  parseFirebaseAuthActionFromSearch,
} from '~/utils/firebase-auth-action'

describe('firebase-auth-action', () => {
  it('builds in-app action code settings', () => {
    const previousWindow = globalThis.window
    // @ts-expect-error vitest/jsdom provides window; auth utils prefer browser origin when present
    delete globalThis.window

    const settings = getFirebaseAuthActionCodeSettings('https://app.storvv.com', 'verified')
    expect(settings).toEqual({
      url: 'https://app.storvv.com/signin?verified=1',
      handleCodeInApp: true,
    })

    globalThis.window = previousWindow
  })

  it('builds action handler URL', () => {
    const previousWindow = globalThis.window
    // @ts-expect-error vitest/jsdom provides window; auth utils prefer browser origin when present
    delete globalThis.window

    expect(getFirebaseAuthActionUrl('https://app.storvv.com')).toBe(
      `https://app.storvv.com${AUTH_ACTION_PATH}`
    )

    globalThis.window = previousWindow
  })

  it('builds continue URLs with status flags', () => {
    expect(getAuthActionContinueUrl('https://app.storvv.com', 'reset')).toBe(
      'https://app.storvv.com/signin?reset=1'
    )
  })

  it('parses search params', () => {
    expect(
      parseFirebaseAuthActionFromSearch('?mode=verifyEmail&oobCode=abc123&continueUrl=https%3A%2F%2Fexample.com')
    ).toEqual({
      mode: 'verifyEmail',
      oobCode: 'abc123',
      continueUrl: 'https://example.com',
      apiKey: '',
      lang: '',
    })
  })

  it('parses hash fallback from location', () => {
    expect(
      parseFirebaseAuthActionFromLocation({}, '#mode=resetPassword&oobCode=xyz789')
    ).toEqual({
      mode: 'resetPassword',
      oobCode: 'xyz789',
      continueUrl: '',
      apiKey: '',
      lang: '',
    })
  })

  it('maps expired action codes to friendly copy', () => {
    expect(getAuthActionErrorCopy({ code: 'auth/expired-action-code' }).title).toBe(
      'This link has expired'
    )
  })

  it('recognizes supported modes', () => {
    expect(isSupportedAuthActionMode('verifyEmail')).toBe(true)
    expect(isSupportedAuthActionMode('unknown')).toBe(false)
  })
})
