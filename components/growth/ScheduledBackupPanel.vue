<template>
  <SCard
    title="Backup reminders"
    description="Storvv stores your data securely. Scheduled exports are your offline safety copy."
  >
    <div class="s-settings__rows">
      <div class="s-settings__row">
        <SCheckbox
          :model-value="enabled"
          variant="switch"
          label="In-app reminders"
          description="Get nudged to export Excel backups on a schedule."
          @update:model-value="onEnabledChange"
        />
      </div>
      <div v-if="enabled" class="s-settings__row">
        <div class="s-settings__row-text">
          <p class="s-settings__row-label" :id="frequencyLabelId">Frequency</p>
        </div>
        <div class="s-settings__control">
          <SSelect
            v-model="frequency"
            :options="frequencyOptions"
            :aria-labelledby="frequencyLabelId"
            @update:model-value="save"
          />
        </div>
      </div>
    </div>
    <p v-if="dueReminder" class="s-notice s-settings__notice">
      Time for a backup. Export one from Data export. Last export: {{ lastExportLabel }}.
    </p>
  </SCard>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SSelect from '~/components/s/SSelect.vue'
import type { BackupPreferences } from '~/types/growth'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useUser } from '~/composables/useUser'

const userStore = useUserStore()
const authStore = useAuthStore()
const { updateUserDocument } = useUser()

const enabled = ref(false)
const frequency = ref<BackupPreferences['frequency']>('weekly')
const frequencyLabelId = `backup-frequency-${useId()}`
const frequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

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
