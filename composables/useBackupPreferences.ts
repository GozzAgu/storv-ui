import type { BackupPreferences } from '~/types/growth'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useUser } from '~/composables/useUser'

export function useBackupPreferences() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { updateUserDocument } = useUser()

  async function markBackupExported() {
    const uid = authStore.currentUser?.uid
    if (!uid) return
    const backupPreferences: BackupPreferences = {
      ...(userStore.userData?.backupPreferences ?? { enabled: false, frequency: 'monthly' }),
      lastExportAt: new Date().toISOString(),
    }
    await updateUserDocument(uid, { backupPreferences })
    if (userStore.userData) userStore.userData.backupPreferences = backupPreferences
  }

  return { markBackupExported }
}
