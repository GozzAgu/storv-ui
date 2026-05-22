import { describe, it, expect } from 'vitest'
import {
  formatStaffStatusLabel,
  staffRoleBadgeClass,
  staffStatusBadgeClass,
} from '~/utils/table-badge-styles'

describe('table-badge-styles', () => {
  it('formats staff status labels', () => {
    expect(formatStaffStatusLabel('on_leave')).toBe('On leave')
    expect(formatStaffStatusLabel('active')).toBe('Active')
  })

  it('returns badge classes for role and status', () => {
    expect(staffRoleBadgeClass('manager')).toContain('primary')
    expect(staffStatusBadgeClass('active')).toContain('emerald')
  })
})
