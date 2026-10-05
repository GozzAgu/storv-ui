import { onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * Open/close state for a popover. Closes on outside click, Escape and route change.
 * Pass a `headerMenuId` for top-bar popovers so opening one closes the others
 * (`useActiveHeaderMenu`).
 */
export function useShellPopover(headerMenuId?: string) {
  const open = ref(false)
  const rootRef = ref<HTMLElement | null>(null)
  const headerMenu = headerMenuId ? useActiveHeaderMenu() : null
  const route = useRoute()

  function toggle() {
    open.value = !open.value
  }

  function close() {
    open.value = false
  }

  function onDocumentPointer(event: MouseEvent) {
    if (!open.value || !rootRef.value) return
    const path = typeof event.composedPath === 'function' ? event.composedPath() : []
    if (rootRef.value.contains(event.target as Node) || path.includes(rootRef.value)) return
    close()
  }

  function onKeydown(event: KeyboardEvent) {
    if (open.value && event.key === 'Escape') {
      close()
      rootRef.value?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
    }
  }

  if (headerMenu && headerMenuId) {
    watch(open, (isOpen) => {
      if (isOpen) headerMenu.openHeaderMenu(headerMenuId)
      else headerMenu.closeHeaderMenu(headerMenuId)
    })

    watch(headerMenu.activeMenu, (active) => {
      if (active !== headerMenuId && open.value) close()
    })
  }

  watch(() => route.fullPath, close)

  onMounted(() => {
    document.addEventListener('click', onDocumentPointer)
    document.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('click', onDocumentPointer)
    document.removeEventListener('keydown', onKeydown)
    if (headerMenu && headerMenuId) headerMenu.closeHeaderMenu(headerMenuId)
  })

  return { open, rootRef, toggle, close }
}
