import { ref, watch, nextTick, onBeforeUnmount, type Ref } from 'vue'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'

type UseAnchoredRowMenuOptions = {
  anchorAttr: string
  menuSelector?: string
  anchorSelector?: string
  menuWidth?: number
  estimatedMenuHeight?: number
  viewportPadding?: number | Ref<number>
}

/** Floating row menu anchored to a `data-*-actions-anchor` button (iOS 3-dot pattern). */
export function useAnchoredRowMenu(options: UseAnchoredRowMenuOptions) {
  const {
    anchorAttr,
    menuSelector,
    anchorSelector = `[${anchorAttr}]`,
    menuWidth = 160,
    estimatedMenuHeight = 120,
    viewportPadding = 8,
  } = options

  const openMenuId = ref<string | null>(null)
  const menuFixedStyle = ref<Record<string, string> | null>(null)

  let outsideHandler: ((e: MouseEvent) => void) | null = null

  function toggleMenu(id: string) {
    openMenuId.value = openMenuId.value === id ? null : id
  }

  function closeMenu() {
    openMenuId.value = null
  }

  function removeOutsideListener() {
    if (outsideHandler && import.meta.client) {
      document.removeEventListener('click', outsideHandler, true)
      outsideHandler = null
    }
  }

  function updateMenuPosition() {
    const id = openMenuId.value
    if (!id || !import.meta.client) {
      menuFixedStyle.value = null
      return
    }
    const el = getVisibleMenuAnchorElement(anchorAttr, id)
    if (!el) {
      menuFixedStyle.value = null
      return
    }
    const padding =
      typeof viewportPadding === 'number' ? viewportPadding : viewportPadding.value
    const r = el.getBoundingClientRect()
    menuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
      menuWidth,
      estimatedMenuHeight,
      margin: 4,
      viewportPadding: padding,
    })
  }

  function addPositionListeners() {
    if (!import.meta.client) return
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
  }

  function removePositionListeners() {
    if (!import.meta.client) return
    window.removeEventListener('scroll', updateMenuPosition, true)
    window.removeEventListener('resize', updateMenuPosition)
  }

  watch(openMenuId, (id) => {
    removeOutsideListener()
    removePositionListeners()
    menuFixedStyle.value = null
    if (!id || !import.meta.client) return

    nextTick(() => {
      updateMenuPosition()
      addPositionListeners()
    })

    outsideHandler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (menuSelector && t?.closest?.(menuSelector)) return
      if (t?.closest?.(anchorSelector)) return
      openMenuId.value = null
      removeOutsideListener()
    }

    nextTick(() => {
      setTimeout(() => {
        if (openMenuId.value && outsideHandler) {
          document.addEventListener('click', outsideHandler, true)
        }
      }, 0)
    })
  })

  onBeforeUnmount(() => {
    removeOutsideListener()
    removePositionListeners()
  })

  return {
    openMenuId,
    menuFixedStyle,
    toggleMenu,
    closeMenu,
    updateMenuPosition,
  }
}
