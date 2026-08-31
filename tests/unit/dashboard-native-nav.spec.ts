import { describe, expect, it } from 'vitest'
import {
  isDashboardNavActive,
  nativeNavShortLabel,
  resolveNativePrimaryOrder,
  splitNativeBottomNav,
} from '~/utils/dashboard-native-nav'

const items = [
  { name: 'Dashboard', href: '/dashboard', iconKey: 'dashboard' as const },
  { name: 'Inventory', href: '/dashboard/inventory', iconKey: 'inventory' as const },
  { name: 'Sales', href: '/dashboard/receipts', iconKey: 'receipts' as const },
  {
    name: 'Departments',
    href: '/dashboard/stores/store-1/departments',
    iconKey: 'departments' as const,
  },
  { name: 'Analytics', href: '/dashboard/analytics', iconKey: 'analytics' as const },
  { name: 'Settings', href: '/dashboard/settings', iconKey: 'settings' as const },
  { name: 'Profile', href: '/dashboard/profile', iconKey: 'profile' as const },
]

describe('splitNativeBottomNav', () => {
  it('puts primary tabs in order and remainder in more', () => {
    const { primary, more } = splitNativeBottomNav(items)
    expect(primary.map((i) => i.name)).toEqual([
      'Dashboard',
      'Inventory',
      'Sales',
      'Analytics',
    ])
    expect(more.map((i) => i.name)).toEqual(['Departments', 'Settings', 'Profile'])
  })

  it('keeps payment links in more when not in primary order', () => {
    const withLinks = [
      ...items,
      {
        name: 'Payment links',
        href: '/dashboard/payment-links',
        iconKey: 'payment-links' as const,
      },
    ]
    const { primary, more } = splitNativeBottomNav(withLinks)
    expect(primary.map((i) => i.name)).toEqual([
      'Dashboard',
      'Inventory',
      'Sales',
      'Analytics',
    ])
    expect(more.map((i) => i.name)).toContain('Payment links')
  })

  it('promotes payment links to primary tab when configured', () => {
    const withLinks = [
      ...items,
      {
        name: 'Payment links',
        href: '/dashboard/payment-links',
        iconKey: 'payment-links' as const,
      },
    ]
    const order = resolveNativePrimaryOrder({ promotePaymentLinks: true })
    const { primary, more } = splitNativeBottomNav(withLinks, order)
    expect(primary.map((i) => i.name)).toEqual([
      'Dashboard',
      'Inventory',
      'Sales',
      'Payment links',
      'Profile',
    ])
    expect(more.map((i) => i.name)).toContain('Analytics')
  })
})

describe('isDashboardNavActive', () => {
  it('prefers longer nav match', () => {
    const hrefs = items.map((i) => i.href)
    expect(isDashboardNavActive('/dashboard/inventory/abc', '/dashboard/inventory', hrefs)).toBe(
      true
    )
    expect(isDashboardNavActive('/dashboard/inventory/abc', '/dashboard', hrefs)).toBe(false)
  })

  it('highlights departments tab on store list and department detail routes', () => {
    const hrefs = items.map((i) => i.href)
    const deptHref = '/dashboard/stores/store-1/departments'
    expect(isDashboardNavActive('/dashboard/stores/store-1/departments', deptHref, hrefs)).toBe(
      true
    )
    expect(isDashboardNavActive('/dashboard/departments/dept-9', deptHref, hrefs)).toBe(true)
    expect(isDashboardNavActive('/dashboard/receipts', deptHref, hrefs)).toBe(false)
  })
})

describe('nativeNavShortLabel', () => {
  it('shortens known labels', () => {
    expect(nativeNavShortLabel('Dashboard')).toBe('Home')
    expect(nativeNavShortLabel('Departments')).toBe('Teams')
    expect(nativeNavShortLabel('Multi-Store Sync')).toBe('Sync')
  })
})
