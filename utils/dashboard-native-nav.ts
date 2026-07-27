import { isDepartmentsAreaPath, isDepartmentsNavHref } from '~/utils/department-routes'
import type { DashboardNavIconKey } from '~/utils/dashboard-nav-icons'

export type DashboardNavItem = {
  name: string
  href: string
  iconKey: DashboardNavIconKey
}

export const NATIVE_PRIMARY_ORDER = [
  'Dashboard',
  'Inventory',
  'Receipts',
] as const

/** Same primary tabs when payment links is promoted — links live under More. */
export const NATIVE_PRIMARY_ORDER_WITH_PAYMENT_LINKS = NATIVE_PRIMARY_ORDER

export function splitNativeBottomNav(
  items: DashboardNavItem[],
  primaryOrder: readonly string[] = NATIVE_PRIMARY_ORDER
) {
  const primary: DashboardNavItem[] = []
  const primaryHrefs = new Set<string>()

  for (const name of primaryOrder) {
    const match = items.find((item) => item.name === name)
    if (match) {
      primary.push(match)
      primaryHrefs.add(match.href)
    }
  }

  const more = items.filter((item) => !primaryHrefs.has(item.href))
  return { primary, more }
}

export function nativeNavShortLabel(name: string): string {
  const labels: Record<string, string> = {
    Dashboard: 'Home',
    Inventory: 'Stock',
    Receipts: 'Sales',
    Departments: 'Teams',
    Analytics: 'Insights',
    'Payment links': 'Links',
    'Stock loans': 'Loans',
    'Customer buybacks': 'Buybacks',
    'Activity Logs': 'Activity',
    'Multi-Store Sync': 'Sync',
    'Help center': 'Help',
  }
  return labels[name] ?? (name.length > 10 ? name.slice(0, 9) + '…' : name)
}

export function isDashboardNavActive(currentPath: string, href: string, visibleHrefs: string[]) {
  if (isDepartmentsNavHref(href) && isDepartmentsAreaPath(currentPath)) {
    return true
  }

  const hasLongerMatch = visibleHrefs.some((otherHref) => {
    if (otherHref === href) return false
    if (otherHref.length <= href.length) return false
    return currentPath.startsWith(otherHref)
  })
  if (hasLongerMatch) return false
  if (currentPath === href) return true
  if (href !== '/dashboard' && currentPath.startsWith(`${href}/`)) return true
  return false
}
