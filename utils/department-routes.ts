/** Store-scoped departments list (canonical). */
export function storeDepartmentsPath(storeId: string): string {
  return `/dashboard/stores/${storeId}/departments`
}

/** Department staff / settings page. */
export function departmentDetailPath(departmentId: string): string {
  return `/dashboard/departments/${departmentId}`
}

/** Resolve list URL for a store, with optional fallbacks. */
export function resolveStoreDepartmentsPath(
  storeId?: string | null,
  ...fallbacks: Array<string | null | undefined>
): string | null {
  const id = storeId || fallbacks.find((v) => v) || null
  return id ? storeDepartmentsPath(id) : null
}
