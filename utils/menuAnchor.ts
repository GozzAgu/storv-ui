/**
 * Resolve the menu trigger to position against when mobile + desktop both render
 * the same `data-*` anchor id. `querySelector` returns the first node in DOM order (often
 * the hidden breakpoint copy), whose getBoundingClientRect() is 0×0; menus jump to
 * the top-left. This picks the element with a non-zero layout box (the visible one).
 */
export function getVisibleMenuAnchorElement(
  attributeName:
    | 'data-item-actions-anchor'
    | 'data-receipt-actions-anchor'
    | 'data-customer-actions-anchor'
    | 'data-folder-actions-anchor'
    | 'data-department-actions-anchor'
    | 'data-stock-loan-actions-anchor',
  id: string
): HTMLElement | null {
  if (!import.meta.client) return null
  const safe =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(String(id))
      : String(id).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const nodes = document.querySelectorAll(`[${attributeName}="${safe}"]`)
  let best: HTMLElement | null = null
  let bestArea = 0
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as HTMLElement
    const r = el.getBoundingClientRect()
    const area = r.width * r.height
    if (area > bestArea) {
      bestArea = area
      best = el
    }
  }
  return bestArea > 0 ? best : null
}

/**
 * Position a fixed dropdown beside its anchor, flipping above when there isn't
 * enough room below (e.g. last table row) so the menu stays in the viewport.
 */
export function computeFixedAnchoredMenuStyle(
  anchorRect: DOMRectReadOnly,
  options: {
    menuWidth: number
    estimatedMenuHeight: number
    margin?: number
    viewportPadding?: number
  }
): Record<string, string> {
  const margin = options.margin ?? 4
  const pad = options.viewportPadding ?? 8
  const menuWidth = options.menuWidth
  const h = options.estimatedMenuHeight
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0

  let left = anchorRect.right - menuWidth
  left = Math.max(pad, Math.min(left, vw - menuWidth - pad))

  const belowTop = anchorRect.bottom + margin
  const aboveTop = anchorRect.top - h - margin
  const spaceBelow = vh - belowTop - pad
  const spaceAbove = anchorRect.top - margin - pad

  let top: number

  if (h <= spaceBelow) {
    top = belowTop
  } else if (h <= spaceAbove) {
    top = aboveTop
  } else if (spaceAbove > spaceBelow) {
    top = Math.max(pad, aboveTop)
  } else {
    top = Math.min(belowTop, vh - pad - h)
  }

  // Keep fully inside viewport vertically when possible
  const maxTop = vh - pad - h
  const minTop = pad
  top = Math.max(minTop, Math.min(top, maxTop))

  return {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
  }
}
