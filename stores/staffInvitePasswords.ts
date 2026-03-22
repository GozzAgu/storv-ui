import { defineStore } from 'pinia'
import { ref } from 'vue'

/** One-time staff password shown after create (session-only; not persisted to disk). */
export type StaffInvitePasswordEntry = {
  id: string
  staffEmail: string
  staffName: string
  password: string
  departmentId: string
  departmentName: string
  createdAt: number
}

const MAX_ENTRIES = 30

export const useStaffInvitePasswordsStore = defineStore('staffInvitePasswords', () => {
  const entries = ref<StaffInvitePasswordEntry[]>([])

  function recordInvite(
    payload: Omit<StaffInvitePasswordEntry, 'id' | 'createdAt'>
  ) {
    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    entries.value.unshift({
      ...payload,
      id,
      createdAt: Date.now(),
    })
    if (entries.value.length > MAX_ENTRIES) {
      entries.value = entries.value.slice(0, MAX_ENTRIES)
    }
  }

  function removeInvite(id: string) {
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  function clearDepartment(departmentId: string) {
    entries.value = entries.value.filter((e) => e.departmentId !== departmentId)
  }

  function clearAll() {
    entries.value = []
  }

  return {
    entries,
    recordInvite,
    removeInvite,
    clearDepartment,
    clearAll,
  }
})
