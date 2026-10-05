<template>
  <SCard>
    <SEmptyState v-if="userStore.isSuperAdmin" :title="resolvedTitle" :description="resolvedDescription">
      <template #icon><Sparkles :size="24" :stroke-width="1.75" /></template>
      <template #actions>
        <SButton variant="primary" :to="dashPath('/settings?upgrade=1')">View plans</SButton>
        <SButton variant="ghost" :to="dashPath('/help#settings-subscription')">Compare plans</SButton>
      </template>
    </SEmptyState>
    <SEmptyState v-else title="Not available on this workspace" :description="staffDescription">
      <template #icon><Lock :size="24" :stroke-width="1.75" /></template>
    </SEmptyState>
  </SCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Lock, Sparkles } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import { useUserStore } from '~/stores/user'
import {
  getMinimumPlanForFeature,
  getPlanDisplayName,
  type SubscriptionFeature,
} from '~/types/subscription'

const props = withDefaults(
  defineProps<{
    feature: SubscriptionFeature
    /** What the feature does, shown under the plan name. */
    description?: string
    staffDescription?: string
  }>(),
  {
    description: undefined,
    staffDescription: "Ask the account owner if you need this. It isn't turned on for your workspace.",
  }
)

const userStore = useUserStore()
const { dashPath } = useDashboardPaths()

const planLabel = computed(() => getPlanDisplayName(getMinimumPlanForFeature(props.feature)))

const resolvedTitle = computed(() => `Available on ${planLabel.value}`)

const resolvedDescription = computed(
  () => props.description ?? `Upgrade to ${planLabel.value} to unlock this for your team.`
)
</script>
