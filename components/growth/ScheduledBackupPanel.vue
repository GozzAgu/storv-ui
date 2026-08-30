<template>
  <DashboardSettingsPanel
    title="Backup reminders"
    subtitle="Get reminded to export Excel backups on a schedule."
    compact
  >
    <div class="space-y-3">
      <label class="flex items-center justify-between gap-3">
        <span class="text-xs text-gray-700 dark:text-gray-300">Email-style reminders in-app</span>
        <input v-model="enabled" type="checkbox" class="rounded border-gray-300" @change="save" />
      </label>
      <div v-if="enabled">
        <label class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">Frequency</label>
        <select
          v-model="frequency"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.03]"
          @change="save"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <p v-if="dueReminder" class="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100">
        Reminder: export a backup from Data export below. Last export:
        {{ lastExportLabel }}.
      </p>
      <p class="text-[10px] text-gray-500 dark:text-gray-400">
        Storvv stores your data securely; scheduled exports are your offline safety copy for accountants and auditors.
      </p>
    </div>
  </DashboardSettingsPanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DashboardSettingsPanel from '~/components/dashboard/DashboardSettingsPanel.vue'
import type { BackupPreferences } from '~/types/growth'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useUser } from '~/composables/useUser'

const userStore = useUserStore()
const authStore = useAuthStore()
const { updateUserDocument } = useUser()

const enabled = ref(false)
const frequency = ref<BackupPreferences['frequency']>('weekly')

watch(
  () => userStore.userData?.backupPreferences,
  (prefs) => {
    enabled.value = prefs?.enabled ?? false
    frequency.value = prefs?.frequency ?? 'weekly'
  },
  { immediate: true }
)

const lastExportLabel = computed(() => {
  const iso = userStore.userData?.backupPreferences?.lastExportAt
  if (!iso) return 'never'
  return new Date(iso).toLocaleDateString()
})

const dueReminder = computed(() => {
  if (!enabled.value) return false
  const prefs = userStore.userData?.backupPreferences
  if (!prefs?.lastExportAt) return true
  const days = (Date.now() - new Date(prefs.lastExportAt).getTime()) / (1000 * 60 * 60 * 24)
  const threshold = frequency.value === 'weekly' ? 7 : 30
  return days >= threshold
})

async function save() {
  const uid = authStore.currentUser?.uid
  if (!uid) return
  const backupPreferences: BackupPreferences = {
    enabled: enabled.value,
    frequency: frequency.value,
    lastExportAt: userStore.userData?.backupPreferences?.lastExportAt,
    lastReminderAt: new Date().toISOString(),
  }
  await updateUserDocument(uid, { backupPreferences })
  if (userStore.userData) userStore.userData.backupPreferences = backupPreferences
}
</script>
