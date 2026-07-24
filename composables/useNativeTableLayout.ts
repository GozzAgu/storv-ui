import { computed, ref, watch, type Ref } from 'vue'
import {
  applyNativeTableLayout,
  getNativeTableLayoutMode,
  isCapacitorIosDocument,
  setNativeTableLayoutMode,
  type NativeTableLayoutMode,
} from '~/utils/native-table-cards'

export function useIsCapacitorIos() {
  const isCapacitorIos = useState('capacitor-ios-shell', () => false)

  if (import.meta.client) {
    const refresh = () => {
      isCapacitorIos.value = isCapacitorIosDocument()
    }
    refresh()
    onMounted(refresh)
  }

  return { isCapacitorIos }
}

export function useNativeTableLayout(storageKey: Ref<string> | string) {
  const { isCapacitorIos } = useIsCapacitorIos()
  const keyRef = computed(() => (typeof storageKey === 'string' ? storageKey : storageKey.value))

  const layoutMode = ref<NativeTableLayoutMode>('cards')

  function bindShell(shell: HTMLElement | null | undefined) {
    if (!shell || !isCapacitorIos.value) return
    shell.setAttribute('data-native-table-key', keyRef.value)
    layoutMode.value = getNativeTableLayoutMode(keyRef.value)
    applyNativeTableLayout(shell, layoutMode.value)
  }

  function setLayoutMode(mode: NativeTableLayoutMode) {
    layoutMode.value = mode
    setNativeTableLayoutMode(keyRef.value, mode)
    if (import.meta.client) {
      const shell = document.querySelector(
        `[data-native-table-key="${CSS.escape(keyRef.value)}"]`
      ) as HTMLElement | null
      if (shell) applyNativeTableLayout(shell, mode)
    }
  }

  if (import.meta.client) {
    watch(
      keyRef,
      (key) => {
        layoutMode.value = getNativeTableLayoutMode(key)
      },
      { immediate: true }
    )
  }

  return {
    isCapacitorIos,
    layoutMode,
    isCards: computed(() => layoutMode.value === 'cards'),
    bindShell,
    setLayoutMode,
  }
}
