import { isCapacitorNative } from '~/utils/capacitor-env'
import {
  applyNativeKeyboardInset,
  clearNativeKeyboardInset,
  computeVisualKeyboardInset,
} from '~/utils/native-keyboard-inset'

let started = false
let teardown: (() => void) | null = null

/** Prevent iOS from resizing the WebView when the keyboard opens; track inset for drawers. */
export async function startNativeKeyboardHandling(): Promise<void> {
  if (!import.meta.client || started || !isCapacitorNative()) return
  started = true

  try {
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard')
    await Keyboard.setResizeMode({ mode: KeyboardResize.None })

    const showHandle = await Keyboard.addListener('keyboardWillShow', (event) => {
      applyNativeKeyboardInset(event.keyboardHeight)
    })
    const hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
      clearNativeKeyboardInset()
    })

    teardown = () => {
      void showHandle.remove()
      void hideHandle.remove()
      clearNativeKeyboardInset()
      started = false
      teardown = null
    }
    return
  } catch {
    /* Keyboard plugin unavailable — fall back to visualViewport */
  }

  const syncFromViewport = () => {
    applyNativeKeyboardInset(computeVisualKeyboardInset())
  }

  window.visualViewport?.addEventListener('resize', syncFromViewport)
  window.visualViewport?.addEventListener('scroll', syncFromViewport)
  syncFromViewport()

  teardown = () => {
    window.visualViewport?.removeEventListener('resize', syncFromViewport)
    window.visualViewport?.removeEventListener('scroll', syncFromViewport)
    clearNativeKeyboardInset()
    started = false
    teardown = null
  }
}

export function stopNativeKeyboardHandling(): void {
  teardown?.()
}
