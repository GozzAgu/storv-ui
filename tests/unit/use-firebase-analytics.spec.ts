import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAnalytics = vi.fn(() => ({ kind: 'analytics' }))
let native = false

vi.mock('firebase/app', () => ({ getApps: () => [{ name: '[DEFAULT]' }] }))
vi.mock('firebase/analytics', () => ({ getAnalytics }))
vi.mock('~/utils/firebase-emulators', () => ({ firebaseEmulatorsEnabled: () => false }))
vi.mock('~/utils/capacitor-env', () => ({ isCapacitorNative: () => native }))

const { useFirebase } = await import('~/composables/useFirebase')

describe('useFirebase analytics', () => {
  beforeEach(() => {
    getAnalytics.mockClear()
    native = false
  })

  it('does not start Analytics just because useFirebase() is called', () => {
    useFirebase().getApp()
    expect(getAnalytics).not.toHaveBeenCalled()
  })

  it('never starts Analytics in the iOS/Android app, where gtag.js crashes the web view', () => {
    native = true
    expect(useFirebase().analytics).toBeNull()
    expect(getAnalytics).not.toHaveBeenCalled()
  })

  it('starts it on the web when asked', () => {
    expect(useFirebase().analytics).toEqual({ kind: 'analytics' })
    expect(getAnalytics).toHaveBeenCalledTimes(1)
  })
})
