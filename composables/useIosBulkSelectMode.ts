import { ref, watch, type Ref } from 'vue'

/**
 * Intentional bulk-select mode for iOS lists (Photos/Files pattern):
 * Select → checkboxes + bulk bar → Done (clears selection).
 */
export function useIosBulkSelectMode(opts?: {
  /** Clear selection when exiting select mode (default true). */
  clearOnExit?: boolean
  selectedCount?: Ref<number>
  clearSelection?: () => void
}) {
  const isSelecting = ref(false)
  const clearOnExit = opts?.clearOnExit !== false

  function enterSelectMode() {
    isSelecting.value = true
  }

  function exitSelectMode() {
    isSelecting.value = false
    if (clearOnExit) opts?.clearSelection?.()
  }

  function toggleSelectMode() {
    if (isSelecting.value) exitSelectMode()
    else enterSelectMode()
  }

  // If the list becomes empty while selecting, leave the mode.
  if (opts?.selectedCount) {
    watch(
      () => opts.selectedCount!.value,
      () => {
        /* keep mode until Done — no auto-exit on zero */
      }
    )
  }

  return {
    isSelecting,
    enterSelectMode,
    exitSelectMode,
    toggleSelectMode,
  }
}
