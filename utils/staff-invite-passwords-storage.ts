/** Temporary staff credentials shown to admins until first password change. */
export type StaffInvitePasswordEntry = {
  id: string
  staffId?: string
  storeId?: string
  staffEmail: string
  staffName: string
  password: string
  departmentId: string
  departmentName: string
  createdAt: number
}

const STORAGE_PREFIX = 'storvv-staff-invite-passwords'

export function staffInvitePasswordsStorageKey(ownerUid: string): string {
  return `${STORAGE_PREFIX}-${ownerUid}`
}

export function loadStaffInvitePasswords(ownerUid: string): StaffInvitePasswordEntry[] {
  if (!import.meta.client || !ownerUid) return []

  try {
    const raw = localStorage.getItem(staffInvitePasswordsStorageKey(ownerUid))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StaffInvitePasswordEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStaffInvitePasswords(
  ownerUid: string,
  entries: StaffInvitePasswordEntry[]
): void {
  if (!import.meta.client || !ownerUid) return

  try {
    localStorage.setItem(staffInvitePasswordsStorageKey(ownerUid), JSON.stringify(entries))
  } catch {
    // Quota or private mode. Keep in-memory only for this session.
  }
}

export function clearStaffInvitePasswords(ownerUid: string): void {
  if (!import.meta.client || !ownerUid) return
  localStorage.removeItem(staffInvitePasswordsStorageKey(ownerUid))
}
