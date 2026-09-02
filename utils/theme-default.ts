import type { Theme } from '~/stores/theme'

/** Default theme preference when the user has not chosen one yet (web and native alike). */
export function getDefaultThemePreference(): Theme {
  return 'system'
}

export function isThemePreference(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveStoredThemePreference(saved: string | null): Theme {
  if (isThemePreference(saved)) return saved
  return getDefaultThemePreference()
}
