/**
 * Pure pagination helpers (shared by Pagination.vue and tests).
 * Ellipsis is represented as -1 in the visible page list.
 */

export const PAGINATION_ELLIPSIS = -1 as const

export type VisiblePageEntry = number

/**
 * Page numbers to show (1-based), with -1 for ellipsis, matching the UI algorithm
 * when there are more than 7 total pages.
 */
export function getVisiblePageNumbers(currentPage: number, totalPages: number): VisiblePageEntry[] {
 const pages: number[] = []
 const total = totalPages
 const current = currentPage

 if (total <= 0) {
 return []
 }

 if (total <= 7) {
 for (let i = 1; i <= total; i++) {
 pages.push(i)
 }
 return pages
 }

 pages.push(1)
 if (current <= 3) {
 for (let i = 2; i <= 4; i++) pages.push(i)
 pages.push(PAGINATION_ELLIPSIS)
 pages.push(total)
 } else if (current >= total - 2) {
 pages.push(PAGINATION_ELLIPSIS)
 for (let i = total - 3; i <= total; i++) pages.push(i)
 } else {
 pages.push(PAGINATION_ELLIPSIS)
 for (let i = current - 1; i <= current + 1; i++) pages.push(i)
 pages.push(PAGINATION_ELLIPSIS)
 pages.push(total)
 }
 return pages
}

export function getTotalPages(totalItems: number, itemsPerPage: number): number {
 if (itemsPerPage <= 0) return 0
 return Math.ceil(totalItems / itemsPerPage)
}

/**
 * Inclusive 0-based start index and 1-based inclusive end index for the summary line
 * ("start-end of total").
 */
export function getPaginationIndices(
 currentPage: number,
 itemsPerPage: number,
 totalItems: number
): { startIndex: number; endIndex: number } {
 const startIndex = (currentPage - 1) * itemsPerPage
 const end = startIndex + itemsPerPage
 const endIndex = end > totalItems ? totalItems : end
 return { startIndex, endIndex }
}
