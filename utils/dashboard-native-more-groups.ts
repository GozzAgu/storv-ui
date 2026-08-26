import type { DashboardNavItem } from '~/utils/dashboard-native-nav'

export type NativeMoreNavGroupId = 'operations' | 'organization' | 'account'

export type NativeMoreNavGroup = {
  id: NativeMoreNavGroupId
  label: string
  items: DashboardNavItem[]
}

const OPERATIONS = new Set([
  'Customer buybacks',
  'Stock loans',
  'Multi-Store Sync',
  'Payment links',
  'Sales leads',
])

const ORGANIZATION = new Set(['Departments', 'Activity Logs'])

const GROUP_ORDER: NativeMoreNavGroupId[] = ['operations', 'organization', 'account']

const GROUP_LABELS: Record<NativeMoreNavGroupId, string> = {
  operations: 'Operations',
  organization: 'Organization',
  account: 'Account',
}

/** Group “More” menu items iOS Settings-style (preserves item order within each group). */
export function groupNativeMoreNavItems(items: DashboardNavItem[]): NativeMoreNavGroup[] {
  const buckets: Record<NativeMoreNavGroupId, DashboardNavItem[]> = {
    operations: [],
    organization: [],
    account: [],
  }

  for (const item of items) {
    if (OPERATIONS.has(item.name)) {
      buckets.operations.push(item)
    } else if (ORGANIZATION.has(item.name)) {
      buckets.organization.push(item)
    } else {
      buckets.account.push(item)
    }
  }

  return GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_LABELS[id],
    items: buckets[id],
  })).filter((group) => group.items.length > 0)
}
