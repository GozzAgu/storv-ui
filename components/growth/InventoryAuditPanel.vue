<template>
  <SCard
    title="Recent price & name changes"
    description="Who changed inventory pricing on this branch in the last 30 days."
    :flush="!loading && logs.length > 0"
  >
    <SSkeleton v-if="loading" :lines="3" />
    <ul v-else-if="logs.length" class="s-list">
      <li v-for="log in logs" :key="log.id" class="s-list__item">
        <div class="s-list__main">
          <p class="s-list__primary">
            {{ log.itemName }} · {{ inventoryAuditFieldLabel(log.field) }}
          </p>
          <p class="s-list__secondary">
            {{ log.userDisplayName }} · {{ formatWhen(log.createdAt) }}
          </p>
        </div>
        <p v-if="log.previousValue != null || log.newValue != null" class="s-list__end s-settings__change">
          {{ log.previousValue ?? EMPTY_CELL }}
          <ArrowRight :size="14" :stroke-width="2" aria-hidden="true" />
          <span class="ds-sr-only">changed to</span>
          {{ log.newValue ?? EMPTY_CELL }}
        </p>
      </li>
    </ul>
    <p v-else class="s-settings__muted">No tracked changes yet.</p>
  </SCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight } from '@lucide/vue'
import SCard from '~/components/s/SCard.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import {
  fetchInventoryAuditLogs,
  inventoryAuditFieldLabel,
} from '~/composables/useInventoryAuditLog'
import type { InventoryAuditLog } from '~/types/growth'
import { EMPTY_CELL } from '~/utils/ui-empty'

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
