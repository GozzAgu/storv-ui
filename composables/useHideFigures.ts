import { computed } from 'vue'

const STORAGE_KEY = 'storvv:hide-figures'

/** Per-device "hide figures" switch for the summary cards. See `HideFiguresToggle`. */
export const useHideFigures = () => {
  const hidden = useState<boolean>('hide-figures', () => {
    if (!import.meta.client) return false
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  function setFiguresHidden(value: boolean) {
    hidden.value = value
    if (!import.meta.client) return
    try {
      if (value) localStorage.setItem(STORAGE_KEY, '1')
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Private mode / storage full: the toggle still works for this session.
    }
  }

  return {
    figuresHidden: computed(() => hidden.value),
    setFiguresHidden,
    toggleFigures: () => setFiguresHidden(!hidden.value),
  }
}
