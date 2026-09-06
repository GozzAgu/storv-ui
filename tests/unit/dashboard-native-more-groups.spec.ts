import { describe, expect, it } from 'vitest'
import { groupNativeMoreNavItems } from '~/utils/dashboard-native-more-groups'
import type { DashboardNavItem } from '~/utils/dashboard-native-nav'

function item(name: string): DashboardNavItem {
  return {
    name,
    href: `/dashboard/${name.toLowerCase().replace(/\s+/g, '-')}`,
    segment: name.toLowerCase(),
    iconKey: 'dashboard',
  }
}

describe('groupNativeMoreNavItems', () => {
  it('groups items into Operations, Organization, and Account', () => {
    const groups = groupNativeMoreNavItems([
      item('Settings'),
      item('Storefront'),
      item('Sales leads'),
      item('Departments'),
      item('Activity Logs'),
      item('Payment links'),
    ])

    expect(groups.map((g) => g.id)).toEqual(['operations', 'organization', 'account'])
    expect(groups[0]?.items.map((i) => i.name)).toEqual([
      'Storefront',
      'Sales leads',
      'Payment links',
    ])
    expect(groups[1]?.items.map((i) => i.name)).toEqual(['Departments', 'Activity Logs'])
    expect(groups[2]?.items.map((i) => i.name)).toEqual(['Settings'])
  })

  it('omits empty groups', () => {
    const groups = groupNativeMoreNavItems([item('Settings'), item('Profile')])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.id).toBe('account')
  })

  it('preserves item order within each group', () => {
    const groups = groupNativeMoreNavItems([
      item('Storefront'),
      item('Customer buybacks'),
      item('Stock loans'),
      item('Sales leads'),
    ])

    expect(groups[0]?.items.map((i) => i.name)).toEqual([
      'Storefront',
      'Customer buybacks',
      'Stock loans',
      'Sales leads',
    ])
  })
})
