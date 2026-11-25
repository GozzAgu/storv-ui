import { watchTableFit } from '~/utils/table-fit'

/**
 * Marks page tables that fit their card, so their header and totals pin to the page instead of
 * the table scrolling inside its own box (see "Sticky header" in assets/css/ds/lively.css).
 */
export default defineNuxtPlugin(() => {
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return
  watchTableFit(document.body)
})
