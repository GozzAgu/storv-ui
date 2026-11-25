/**
 * Which data tables can pin their header to the page. A table that fits its card gets
 * `.s-table-wrap--fits` (no inner scroll, header and totals stick to the page); a wider one keeps
 * sideways scrolling and an unpinned header. Re-checked whenever a table or its card changes size.
 */

export const TABLE_FITS_CLASS = 's-table-wrap--fits'

/** Only page tables: never inside dialogs, drawers or popovers, which scroll on their own. */
const PAGE_TABLE_SELECTOR = '.s-shell__page .s-table-wrap'
const OVERLAY_SELECTOR = '.s-dialog, .s-popover, [role="dialog"]'

/** True when the table is no wider than its wrapper (1px of rounding allowed). */
export function tableFits(wrapWidth: number, tableWidth: number): boolean {
  return tableWidth <= wrapWidth + 1
}

export function watchTableFit(root: ParentNode & Node = document): () => void {
  const watched = new WeakSet<Element>()
  let frame = 0

  function measure(wrap: HTMLElement) {
    const table = wrap.querySelector('table')
    if (!table) return
    wrap.classList.toggle(TABLE_FITS_CLASS, tableFits(wrap.clientWidth, table.scrollWidth))
  }

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const wrap = (entry.target as HTMLElement).closest<HTMLElement>('.s-table-wrap')
      if (wrap) measure(wrap)
    }
  })

  function scan() {
    frame = 0
    root.querySelectorAll<HTMLElement>(PAGE_TABLE_SELECTOR).forEach((wrap) => {
      if (wrap.closest(OVERLAY_SELECTOR)) return
      if (!watched.has(wrap)) {
        watched.add(wrap)
        resizeObserver.observe(wrap)
        const table = wrap.querySelector('table')
        if (table) resizeObserver.observe(table)
      }
      measure(wrap)
    })
  }

  // Tables appear and change as pages, tabs and filters change
  const mutationObserver = new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(scan)
  })
  mutationObserver.observe(root, { childList: true, subtree: true })
  scan()

  return () => {
    mutationObserver.disconnect()
    resizeObserver.disconnect()
    if (frame) cancelAnimationFrame(frame)
  }
}
