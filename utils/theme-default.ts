import { isCapacitorNative } from '~/utils/capacitor-env'
import type { Theme } from '~/stores/theme'

/** Default theme preference when the user has not chosen one yet. */
export function getDefaultThemePreference(): Theme {
  return isCapacitorNative() ? 'system' : 'light'
}

export function isThemePreference(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveStoredThemePreference(saved: string | null): Theme {
  if (isThemePreference(saved)) return saved
  return getDefaultThemePreference()
}
