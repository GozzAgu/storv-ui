import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('firebase-client-auth', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('isCapacitorNative is false without Capacitor on window', async () => {
    const { isCapacitorNative } = await import('~/utils/firebase-client-auth')
    expect(isCapacitorNative()).toBe(false)
  })
})
