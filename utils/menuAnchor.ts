/**
 * Resolve the menu trigger to position against when mobile + desktop both render
 * the same `data-*` anchor id. `querySelector` returns the first node in DOM order (often
 * the hidden breakpoint copy), whose getBoundingClientRect() is 0×0 — menus jump to
 * the top-left. This picks the element with a non-zero layout box (the visible one).
 */
export function getVisibleMenuAnchorElement(
  attributeName: 'data-item-actions-anchor' | 'data-receipt-actions-anchor' | 'data-customer-actions-anchor' | 'data-folder-actions-anchor',
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
