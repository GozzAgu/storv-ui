export const INVITE_ACCESS_STORAGE_KEY = 'storvv_invite_v1'

export function readInviteAccessFromStorage(): boolean {
  if (!import.meta.client) return false
  try {
    return localStorage.getItem(INVITE_ACCESS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStorage(granted: boolean) {
  if (!import.meta.client) return
  try {
    if (granted) {
      localStorage.setItem(INVITE_ACCESS_STORAGE_KEY, '1')
    } else {
      localStorage.removeItem(INVITE_ACCESS_STORAGE_KEY)
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function useInviteAccess() {
  const hasInviteAccess = useState<boolean>('invite-access-granted', () => readInviteAccessFromStorage())

  function syncFromStorage() {
    hasInviteAccess.value = readInviteAccessFromStorage()
  }

  function grantAccess() {
    writeStorage(true)
    hasInviteAccess.value = true
  }

  function revokeAccess() {
    writeStorage(false)
    hasInviteAccess.value = false
  }

  return { hasInviteAccess, syncFromStorage, grantAccess, revokeAccess }
}
