import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/utils/capacitor-env', () => ({
  isCapacitorNative: vi.fn(() => false),
}))

vi.mock('~/utils/capacitor-api-base', () => ({
  isApiBaseConfigured: vi.fn(() => false),
}))

describe('getApiErrorMessage', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { isCapacitorNative } = await import('~/utils/capacitor-env')
    vi.mocked(isCapacitorNative).mockReturnValue(false)
  })

  it('extracts H3 error message from data.message', async () => {
    const { getApiErrorMessage } = await import('~/utils/api-error-message')
    expect(
      getApiErrorMessage({ data: { message: 'The storvv.com domain is not verified.' } })
    ).toBe('The storvv.com domain is not verified.')
  })

  it('adds mobile rebuild hint for network failures on Capacitor', async () => {
    const { isCapacitorNative } = await import('~/utils/capacitor-env')
    vi.mocked(isCapacitorNative).mockReturnValue(true)

    const { getApiErrorMessage } = await import('~/utils/api-error-message')
    const message = getApiErrorMessage(new TypeError('Failed to fetch'), 'Request failed')
    expect(message).toContain('NUXT_PUBLIC_API_BASE')
    expect(message).toContain('cap:build')
  })
})
