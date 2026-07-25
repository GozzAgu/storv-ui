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

  it('prefers explicit NUXT_PUBLIC_API_BASE', async () => {
    mockRuntimeConfig.mockReturnValue({
      public: {
        apiBase: 'https://api.example.com/',
        appOrigin: 'https://app.storvv.com',
      },
    })
    const { getEffectiveApiBase } = await import('~/utils/capacitor-api-base')
    expect(getEffectiveApiBase()).toBe('https://api.example.com')
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
