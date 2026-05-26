export type StaffRole = 'manager' | 'staff' | 'intern'

/** Cycle order: Manager → Staff → Intern → Manager */
export const STAFF_ROLE_CYCLE: StaffRole[] = ['manager', 'staff', 'intern']

export function normalizeStaffRole(role: string | undefined | null): StaffRole {
  if (role === 'manager' || role === 'intern') return role
  return 'staff'
}

export function getNextStaffRole(current: string | undefined | null): StaffRole {
  const role = normalizeStaffRole(current)
  const idx = STAFF_ROLE_CYCLE.indexOf(role)
  return STAFF_ROLE_CYCLE[(idx + 1) % STAFF_ROLE_CYCLE.length]!
}

export function formatStaffRoleLabel(role: StaffRole): string {
  if (role === 'intern') return 'Intern'
  if (role === 'manager') return 'Manager'
  return 'Staff'
}

export function getNextStaffRoleLabel(current: string | undefined | null): string {
  return formatStaffRoleLabel(getNextStaffRole(current))
}
