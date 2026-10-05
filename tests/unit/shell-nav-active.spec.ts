import { describe, expect, it } from 'vitest'
import { isDashboardNavActive } from '~/utils/shell-nav'

const hrefs = [
  '/dashboard',
  '/dashboard/inventory',
  '/dashboard/receipts',
  '/dashboard/stores/store-1/departments',
  '/dashboard/analytics',
  '/dashboard/settings',
  '/dashboard/profile',
]

describe('isDashboardNavActive', () => {
  it('prefers longer nav match', () => {
    expect(isDashboardNavActive('/dashboard/inventory/abc', '/dashboard/inventory', hrefs)).toBe(true)
    expect(isDashboardNavActive('/dashboard/inventory/abc', '/dashboard', hrefs)).toBe(false)
  })

  it('highlights departments on store list and department detail routes', () => {
    const deptHref = '/dashboard/stores/store-1/departments'
    expect(isDashboardNavActive('/dashboard/stores/store-1/departments', deptHref, hrefs)).toBe(true)
    expect(isDashboardNavActive('/dashboard/departments/dept-9', deptHref, hrefs)).toBe(true)
    expect(isDashboardNavActive('/dashboard/receipts', deptHref, hrefs)).toBe(false)
  })
})
