<template>
  <div class="ds-root s-c s-page">
    <SPageHeader :title="pageTitle">
      <template #description>{{ pageDescription }}</template>
    </SPageHeader>

    <PlanGate v-if="planFeature" :feature="planFeature" :description="planGateDescription" />
    <SCard v-else>
      <SEmptyState title="This feature is turned off" :description="emptyHelp">
        <template #icon><Lock :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton
            v-if="canSelfUnlock"
            variant="primary"
            :to="dashPath('/dashboard/settings#advanced-features')"
          >
            Turn on in Settings
          </SButton>
          <SButton :to="dashPath('/dashboard')">Back to dashboard</SButton>
        </template>
      </SEmptyState>
    </SCard>
  </div>
</template>

<script setup lang="ts">
import { Lock } from '@lucide/vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SButton from '~/components/s/SButton.vue'
import {
  BUSINESS_CAPABILITIES,
  BUSINESS_CAPABILITY_LABELS,
  type BusinessCapability,
} from '~/types/business-experience'
import {
  getMinimumPlanForFeature,
  getPlanDisplayName,
  type SubscriptionFeature,
} from '~/types/subscription'
import { SOLO_PROGRESSIVE_UNLOCK_OPTIONS } from '~/utils/business-experience-settings'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({
  title: 'Feature not available - Storvv',
})

const userStore = useUserStore()
const { isSoloExperience } = useBusinessCapabilities()
const route = useRoute()

function parseCapabilityQuery(raw: unknown): BusinessCapability | null {
  if (typeof raw !== 'string') return null
  return BUSINESS_CAPABILITIES.includes(raw as BusinessCapability)
    ? (raw as BusinessCapability)
    : null
}

function parseFeatureQuery(raw: unknown): SubscriptionFeature | null {
  const valid: SubscriptionFeature[] = [
    'analytics',
    'activity_logs',
    'sales_leads',
    'multi_store_sync',
    'seller_loans',
    'customer_balance',
    'payment_links',
  ]
  if (typeof raw !== 'string') return null
  return valid.includes(raw as SubscriptionFeature) ? (raw as SubscriptionFeature) : null
}

const capability = computed(() => parseCapabilityQuery(route.query.capability))
const planFeature = computed(() => parseFeatureQuery(route.query.feature))

const unlockOption = computed(() =>
  capability.value
    ? SOLO_PROGRESSIVE_UNLOCK_OPTIONS.find((option) => option.capability === capability.value)
    : undefined
)

const canSelfUnlock = computed(() => userStore.isSuperAdmin && isSoloExperience.value)

const pageTitle = computed(() =>
  planFeature.value ? 'Upgrade to unlock' : 'Feature not available'
)

const pageDescription = computed(() =>
  planFeature.value
    ? 'This screen needs a higher Storvv plan.'
    : 'This area is turned off for your current Storvv setup.'
)

const planGateDescription = computed(() => {
  if (!planFeature.value) return ''
  const plan = getMinimumPlanForFeature(planFeature.value)
  if (!plan) return 'Upgrade your subscription to open this screen.'
  return `${getPlanDisplayName(plan)} includes this feature. Upgrade in Settings to unlock it for your team.`
})

const emptyDescription = computed(() => {
  if (unlockOption.value) return unlockOption.value.description
  if (capability.value) {
    return `${BUSINESS_CAPABILITY_LABELS[capability.value]} is not enabled for this account.`
  }
  return 'The page you opened is not part of your current setup.'
})

const emptyTips = computed(() => {
  if (canSelfUnlock.value) {
    return ['Open Settings → Advanced features to turn this on when you are ready.']
  }
  if (userStore.userData?.role === 'staff') {
    return ['Ask your store administrator if you need access to this feature.']
  }
  return ['Return to the dashboard to continue with your available tools.']
})

const emptyHelp = computed(() => `${emptyDescription.value} ${emptyTips.value[0]}`)

const { dashPath } = useDashboardPaths()
</script>
