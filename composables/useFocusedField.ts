import { ref } from 'vue'

/**
 * Tracks which form input has focus via `focusin`/`focusout` on a container.
 * Buttons inside a field (show password, clear) report that field's input id.
 */
export function useFocusedField() {
  const focused = ref('')

  function trackFocus(event: FocusEvent) {
    if (event.type === 'focusout') {
      focused.value = ''
      return
    }
    const target = event.target as HTMLElement | null
    const input = target?.closest('.s-field')?.querySelector('input')
    focused.value = input?.id || target?.id || ''
  }

  return { focused, trackFocus }
}
