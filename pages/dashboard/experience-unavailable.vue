<template>
  <div :class="pageClass">
    <DashboardPageHeader class="dash-page-header--unified" :ios-context-only="isCapacitorIos">
      <template #title>
        <h1 :class="pageTitleClass">{{ pageTitle }}</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">{{ pageDescription }}</p>
      </template>
    </DashboardPageHeader>

    <div :class="pageStackClass">
      <FeatureGateCard
        v-if="planFeature"
        :feature="planFeature"
        :title="planGateTitle"
        :description="planGateDescription"
        :tips="planGateTips"
        primary-label="View plans"
        primary-href="/dashboard/settings?upgrade=1"
      />
      <DashboardTableEmptyState
        v-else
        :icon="LockClosedIcon"
        title="This feature is not enabled"
        :description="emptyDescription"
        :tips="emptyTips"
        :fill="false"
        extra-class="py-12"
      >
        <Button
          v-if="canSelfUnlock"
          size="sm"
          @click="navigateTo('/dashboard/settings#advanced-features')"
        >
          Turn on in Settings
        </Button>
        <Button variant="outline" size="sm" @click="navigateTo('/dashboard')">
          Back to dashboard
        </Button>
      </DashboardTableEmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LockClosedIcon } from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import FeatureGateCard from '~/components/subscription/FeatureGateCard.vue'
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

const {
  pageClass,
  pageStackClass,
  pageTitleClass,
  descriptionClass,
} = useDashboardSettingsChrome()

const { isCapacitorIos } = useIsCapacitorIos()
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

const planGateTitle = computed(() => {
  if (!planFeature.value) return ''
  const plan = getMinimumPlanForFeature(planFeature.value)
  return plan ? `${getPlanDisplayName(plan)} feature` : 'Upgrade required'
})

const planGateDescription = computed(() => {
  if (!planFeature.value) return ''
  const plan = getMinimumPlanForFeature(planFeature.value)
  if (!plan) return 'Upgrade your subscription to open this screen.'
  return `${getPlanDisplayName(plan)} includes this feature. Upgrade in Settings to unlock it for your team.`
})

const planGateTips = computed(() => {
  if (!planFeature.value) return []
  return ['Compare plans in Settings → Account', 'Your data stays safe if you upgrade later']
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
</script>
