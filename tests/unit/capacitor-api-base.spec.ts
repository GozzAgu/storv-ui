import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRuntimeConfig = vi.fn(() => ({
  public: {
    apiBase: '',
    appOrigin: 'https://app.storvv.com',
  },
}))

vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

describe('capacitor api base', () => {
  beforeEach(() => {
    mockRuntimeConfig.mockReturnValue({
      public: {
        apiBase: '',
        appOrigin: 'https://app.storvv.com',
      },
    })
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('prefers explicit NUXT_PUBLIC_API_BASE on Capacitor native', async () => {
    vi.doMock('~/utils/capacitor-env', () => ({
      isCapacitorNative: () => true,
    }))
    mockRuntimeConfig.mockReturnValue({
      public: {
        apiBase: 'https://api.example.com/',
        appOrigin: 'https://app.storvv.com',
      },
    })
    const { getEffectiveApiBase } = await import('~/utils/capacitor-api-base')
    expect(getEffectiveApiBase()).toBe('https://api.example.com')
  })

  it('ignores explicit api base on web (same-origin /api)', async () => {
    vi.doMock('~/utils/capacitor-env', () => ({
      isCapacitorNative: () => false,
    }))
    mockRuntimeConfig.mockReturnValue({
      public: {
        apiBase: 'https://app.storvv.com',
        appOrigin: 'https://app.storvv.com',
      },
    })
    const { getEffectiveApiBase } = await import('~/utils/capacitor-api-base')
    expect(getEffectiveApiBase()).toBe('')
  })

  it('falls back to app origin on Capacitor native client', async () => {
    vi.doMock('~/utils/capacitor-env', () => ({
      isCapacitorNative: () => true,
    }))
    const { getEffectiveApiBase, isApiBaseConfigured } = await import('~/utils/capacitor-api-base')
    expect(getEffectiveApiBase()).toBe('https://app.storvv.com')
    expect(isApiBaseConfigured()).toBe(true)
  })

  it('returns empty on web when api base is unset', async () => {
    vi.doMock('~/utils/capacitor-env', () => ({
      isCapacitorNative: () => false,
    }))
    const { getEffectiveApiBase } = await import('~/utils/capacitor-api-base')
    expect(getEffectiveApiBase()).toBe('')
  })
})
