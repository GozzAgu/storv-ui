import { describe, it, expect } from 'vitest'
import {
  formatSellerLoanStatusLabel,
  formatStaffStatusLabel,
  staffAccessLabel,
} from '~/utils/status-labels'
import { formatDepartmentTypeLabel } from '~/utils/department-format'
import { formatCategoryDate, formatCategoryDisplayName } from '~/utils/inventory-category-format'

describe('status-labels', () => {
  it('formats staff labels', () => {
    expect(formatStaffStatusLabel('on_leave')).toBe('On leave')
    expect(formatStaffStatusLabel('active')).toBe('Active')
    expect(staffAccessLabel('full')).toBe('Full access')
    expect(staffAccessLabel('view-only')).toBe('View only')
  })

  it('formats seller loan status labels', () => {
    expect(formatSellerLoanStatusLabel('active')).toBe('On loan')
    expect(formatSellerLoanStatusLabel('returned')).toBe('Returned')
  })
})

describe('department and category formatting', () => {
  it('formats department type labels', () => {
    expect(formatDepartmentTypeLabel('customer_service')).toBe('Customer Service')
    expect(formatDepartmentTypeLabel(undefined)).toBe('General')
  })

  it('title-cases category display names', () => {
    expect(formatCategoryDisplayName('acura')).toBe('Acura')
    expect(formatCategoryDisplayName('alfa romeo')).toBe('Alfa Romeo')
    expect(formatCategoryDisplayName('BMW')).toBe('BMW')
  })

  it('formats category dates from Firestore timestamps', () => {
    expect(formatCategoryDate({ seconds: Date.UTC(2026, 0, 15, 12) / 1000 })).toBe('Jan 15, 2026')
    expect(formatCategoryDate(null)).toBeNull()
    expect(formatCategoryDate('not a date')).toBeNull()
  })
})
