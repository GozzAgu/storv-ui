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
    | 'data-staff-actions-anchor'
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

/** Attribute every `IosContextMenu` card renders, whatever its `menu-id` is. */
export const ANCHORED_MENU_SELECTOR = '[data-context-menu]'

/**
 * Whether an event happened inside an open row menu.
 *
 * Outside-click handlers close their menu, and they listen in the capture phase
 * so they run *before* the menu item's own handler. Vue flushes between the two,
 * so treating a tap on a menu row as "outside" clears the row state the item's
 * handler is about to read — the menu closes and the action silently no-ops.
 * Matching on the shared attribute keeps that from depending on each page
 * remembering to tag its own card.
 */
export function isInsideAnchoredMenu(target: EventTarget | null): boolean {
  const el = target as Element | null
  return Boolean(el?.closest?.(ANCHORED_MENU_SELECTOR))
}

/**
 * Narrowest a row menu is allowed to get before it flips to the other side of
 * its anchor. Matches the `min-width` these menus carry in CSS (11.5rem), below
 * which `min-width` would win over our `max-width` and overflow the viewport.
 */
const MIN_ANCHORED_MENU_WIDTH = 184

/**
 * Pin a fixed menu horizontally without knowing how wide it renders.
 *
 * A menu's real width comes from CSS `min-width` and its longest item label, so
 * positioning off a caller-supplied estimate clips the card whenever the guess
 * runs short. Anchoring with `right` (plus a `max-width` that reserves the
 * viewport padding) lines the edge up exactly, whatever it measures.
 *
 * @param rightEdge viewport x the menu's right edge should sit on
 * @param fallbackLeftEdge viewport x to grow rightward from when there is not
 *   enough room to the left of `rightEdge`
 */
export function computeFixedMenuHorizontalStyle(options: {
  rightEdge: number
  fallbackLeftEdge: number
  viewportPadding?: number
}): Record<string, string> {
  const pad = options.viewportPadding ?? 8
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0

  const right = Math.max(pad, vw - options.rightEdge)
  const widthWhenRightAligned = vw - right - pad

  if (widthWhenRightAligned >= MIN_ANCHORED_MENU_WIDTH) {
    return {
      right: `${Math.round(right)}px`,
      maxWidth: `${Math.round(widthWhenRightAligned)}px`,
    }
  }

  const left = Math.max(pad, Math.min(options.fallbackLeftEdge, vw - pad - MIN_ANCHORED_MENU_WIDTH))
  return {
    left: `${Math.round(left)}px`,
    maxWidth: `${Math.round(vw - left - pad)}px`,
  }
}

/**
 * Position a fixed dropdown beside its anchor, flipping above when there isn't
 * enough room below (e.g. last table row) so the menu stays in the viewport.
 *
 * Height is still estimated since it only picks above vs. below; the width is
 * measured for us by `computeFixedMenuHorizontalStyle`.
 */
export function computeFixedAnchoredMenuStyle(
  anchorRect: DOMRectReadOnly,
  options: {
    estimatedMenuHeight: number
    margin?: number
    viewportPadding?: number
  }
): Record<string, string> {
  const margin = options.margin ?? 4
  const pad = options.viewportPadding ?? 8
  const h = options.estimatedMenuHeight
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0

  const inline = computeFixedMenuHorizontalStyle({
    rightEdge: anchorRect.right,
    fallbackLeftEdge: anchorRect.left,
    viewportPadding: pad,
  })

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
    ...inline,
    // A menu taller than its estimate scrolls rather than running off-screen
    maxHeight: `${Math.round(Math.max(0, vh - top - pad))}px`,
    overflowY: 'auto',
  }
}
