export interface CategoryAccessFields {
  allowedDepartments?: string[]
  /** Auth UIDs the owner let in on top of the chosen departments. */
  allowedStaff?: string[]
}

export interface CategoryAccessSubject {
  departmentId?: string | null
  authUid?: string | null
}

/**
 * A category is open to every staff member until the owner picks departments for it. Once
 * restricted, staff in those departments get in, plus anyone the owner named individually.
 * People on their own never restrict a category.
 */
export function canStaffAccessCategory(
  folder: CategoryAccessFields,
  subject: CategoryAccessSubject
): boolean {
  const departments = folder.allowedDepartments ?? []
  if (departments.length === 0) return true
  if (subject.departmentId && departments.includes(subject.departmentId)) return true
  return !!subject.authUid && (folder.allowedStaff ?? []).includes(subject.authUid)
}

/** Split a store's categories into the ones this staff member can open and the rest. */
export function splitCategoriesByAccess<T extends CategoryAccessFields>(
  folders: T[],
  subject: CategoryAccessSubject
): { accessible: T[]; locked: T[] } {
  const accessible: T[] = []
  const locked: T[] = []
  for (const folder of folders) {
    ;(canStaffAccessCategory(folder, subject) ? accessible : locked).push(folder)
  }
  return { accessible, locked }
}
