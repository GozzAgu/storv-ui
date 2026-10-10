import type { DashboardNavIconKey } from '~/utils/dashboard-nav-icons'
import { isDepartmentsAreaPath, isDepartmentsNavHref } from '~/utils/department-routes'

/**
 * Information architecture for the web shell (sidebar, bottom bar).
 * Routes and access rules still come from DASHBOARD_NAV_DEFINITIONS; this file only decides
 * labels and grouping. See docs/REDESIGN_AUDIT_AND_IA.md.
 */

export type ShellNavSourceItem = {
  name: string
  href: string
  iconKey: DashboardNavIconKey
}

export type ShellNavItem = ShellNavSourceItem & { label: string }

export type ShellNavSection = {
  id: string
  label: string | null
  items: ShellNavItem[]
}

export const SHELL_CUSTOMERS_NAV_NAME = 'Customers'
export const SHELL_BRANCHES_NAV_NAME = 'Branches'

const SHELL_LABELS: Record<string, string> = {
  Dashboard: 'Overview',
  Analytics: 'Reports',
  Departments: 'Team',
  'Multi-Store Sync': 'Transfers',
  'Customer buybacks': 'Trade-ins',
  Partners: 'Trade with shops',
  'Activity Logs': 'Activity',
  'Help center': 'Help',
}

const SHELL_SECTIONS: ReadonlyArray<{ id: string; label: string | null; items: readonly string[] }> = [
  {
    id: 'primary',
    label: null,
    items: ['Dashboard', 'Inventory', 'Sales', SHELL_CUSTOMERS_NAV_NAME, 'Analytics'],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      'Multi-Store Sync',
      'Stock loans',
      'Customer buybacks',
      'Sales leads',
      'Storefront',
      'Payment links',
      'Awaiting payments',
      'Partners',
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    items: ['Departments', SHELL_BRANCHES_NAV_NAME, 'Activity Logs'],
  },
]

const SHELL_FOOTER = ['Help center', 'Settings'] as const

/** Phone bottom bar destinations; everything else lives behind "More". */
export const SHELL_BOTTOM_NAV = ['Dashboard', 'Inventory', 'Sales', SHELL_CUSTOMERS_NAV_NAME] as const

const ROUTE_TITLES: Record<string, string> = {
  branches: 'Branches',
  customers: 'Customers',
  notifications: 'Notifications',
  payments: 'Payments',
  returns: 'Returns',
  'storefront-inquiries': 'Storefront inquiries',
  'experience-unavailable': 'Unavailable',
  stores: 'Team',
}

/** Title for dashboard routes that are not nav destinations. `subPath` is relative to the dashboard base. */
export function shellRouteTitle(subPath: string): string {
  const segment = subPath.replace(/^\/+/, '').split('/')[0] ?? ''
  return ROUTE_TITLES[segment] ?? ''
}

export function shellNavLabel(name: string): string {
  return SHELL_LABELS[name] ?? name
}

function withLabel(item: ShellNavSourceItem): ShellNavItem {
  return { ...item, label: shellNavLabel(item.name) }
}

function pick(items: ShellNavSourceItem[], names: readonly string[]): ShellNavItem[] {
  return names
    .map((name) => items.find((item) => item.name === name))
    .filter((item): item is ShellNavSourceItem => !!item)
    .map(withLabel)
}

export function buildShellNavSections(items: ShellNavSourceItem[]): ShellNavSection[] {
  return SHELL_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    items: pick(items, section.items),
  })).filter((section) => section.items.length > 0)
}

export function buildShellFooterNav(items: ShellNavSourceItem[]): ShellNavItem[] {
  return pick(items, SHELL_FOOTER)
}

export function buildShellBottomNav(items: ShellNavSourceItem[]): ShellNavItem[] {
  return pick(items, SHELL_BOTTOM_NAV)
}

/** Everything the phone bottom bar doesn't show, in sidebar order, for its expanded "More" grid. */
export function buildShellMoreNav(items: ShellNavSourceItem[]): ShellNavItem[] {
  const names = [...SHELL_SECTIONS.flatMap((section) => section.items), ...SHELL_FOOTER].filter(
    (name) => !(SHELL_BOTTOM_NAV as readonly string[]).includes(name)
  )
  return pick(items, names)
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
