import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  loadStaffInvitePasswords,
  saveStaffInvitePasswords,
  type StaffInvitePasswordEntry,
} from '~/utils/staff-invite-passwords-storage'

export type { StaffInvitePasswordEntry }

const MAX_ENTRIES = 30

export const useStaffInvitePasswordsStore = defineStore('staffInvitePasswords', () => {
  const entries = ref<StaffInvitePasswordEntry[]>([])
  const hydratedOwnerUid = ref<string | null>(null)

  function resolveOwnerUid(): string | null {
    const authStore = useAuthStore()
    return authStore.currentUser?.uid ?? null
  }

  function persist() {
    const uid = resolveOwnerUid()
    if (!uid) return
    saveStaffInvitePasswords(uid, entries.value)
  }

  /** Load saved invites for the signed-in super admin (browser-local). */
  function hydrate(force = false) {
    const uid = resolveOwnerUid()
    if (!uid) return
    if (!force && hydratedOwnerUid.value === uid) return

    hydratedOwnerUid.value = uid
    entries.value = loadStaffInvitePasswords(uid)
  }

  function recordInvite(payload: Omit<StaffInvitePasswordEntry, 'id' | 'createdAt'>) {
    hydrate()

    const normalizedEmail = payload.staffEmail.trim().toLowerCase()
    const existingIdx = entries.value.findIndex(
      (entry) =>
        entry.staffEmail === normalizedEmail &&
        entry.departmentId === payload.departmentId &&
        (payload.staffId ? entry.staffId === payload.staffId : true)
    )

    const nextEntry: StaffInvitePasswordEntry = {
      ...payload,
      staffEmail: normalizedEmail,
      id:
        existingIdx >= 0
          ? entries.value[existingIdx]!.id
          : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: existingIdx >= 0 ? entries.value[existingIdx]!.createdAt : Date.now(),
    }

    if (existingIdx >= 0) {
      entries.value.splice(existingIdx, 1, nextEntry)
    } else {
      entries.value.unshift(nextEntry)
    }

    if (entries.value.length > MAX_ENTRIES) {
      entries.value = entries.value.slice(0, MAX_ENTRIES)
    }

    persist()
  }

  function removeInvite(id: string) {
    hydrate()
    entries.value = entries.value.filter((entry) => entry.id !== id)
    persist()
  }

  function clearDepartment(departmentId: string) {
    hydrate()
    entries.value = entries.value.filter((entry) => entry.departmentId !== departmentId)
    persist()
  }

  function clearAll() {
    entries.value = []
    persist()
  }

  /**
   * Drop invites once staff has completed first sign-in password change.
   * Keeps entries when staff is unknown (not loaded yet) or still mustChangePassword.
   */
  function pruneForStaff(
    staffList: Array<{
      id?: string
      email?: string
      mustChangePassword?: boolean
    }>
  ) {
    hydrate()
    if (staffList.length === 0) return

    const before = entries.value.length
    entries.value = entries.value.filter((entry) => {
      const member = staffList.find((staff) => matchesStaffEntry(entry, staff))
      if (!member) return true
      return member.mustChangePassword === true
    })

    if (entries.value.length !== before) {
      persist()
    }
  }

  function matchesStaffEntry(
    entry: StaffInvitePasswordEntry,
    staff: { id?: string; email?: string }
  ): boolean {
    if (entry.staffId && staff.id && entry.staffId === staff.id) return true
    const email = staff.email?.trim().toLowerCase()
    return Boolean(email && email === entry.staffEmail)
  }

  return {
    entries,
    hydrate,
    recordInvite,
    removeInvite,
    clearDepartment,
    clearAll,
    pruneForStaff,
  }
})
