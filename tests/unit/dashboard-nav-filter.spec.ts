import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_NAV_DEFINITIONS,
  filterDashboardNavItems,
  orderNativeMoreNavItems,
} from '~/utils/dashboard-nav-filter'
import {
  buildBusinessCapabilityContext,
  canUseBusinessCapability,
} from '~/types/business-experience'
import type { PermissionModule } from '~/types/staff-permissions'
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
  'sales_leads',
])

function canUseEnterprise(feature: SubscriptionFeature) {
  return enterpriseFeatures.has(feature)
}

function canViewNone(_module: PermissionModule) {
  return false
}

function canViewGranted(modules: PermissionModule[]) {
  const set = new Set(modules)
  return (module: PermissionModule) => set.has(module)
}

describe('filterDashboardNavItems', () => {
  it('hides permission-gated ops when staff has no grants', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: false,
      isManager: false,
      canUseFeature: canUseEnterprise,
      canViewModule: canViewNone,
    }).map((item) => item.name)

    expect(names).not.toContain('Customer buybacks')
    expect(names).not.toContain('Stock loans')
    expect(names).not.toContain('Sales leads')
    expect(names).not.toContain('Multi-Store Sync')
    expect(names).not.toContain('Departments')
  })

  it('shows ops only when the matching module view grant is present', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: false,
      isManager: true,
      canUseFeature: (feature) =>
        feature === 'multi_store_sync' ? true : canUseEnterprise(feature),
      canViewModule: canViewGranted(['buybacks', 'sellerLoans', 'leads']),
    }).map((item) => item.name)

    expect(names).toContain('Customer buybacks')
    expect(names).toContain('Stock loans')
    expect(names).toContain('Sales leads')
    expect(names).not.toContain('Multi-Store Sync')
    expect(names).not.toContain('Departments')
    expect(names).not.toContain('Analytics')
  })

  it('shows Reports to staff only with the financial figures grant', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: false,
      isManager: false,
      canUseFeature: canUseEnterprise,
      canViewModule: canViewGranted(['financials']),
    }).map((item) => item.name)

    expect(names).toContain('Analytics')
  })

  it('lets super admin on Micro see departments but not analytics', () => {
    const microFeatures = new Set<SubscriptionFeature>([
      'dashboard',
      'inventory',
      'receipts',
      'departments',
      'settings',
      'profile',
      'payment_links',
    ])

    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: true,
      isManager: false,
      canUseFeature: (feature) => microFeatures.has(feature),
    }).map((item) => item.name)

    expect(names).toContain('Departments')
    expect(names).not.toContain('Analytics')
    expect(names).not.toContain('Sales leads')
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

  it('hides admin-complexity nav for solo experience but keeps commerce routes', () => {
    const soloContext = buildBusinessCapabilityContext({ experienceMode: 'solo' })
    const canUseBusiness = (capability: Parameters<typeof canUseBusinessCapability>[0]) =>
      canUseBusinessCapability(capability, soloContext)

    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: true,
      isManager: false,
      canUseFeature: () => true,
      canUseBusinessCapability: canUseBusiness,
    }).map((item) => item.name)

    expect(names).not.toContain('Departments')
    expect(names).not.toContain('Payment links')
    expect(names).not.toContain('Multi-Store Sync')
    expect(names).toContain('Customer buybacks')
    expect(names).toContain('Stock loans')
    expect(names).toContain('Sales leads')
    expect(names).toContain('Activity Logs')
  })

  it('keeps full admin nav for business experience and legacy accounts without experienceMode', () => {
    for (const config of [{ experienceMode: 'business' as const }, {}]) {
      const context = buildBusinessCapabilityContext(config)
      const canUseBusiness = (capability: Parameters<typeof canUseBusinessCapability>[0]) =>
        canUseBusinessCapability(capability, context)

      const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
        isSuperAdmin: true,
        isManager: false,
        canUseFeature: () => true,
        canUseBusinessCapability: canUseBusiness,
      }).map((item) => item.name)

      expect(names).toContain('Departments')
      expect(names).toContain('Multi-Store Sync')
    }
  })

  it('hides storefront when launch flag is on', () => {
    const names = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
      isSuperAdmin: true,
      isManager: false,
      canUseFeature: () => true,
      hideStorefront: true,
    }).map((item) => item.name)

    expect(names).not.toContain('Storefront')
    expect(names).toContain('Inventory')
  })
})

describe('phone "More" menu (iOS and narrow web)', () => {
  it('lists Storefront, Payment links and Trade with shops only when each is switched on', async () => {
    const { buildShellMoreNav } = await import('~/utils/shell-nav')
    const context = buildBusinessCapabilityContext({ experienceMode: 'business' })
    const moreLabels = (off: boolean) => {
      const items = filterDashboardNavItems(DASHBOARD_NAV_DEFINITIONS, {
        isSuperAdmin: true,
        isManager: false,
        canUseFeature: () => true,
        canUseBusinessCapability: (capability) => canUseBusinessCapability(capability, context),
        hidePaymentLinks: off,
        hideStorefront: off,
        tradeEnabled: !off,
      }).map((item) => ({
        name: item.name,
        iconKey: item.iconKey,
        href: `/dashboard${item.segment}`,
      }))
      return buildShellMoreNav(items).map((item) => item.label)
    }

    expect(moreLabels(false)).toEqual(
      expect.arrayContaining(['Storefront', 'Payment links', 'Trade with shops'])
    )
    const off = moreLabels(true)
    expect(off).not.toContain('Storefront')
    expect(off).not.toContain('Payment links')
    expect(off).not.toContain('Trade with shops')
  })

  it('currently has Storefront and Payment links switched off', async () => {
    const { isPaymentLinksComingSoon } = await import('~/utils/payment-links-launch')
    const { isStorefrontDashboardHidden } = await import('~/utils/storefront-launch')
    expect(isPaymentLinksComingSoon()).toBe(true)
    expect(isStorefrontDashboardHidden()).toBe(true)
  })

  it('groups the grid like the sidebar, with general items first and nothing from the bar', async () => {
    const { buildShellMoreNav, buildShellMoreSections } = await import('~/utils/shell-nav')
    const items = DASHBOARD_NAV_DEFINITIONS.map((item) => ({
      name: item.name,
      iconKey: item.iconKey,
      href: `/dashboard${item.segment}`,
    }))

    const sections = buildShellMoreSections(items)
    expect(sections.map((section) => section.label)).toEqual([
      'General',
      'Operations',
      'Organization',
    ])
    expect(sections[0]!.items.map((item) => item.label)).toEqual(['Reports', 'Help', 'Settings'])

    const grouped = sections.flatMap((section) => section.items.map((item) => item.name)).sort()
    const flat = buildShellMoreNav(items)
      .map((item) => item.name)
      .sort()
    expect(grouped).toEqual(flat)
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
