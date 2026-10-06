import { isCapacitorNative } from '~/utils/capacitor-env'
import { isKeyboardField, scheduleRevealFocusedField } from '~/utils/keyboard-field-reveal'
import {
  applyNativeKeyboardInset,
  clearNativeKeyboardInset,
  computeVisualKeyboardInset,
  getNativeKeyboardInset,
} from '~/utils/native-keyboard-inset'

let started = false
let teardown: (() => void) | null = null

/** Moving between fields while the keyboard is already up fires no keyboard event. */
function onFocusIn(event: FocusEvent) {
  if (getNativeKeyboardInset() > 0 && isKeyboardField(event.target as Element | null)) {
    scheduleRevealFocusedField()
  }
}

/**
 * Prevent iOS from resizing the WebView when the keyboard opens; track inset for drawers
 * and scroll the focused field above the keyboard.
 */
export async function startNativeKeyboardHandling(): Promise<void> {
  if (!import.meta.client || started || !isCapacitorNative()) return
  started = true
  document.addEventListener('focusin', onFocusIn)

  try {
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard')
    await Keyboard.setResizeMode({ mode: KeyboardResize.None })

    const showHandle = await Keyboard.addListener('keyboardWillShow', (event) => {
      applyNativeKeyboardInset(event.keyboardHeight)
      scheduleRevealFocusedField()
    })
    const shownHandle = await Keyboard.addListener('keyboardDidShow', (event) => {
      applyNativeKeyboardInset(event.keyboardHeight)
      scheduleRevealFocusedField()
    })
    const hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
      clearNativeKeyboardInset()
    })

    teardown = () => {
      void showHandle.remove()
      void shownHandle.remove()
      void hideHandle.remove()
      document.removeEventListener('focusin', onFocusIn)
      clearNativeKeyboardInset()
      started = false
      teardown = null
    }
    return
  } catch {
    /* Keyboard plugin unavailable - fall back to visualViewport */
  }

  const syncFromViewport = () => {
    const wasOpen = getNativeKeyboardInset() > 0
    applyNativeKeyboardInset(computeVisualKeyboardInset())
    if (!wasOpen && getNativeKeyboardInset() > 0) scheduleRevealFocusedField()
  }

  window.visualViewport?.addEventListener('resize', syncFromViewport)
  window.visualViewport?.addEventListener('scroll', syncFromViewport)
  syncFromViewport()

  teardown = () => {
    window.visualViewport?.removeEventListener('resize', syncFromViewport)
    window.visualViewport?.removeEventListener('scroll', syncFromViewport)
    document.removeEventListener('focusin', onFocusIn)
    clearNativeKeyboardInset()
    started = false
    teardown = null
  }
}

export function stopNativeKeyboardHandling(): void {
  teardown?.()
}
