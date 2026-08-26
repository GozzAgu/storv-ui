import type { DashboardNavIconKey } from '~/utils/dashboard-nav-icons'
import type { SubscriptionFeature } from '~/types/subscription'

export type DashboardNavDefinition = {
  name: string
  segment: string
  iconKey: DashboardNavIconKey
  requiresSuperAdmin?: boolean
  requiresManagerOrSuperAdmin?: boolean
  subscriptionFeature?: SubscriptionFeature
}

/** Canonical sidebar / native bottom-nav routes (web + iOS/Android Capacitor). */
export const DASHBOARD_NAV_DEFINITIONS: DashboardNavDefinition[] = [
  {
    name: 'Dashboard',
    segment: '',
    iconKey: 'dashboard',
    subscriptionFeature: 'dashboard',
  },
  {
    name: 'Inventory',
    segment: '/inventory',
    iconKey: 'inventory',
    subscriptionFeature: 'inventory',
  },
  {
    name: 'Sales',
    segment: '/receipts',
    iconKey: 'receipts',
    subscriptionFeature: 'receipts',
  },
  {
    name: 'Customer buybacks',
    segment: '/buybacks',
    iconKey: 'buybacks',
    subscriptionFeature: 'inventory',
  },
  {
    name: 'Stock loans',
    segment: '/seller-loans',
    iconKey: 'loans',
    subscriptionFeature: 'seller_loans',
    requiresManagerOrSuperAdmin: true,
  },
  {
    name: 'Multi-Store Sync',
    segment: '/multi-store-sync',
    iconKey: 'sync',
    requiresSuperAdmin: true,
    subscriptionFeature: 'multi_store_sync',
  },
  {
    name: 'Payment links',
    segment: '/payment-links',
    iconKey: 'payment-links',
    subscriptionFeature: 'payment_links',
  },
  {
    name: 'Departments',
    segment: '/departments',
    iconKey: 'departments',
    requiresSuperAdmin: true,
    subscriptionFeature: 'departments',
  },
  {
    name: 'Analytics',
    segment: '/analytics',
    iconKey: 'analytics',
    subscriptionFeature: 'analytics',
    requiresManagerOrSuperAdmin: true,
  },
  {
    name: 'Activity Logs',
    segment: '/activity',
    iconKey: 'activity',
    subscriptionFeature: 'activity_logs',
    requiresManagerOrSuperAdmin: true,
  },
  { name: 'Help center', segment: '/help', iconKey: 'help' },
  {
    name: 'Settings',
    segment: '/settings',
    iconKey: 'settings',
    subscriptionFeature: 'settings',
  },
  {
    name: 'Profile',
    segment: '/profile',
    iconKey: 'profile',
    subscriptionFeature: 'profile',
  },
]

const NATIVE_MORE_PRIORITY = [
  'Customer buybacks',
  'Stock loans',
  'Departments',
  'Multi-Store Sync',
  'Payment links',
  'Activity Logs',
  'Help center',
  'Settings',
  'Profile',
] as const

export function filterDashboardNavItems(
  items: DashboardNavDefinition[],
  options: {
    isSuperAdmin: boolean
    isManager: boolean
    canUseFeature: (feature: SubscriptionFeature) => boolean
    hidePaymentLinks?: boolean
  }
): DashboardNavDefinition[] {
  const canSeeManagerOnlyFeatures = options.isSuperAdmin || options.isManager

  return items.filter((item) => {
    if (item.segment === '/payment-links' && options.hidePaymentLinks) return false
    if (item.requiresSuperAdmin && !options.isSuperAdmin) return false
    if (item.requiresManagerOrSuperAdmin && !canSeeManagerOnlyFeatures) return false
    if (item.subscriptionFeature && !options.canUseFeature(item.subscriptionFeature)) return false
    return true
  })
}

/** Surface stock ops first in the iOS/Android “More” sheet. */
export function orderNativeMoreNavItems<T extends { name: string }>(items: T[]): T[] {
  const priority = new Map<string, number>(
    NATIVE_MORE_PRIORITY.map((name, index) => [name, index])
  )
  return [...items].sort((a, b) => {
    const ai = priority.get(a.name) ?? 999
    const bi = priority.get(b.name) ?? 999
    return ai - bi || a.name.localeCompare(b.name)
  })
}
