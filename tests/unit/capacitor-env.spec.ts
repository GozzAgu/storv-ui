import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('capacitor-env', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('detects capacitor:// protocol', async () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'capacitor:', href: 'capacitor://localhost/signin', hostname: 'localhost' },
      writable: true,
    })
    const { isCapacitorNative } = await import('~/utils/capacitor-env')
    expect(isCapacitorNative()).toBe(true)
  })

  it('is false on https', async () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:', href: 'https://app.storvv.com/signin', hostname: 'app.storvv.com' },
      writable: true,
    })
    const { isCapacitorNative } = await import('~/utils/capacitor-env')
    expect(isCapacitorNative()).toBe(false)
  })
})
