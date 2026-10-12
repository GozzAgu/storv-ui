/** Element ids painted by `CAPACITOR_BOOT_SPLASH_SCRIPT` (see `capacitor-shell-inline.ts`). */
export const NATIVE_BOOT_SPLASH_ID = 's-native-boot'
const NATIVE_BOOT_STYLE_ID = 's-native-boot-style'
const FADE_MS = 300

export function hasNativeBootSplash(): boolean {
  return typeof document !== 'undefined' && !!document.getElementById(NATIVE_BOOT_SPLASH_ID)
}

/** Fades the launch logo out, then removes it and its styles. Safe to call more than once. */
export function dismissNativeBootSplash(): void {
  if (typeof document === 'undefined') return
  const splash = document.getElementById(NATIVE_BOOT_SPLASH_ID)
  if (!splash || splash.classList.contains('is-done')) return
  splash.classList.add('is-done')
  setTimeout(() => {
    splash.remove()
    document.getElementById(NATIVE_BOOT_STYLE_ID)?.remove()
  }, FADE_MS)
}
