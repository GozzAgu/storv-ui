import { describe, expect, it } from 'vitest'
import {
  isDashboardNavActive,
  nativeNavShortLabel,
  splitNativeBottomNav,
} from '~/utils/dashboard-native-nav'

const items = [
  { name: 'Dashboard', href: '/dashboard', icon: null, iconSolid: null },
  { name: 'Inventory', href: '/dashboard/inventory', icon: null, iconSolid: null },
  { name: 'Receipts', href: '/dashboard/receipts', icon: null, iconSolid: null },
  { name: 'Analytics', href: '/dashboard/analytics', icon: null, iconSolid: null },
  { name: 'Settings', href: '/dashboard/settings', icon: null, iconSolid: null },
]

describe('splitNativeBottomNav', () => {
  it('puts primary tabs in order and remainder in more', () => {
    const { primary, more } = splitNativeBottomNav(items)
    expect(primary.map((i) => i.name)).toEqual(['Dashboard', 'Inventory', 'Receipts', 'Analytics'])
    expect(more.map((i) => i.name)).toEqual(['Settings'])
  })
})

describe('isDashboardNavActive', () => {
  it('prefers longer nav match', () => {
    const hrefs = items.map((i) => i.href)
    expect(isDashboardNavActive('/dashboard/inventory/abc', '/dashboard/inventory', hrefs)).toBe(true)
    expect(isDashboardNavActive('/dashboard/inventory/abc', '/dashboard', hrefs)).toBe(false)
  })
})

describe('nativeNavShortLabel', () => {
  it('shortens known labels', () => {
    expect(nativeNavShortLabel('Dashboard')).toBe('Home')
    expect(nativeNavShortLabel('Multi-Store Sync')).toBe('Sync')
  })
})
