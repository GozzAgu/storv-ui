import { describe, it, expect } from 'vitest'
import {
  formatSellerLoanStatusLabel,
  formatStaffStatusLabel,
  sellerLoanStatusBadgeClass,
  staffRoleBadgeClass,
  staffStatusBadgeClass,
} from '~/utils/table-badge-styles'

describe('table-badge-styles', () => {
  it('formats staff status labels', () => {
    expect(formatStaffStatusLabel('on_leave')).toBe('On leave')
    expect(formatStaffStatusLabel('active')).toBe('Active')
  })

  it('returns badge classes for role and status', () => {
    expect(staffRoleBadgeClass('manager')).toContain('rounded-full')
    expect(staffRoleBadgeClass('intern')).toContain('blue')
    expect(staffStatusBadgeClass('active')).toContain('emerald')
  })

  it('formats seller loan status labels and badge classes', () => {
    expect(formatSellerLoanStatusLabel('active')).toBe('On loan')
    expect(sellerLoanStatusBadgeClass('active')).toContain('indigo')
    expect(sellerLoanStatusBadgeClass('sold')).toContain('emerald')
  })
})
