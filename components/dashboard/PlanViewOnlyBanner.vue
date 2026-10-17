<template>
  <div v-if="reason" class="s-c s-banner s-banner--warning" role="status">
    <div class="s-banner__lead">
      <Eye class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>{{ PLAN_VIEW_ONLY_TITLE }}.</strong> {{ planViewOnlyMessage(reason, isOwner) }}
      </p>
    </div>
    <div v-if="isOwner" class="s-banner__actions">
      <SButton size="sm" to="/dashboard/settings?upgrade=1">See plans</SButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Eye } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import { useUserStore } from '~/stores/user'
import { usePlanViewOnly } from '~/composables/usePlanViewOnly'
import { PLAN_VIEW_ONLY_TITLE, planViewOnlyMessage } from '~/utils/plan-access'

const userStore = useUserStore()
const { reason } = usePlanViewOnly()
const isOwner = computed(() => userStore.isSuperAdmin)
</script>
