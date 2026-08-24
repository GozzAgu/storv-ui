export const STAFF_CREATION_IN_PROGRESS_KEY = 'staff_creation_in_progress'

export function isStaffCreationInProgress(): boolean {
  if (!import.meta.client) return false
  return sessionStorage.getItem(STAFF_CREATION_IN_PROGRESS_KEY) === 'true'
}

export function setStaffCreationInProgress(active: boolean): void {
  if (!import.meta.client) return
  if (active) {
    sessionStorage.setItem(STAFF_CREATION_IN_PROGRESS_KEY, 'true')
  } else {
    sessionStorage.removeItem(STAFF_CREATION_IN_PROGRESS_KEY)
  }
}
