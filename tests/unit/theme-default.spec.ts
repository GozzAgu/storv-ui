import { describe, expect, it, vi } from 'vitest'
import { isThemePreference, resolveStoredThemePreference } from '~/utils/theme-default'

vi.mock('~/utils/capacitor-env', () => ({
  isCapacitorNative: vi.fn(() => false),
}))

describe('theme default', () => {
  it('accepts valid theme preferences', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
  })

  it('defaults to light on web when nothing is saved', async () => {
    const { getDefaultThemePreference } = await import('~/utils/theme-default')
    expect(getDefaultThemePreference()).toBe('light')
    expect(resolveStoredThemePreference(null)).toBe('light')
  })

  it('defaults to system on native when nothing is saved', async () => {
    const { isCapacitorNative } = await import('~/utils/capacitor-env')
    vi.mocked(isCapacitorNative).mockReturnValue(true)

    const { getDefaultThemePreference } = await import('~/utils/theme-default')
    expect(getDefaultThemePreference()).toBe('system')
    expect(resolveStoredThemePreference(null)).toBe('system')
  })
})
