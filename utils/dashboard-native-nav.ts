export type DashboardNavItem = {
 name: string
 href: string
 icon: unknown
 iconSolid: unknown
}

const NATIVE_PRIMARY_ORDER = ['Dashboard', 'Inventory', 'Receipts', 'Analytics'] as const

export function splitNativeBottomNav(items: DashboardNavItem[]) {
 const primary: DashboardNavItem[] = []
 const primaryHrefs = new Set<string>()

 for (const name of NATIVE_PRIMARY_ORDER) {
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
 Analytics: 'Insights',
 'Stock loans': 'Loans',
 'Activity Logs': 'Activity',
 'Multi-Store Sync': 'Sync',
 'Help center': 'Help',
 }
 return labels[name] ?? (name.length > 10 ? name.slice(0, 9) + '…' : name)
}

export function isDashboardNavActive(currentPath: string, href: string, visibleHrefs: string[]) {
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
