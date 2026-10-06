import { isCapacitorNative } from '~/utils/capacitor-env'
import { isKeyboardField, scheduleRevealFocusedField } from '~/utils/keyboard-field-reveal'

/**
 * Mobile browsers: the keyboard overlays the page (`interactive-widget=overlays-content`), so
 * keep the focused field in the part of the screen it leaves free. The native app does this
 * from Capacitor keyboard events in `startNativeKeyboardHandling`.
 */
export default defineNuxtPlugin(() => {
  if (isCapacitorNative() || !window.matchMedia('(pointer: coarse)').matches) return

  const viewport = window.visualViewport
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  document.addEventListener('focusin', (event) => {
    if (!isKeyboardField(event.target as Element | null)) return
    scheduleRevealFocusedField()
    clearTimeout(settleTimer)
    settleTimer = setTimeout(scheduleRevealFocusedField, 350)
  })

  viewport?.addEventListener('resize', () => {
    if (isKeyboardField(document.activeElement)) scheduleRevealFocusedField()
  })
})
