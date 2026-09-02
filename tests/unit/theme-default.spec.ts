import { describe, expect, it } from 'vitest'
import {
  getDefaultThemePreference,
  isThemePreference,
  resolveStoredThemePreference,
} from '~/utils/theme-default'

describe('theme default', () => {
  it('accepts valid theme preferences', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
  })

  it('defaults to system (device preference) when nothing is saved, on web and native alike', () => {
    expect(getDefaultThemePreference()).toBe('system')
    expect(resolveStoredThemePreference(null)).toBe('system')
  })

  it('keeps an explicitly saved preference regardless of platform', () => {
    expect(resolveStoredThemePreference('light')).toBe('light')
    expect(resolveStoredThemePreference('dark')).toBe('dark')
    expect(resolveStoredThemePreference('system')).toBe('system')
  })
})
