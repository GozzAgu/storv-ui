/** Keyboard overlap (px) for native shells - used to lift drawer content above the keyboard. */
export function computeVisualKeyboardInset(): number {
  if (typeof window === 'undefined' || !window.visualViewport) return 0
  const viewport = window.visualViewport
  const inset = window.innerHeight - viewport.height - viewport.offsetTop
  return Math.max(0, Math.round(inset))
}

export function applyNativeKeyboardInset(px: number): void {
  if (typeof document === 'undefined') return
  const clamped = Math.max(0, Math.round(px))
  document.documentElement.style.setProperty('--native-keyboard-inset', `${clamped}px`)
  document.documentElement.toggleAttribute('data-native-keyboard-open', clamped > 0)
}

export function clearNativeKeyboardInset(): void {
  applyNativeKeyboardInset(0)
}
