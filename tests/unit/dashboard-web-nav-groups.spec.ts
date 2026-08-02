import { describe, expect, it } from 'vitest'
import { shouldShowWebNavSection, webNavSectionLabel } from '~/utils/dashboard-web-nav-groups'

const items = [
  { name: 'Dashboard' },
  { name: 'Inventory' },
  { name: 'Sales' },
  { name: 'Analytics' },
  { name: 'Settings' },
]

describe('dashboard-web-nav-groups', () => {
  it('maps items to section labels', () => {
    expect(webNavSectionLabel('Dashboard')).toBe('Overview')
    expect(webNavSectionLabel('Inventory')).toBe('Commerce')
    expect(webNavSectionLabel('Customer buybacks')).toBe('Stock operations')
    expect(webNavSectionLabel('Departments')).toBe('Org · Insights')
    expect(webNavSectionLabel('Analytics')).toBe('Org · Insights')
    expect(webNavSectionLabel('Settings')).toBe('Account')
  })

  it('shows section label at group boundaries', () => {
    expect(shouldShowWebNavSection('Dashboard', 0, items)).toBe(true)
    expect(shouldShowWebNavSection('Inventory', 1, items)).toBe(true)
    expect(shouldShowWebNavSection('Sales', 2, items)).toBe(false)
    expect(shouldShowWebNavSection('Analytics', 3, items)).toBe(true)
    expect(shouldShowWebNavSection('Settings', 4, items)).toBe(true)
  })
})
