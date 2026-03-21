import { describe, it, expect } from 'vitest'
import {
  PAGINATION_ELLIPSIS,
  getPaginationIndices,
  getTotalPages,
  getVisiblePageNumbers,
} from '~/utils/pagination'

describe('getTotalPages', () => {
  it('returns 0 when there are no items', () => {
    expect(getTotalPages(0, 10)).toBe(0)
  })

  it('returns 0 when itemsPerPage is 0 (guard)', () => {
    expect(getTotalPages(100, 0)).toBe(0)
  })

  it('returns 0 when itemsPerPage is negative (guard)', () => {
    expect(getTotalPages(10, -1)).toBe(0)
  })

  it('ceil-divides items by page size', () => {
    expect(getTotalPages(1, 10)).toBe(1)
    expect(getTotalPages(10, 10)).toBe(1)
    expect(getTotalPages(11, 10)).toBe(2)
    expect(getTotalPages(100, 7)).toBe(15)
  })
})

describe('getPaginationIndices', () => {
  it('first page: 0-based start and inclusive end', () => {
    expect(getPaginationIndices(1, 10, 25)).toEqual({ startIndex: 0, endIndex: 10 })
  })

  it('last partial page: caps end at total', () => {
    expect(getPaginationIndices(3, 10, 25)).toEqual({ startIndex: 20, endIndex: 25 })
  })

  it('single page of data', () => {
    expect(getPaginationIndices(1, 100, 42)).toEqual({ startIndex: 0, endIndex: 42 })
  })

  it('empty total: endIndex is 0', () => {
    expect(getPaginationIndices(1, 10, 0)).toEqual({ startIndex: 0, endIndex: 0 })
  })
})

describe('getVisiblePageNumbers', () => {
  it('returns empty when totalPages is 0', () => {
    expect(getVisiblePageNumbers(1, 0)).toEqual([])
  })

  it('returns empty when totalPages is negative', () => {
    expect(getVisiblePageNumbers(1, -1)).toEqual([])
  })

  it('shows all pages when totalPages ≤ 7', () => {
    expect(getVisiblePageNumbers(1, 1)).toEqual([1])
    expect(getVisiblePageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('shows 1..7 when total is 8 and current is near start (current ≤ 3)', () => {
    expect(getVisiblePageNumbers(1, 8)).toEqual([1, 2, 3, 4, PAGINATION_ELLIPSIS, 8])
    expect(getVisiblePageNumbers(2, 8)).toEqual([1, 2, 3, 4, PAGINATION_ELLIPSIS, 8])
    expect(getVisiblePageNumbers(3, 8)).toEqual([1, 2, 3, 4, PAGINATION_ELLIPSIS, 8])
  })

  it('shows window near end when current ≥ total − 2', () => {
    expect(getVisiblePageNumbers(8, 10)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      7,
      8,
      9,
      10,
    ])
    expect(getVisiblePageNumbers(9, 10)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      7,
      8,
      9,
      10,
    ])
    expect(getVisiblePageNumbers(10, 10)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      7,
      8,
      9,
      10,
    ])
  })

  it('shows middle window with ellipses on both sides', () => {
    expect(getVisiblePageNumbers(5, 10)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      4,
      5,
      6,
      PAGINATION_ELLIPSIS,
      10,
    ])
    expect(getVisiblePageNumbers(6, 20)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      5,
      6,
      7,
      PAGINATION_ELLIPSIS,
      20,
    ])
  })

  it('exactly 8 pages: branch uses ellipsis pattern (not compact 1–8)', () => {
    expect(getVisiblePageNumbers(4, 8)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      3,
      4,
      5,
      PAGINATION_ELLIPSIS,
      8,
    ])
  })

  it('large total: stable snapshot for boundary currents', () => {
    expect(getVisiblePageNumbers(1, 100)).toEqual([1, 2, 3, 4, PAGINATION_ELLIPSIS, 100])
    expect(getVisiblePageNumbers(50, 100)).toEqual([
      1,
      PAGINATION_ELLIPSIS,
      49,
      50,
      51,
      PAGINATION_ELLIPSIS,
      100,
    ])
  })
})
