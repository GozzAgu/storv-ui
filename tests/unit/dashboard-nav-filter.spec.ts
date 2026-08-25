import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_NAV_DEFINITIONS,
  filterDashboardNavItems,
  orderNativeMoreNavItems,
} from '~/utils/dashboard-nav-filter'
import type { SubscriptionFeature } from '~/types/subscription'

const enterpriseFeatures = new Set<SubscriptionFeature>([
  'dashboard',
  'inventory',
  'receipts',
  'analytics',
  'activity_logs',
  'seller_loans',
  'departments',
  'settings',
  'profile',
])

function canUseEnterprise(feature: SubscriptionFeature) {
  return enterpriseFeatures.has(feature)
}

describe('filterDashboardNavItems', () => {
  it('lets floor staff see customer buybacks but not stock loans', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: false,
      isManager: false,
      canUseFeature: canUseEnterprise,
    }).map((item) => item.name)

    expect(names).toContain('Customer buybacks')
    expect(names).not.toContain('Stock loans')
    expect(names).not.toContain('Departments')
  })

  it('lets staff managers see stock loans on enterprise', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: false,
      isManager: true,
      canUseFeature: canUseEnterprise,
    }).map((item) => item.name)

    expect(names).toContain('Customer buybacks')
    expect(names).toContain('Stock loans')
    expect(names).not.toContain('Departments')
  })

  it('lets super admin see departments and multi-store sync when plan allows', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: true,
      isManager: false,
      canUseFeature: (feature) =>
        feature === 'multi_store_sync' ? true : canUseEnterprise(feature),
    }).map((item) => item.name)

    expect(names).toContain('Departments')
    expect(names).toContain('Multi-Store Sync')
  })
})

describe('orderNativeMoreNavItems', () => {
  it('puts buybacks and stock loans first in the iOS More sheet', () => {
    const ordered = orderNativeMoreNavItems([
      { name: 'Settings' },
      { name: 'Stock loans' },
      { name: 'Help center' },
      { name: 'Customer buybacks' },
    ])

    expect(ordered.map((item) => item.name)).toEqual([
      'Customer buybacks',
      'Stock loans',
      'Help center',
      'Settings',
    ])
  })
})
