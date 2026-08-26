<template>
  <DashboardTableBadge
    :badge-class="salesLeadStatusBadgeClass(status)"
    :label="SALES_LEAD_STATUS_LABELS[status]"
  />
</template>

<script setup lang="ts">
import DashboardTableBadge from '~/components/ui/DashboardTableBadge.vue'
import type { SalesLeadStatus } from '~/types/leads'
import { SALES_LEAD_STATUS_LABELS } from '~/types/leads'
import { salesLeadStatusBadgeClass } from '~/utils/table-badge-styles'

defineProps<{
  status: SalesLeadStatus
}>()
</script>
