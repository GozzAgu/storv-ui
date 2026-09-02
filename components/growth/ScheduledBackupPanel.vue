<template>
  <DashboardSettingsPanel
    title="Backup reminders"
    subtitle="Get reminded to export Excel backups on a schedule."
    compact
  >
    <div class="space-y-0">
      <div class="dash-setting-row">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100">In-app reminders</p>
          <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Get nudged to export Excel backups on a schedule.
          </p>
        </div>
        <Switch
          :model-value="enabled"
          aria-label="Backup reminders"
          @update:model-value="onEnabledChange"
        />
      </div>
      <div v-if="enabled" class="dash-setting-row">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Frequency</p>
        </div>
        <select v-model="frequency" :class="[APP_FIELD_CLASS, 'min-w-[8rem] !w-auto']" @change="save">
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <p
        v-if="dueReminder"
        class="dash-setting-row dash-setting-row--note rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100"
      >
        Reminder: export a backup from Data export below. Last export:
        {{ lastExportLabel }}.
      </p>
      <p class="dash-setting-row dash-setting-row--note text-[10px] text-gray-500 dark:text-gray-400">
        Storvv stores your data securely; scheduled exports are your offline safety copy.
      </p>
    </div>
  </DashboardSettingsPanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DashboardSettingsPanel from '~/components/dashboard/DashboardSettingsPanel.vue'
import Switch from '~/components/ui/Switch.vue'
import type { BackupPreferences } from '~/types/growth'
import { APP_FIELD_CLASS } from '~/utils/app-chrome'
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

function onEnabledChange(checked: boolean) {
  enabled.value = checked
  void save()
}

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
