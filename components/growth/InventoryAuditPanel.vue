<template>
  <DashboardSettingsPanel
    title="Recent price & name changes"
    subtitle="Who changed inventory pricing on this branch (last 30 days on all plans)."
    compact
  >
    <p v-if="loading" class="text-xs text-gray-500">Loading…</p>
    <ul v-else-if="logs.length" class="divide-y divide-gray-100 dark:divide-white/[0.06]">
      <li v-for="log in logs" :key="log.id" class="py-2 text-[11px]">
        <p class="font-medium text-gray-900 dark:text-gray-100">
          {{ log.itemName }}
          <span class="font-normal text-gray-500">· {{ inventoryAuditFieldLabel(log.field) }}</span>
        </p>
        <p class="mt-0.5 text-gray-500 dark:text-gray-400">
          {{ log.userDisplayName }} · {{ formatWhen(log.createdAt) }}
        </p>
        <p v-if="log.previousValue != null || log.newValue != null" class="mt-0.5 text-gray-600 dark:text-gray-300">
          {{ log.previousValue ?? '—' }} → {{ log.newValue ?? '—' }}
        </p>
      </li>
    </ul>
    <p v-else class="text-xs text-gray-500 dark:text-gray-400">No tracked changes yet.</p>
  </DashboardSettingsPanel>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardSettingsPanel from '~/components/dashboard/DashboardSettingsPanel.vue'
import {
  fetchInventoryAuditLogs,
  inventoryAuditFieldLabel,
} from '~/composables/useInventoryAuditLog'
import type { InventoryAuditLog } from '~/types/growth'

const logs = ref<InventoryAuditLog[]>([])
const loading = ref(true)

function formatWhen(date: Date) {
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  try {
    logs.value = await fetchInventoryAuditLogs(20)
  } finally {
    loading.value = false
  }
})
</script>
