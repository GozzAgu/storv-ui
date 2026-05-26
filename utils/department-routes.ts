/** Store-scoped departments list (canonical). */
export function storeDepartmentsPath(storeId: string): string {
 return `/dashboard/stores/${storeId}/departments`
}

/** Department staff / settings page. */
export function departmentDetailPath(departmentId: string): string {
 return `/dashboard/departments/${departmentId}`
}

/** True when viewing the department list or a department staff page. */
export function isDepartmentsAreaPath(path: string): boolean {
 if (path.startsWith('/dashboard/departments')) return true
 return /^\/dashboard\/stores\/[^/]+\/departments(?:\/|$)/.test(path)
}

/** True when a nav href targets the departments list (store-scoped or redirect). */
export function isDepartmentsNavHref(href: string): boolean {
 return href.includes('/departments')
}

/** Resolve list URL for a store, with optional fallbacks. */
export function resolveStoreDepartmentsPath(
 storeId?: string | null,
 ...fallbacks: Array<string | null | undefined>
): string | null {
 const id = storeId || fallbacks.find((v) => v) || null
 return id ? storeDepartmentsPath(id) : null
}
