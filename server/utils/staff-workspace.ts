/**
 * Owner uid for a hierarchical staff doc:
 * users/{ownerId}/stores/{storeId}/departments/{deptId}/staff/{staffId}.
 * Returns null for any other shape (e.g. the legacy top-level `staff` collection).
 */
export function resolveStaffWorkspaceOwnerId(staffDocPath: string): string | null {
  const parts = staffDocPath.split('/')
  if (
    parts.length !== 8 ||
    parts[0] !== 'users' ||
    parts[2] !== 'stores' ||
    parts[4] !== 'departments' ||
    parts[6] !== 'staff' ||
    !parts[1]
  ) {
    return null
  }
  return parts[1]
}
