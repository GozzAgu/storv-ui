import { isCapacitorNative } from '~/utils/capacitor-env'

const KEYBOARD_FOCUS_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

const TAP_DISMISS_SKIP_SELECTOR =
  `${KEYBOARD_FOCUS_SELECTOR}, button, a, label, [role="button"], [role="link"], [role="checkbox"]`

/** Dismiss the keyboard when closing native overlays. */
export function blurActiveElementIfNative(native: boolean): void {
  if (!native || !import.meta.client) return
  void dismissKeyboard()
}

/** Blur the focused field and hide the native keyboard when available. */
export async function dismissKeyboard(): Promise<void> {
  if (typeof document === 'undefined') return

  const active = document.activeElement
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  ) {
    active.blur()
  }

  if (!isCapacitorNative()) return

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    await Keyboard.hide()
  } catch {
    /* Keyboard plugin optional */
  }
}

/** Close the keyboard when the user taps outside interactive controls. */
export function dismissKeyboardFromBackgroundTap(event: Event): void {
  if (typeof document === 'undefined') return

  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest(TAP_DISMISS_SKIP_SELECTOR)) return

  void dismissKeyboard()
}
