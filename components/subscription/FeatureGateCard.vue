<template>
  <div v-if="userStore.isSuperAdmin" :class="rootClass">
    <SparklesIcon
      class="mx-auto mb-3 h-8 w-8 text-amber-500/80 dark:text-amber-400/70"
      stroke-width="1.5"
    />
    <p :class="['dash-state-card__title', titleClass, '!text-sm']">{{ resolvedTitle }}</p>
    <p :class="['dash-state-card__desc', descClass]">{{ resolvedDescription }}</p>
    <ul v-if="tips.length" class="mx-auto mt-3 max-w-md space-y-1 text-left text-[11px] text-gray-600 dark:text-gray-400">
      <li v-for="(tip, index) in tips" :key="index" class="flex gap-2">
        <span aria-hidden="true">•</span>
        <span>{{ tip }}</span>
      </li>
    </ul>
    <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <NuxtLink v-if="primaryHref" :to="primaryHref" :class="primaryBtnClass">
        {{ primaryLabel }}
      </NuxtLink>
      <NuxtLink
        v-if="secondaryHref"
        :to="secondaryHref"
        class="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        {{ secondaryLabel }}
      </NuxtLink>
      <slot name="actions" />
    </div>
  </div>
  <div v-else :class="staffUnavailableClass">
    <p :class="['dash-state-card__title', titleClass, '!text-sm']">{{ staffTitle }}</p>
    <p :class="['dash-state-card__desc', descClass]">{{ staffDescription }}</p>
  </div>
</template>

<script setup lang="ts">
import { SparklesIcon } from '~/utils/app-icons'
import { useUserStore } from '~/stores/user'
import {
  getMinimumPlanForFeature,
  getPlanDisplayName,
  type SubscriptionFeature,
} from '~/types/subscription'

const props = withDefaults(
  defineProps<{
    gate?: 'plan' | 'role' | 'custom'
    feature?: SubscriptionFeature
    title?: string
    description?: string
    tips?: string[]
    primaryLabel?: string
    primaryHref?: string
    secondaryLabel?: string
    secondaryHref?: string
    staffTitle?: string
    staffDescription?: string
    extraClass?: string
    titleClass?: string
    descClass?: string
  }>(),
  {
    gate: 'plan',
    tips: () => [],
    primaryLabel: 'View plans',
    primaryHref: '/dashboard/settings?upgrade=1',
    secondaryLabel: 'Learn more',
    secondaryHref: '/dashboard/help#settings-subscription',
    staffTitle: 'Feature unavailable',
    staffDescription: 'This feature is not enabled for your workspace.',
  }
)

const userStore = useUserStore()

const requiredPlan = computed(() =>
  props.feature ? getMinimumPlanForFeature(props.feature) : null
)
const requiredPlanLabel = computed(() =>
  requiredPlan.value ? getPlanDisplayName(requiredPlan.value) : 'a higher plan'
)

const resolvedTitle = computed(
  () => props.title ?? `${requiredPlanLabel.value} feature`
)

const resolvedDescription = computed(() => {
  if (props.description) return props.description
  if (props.gate === 'role') {
    return 'Your role does not include access to this screen.'
  }
  return `This screen is included on ${requiredPlanLabel.value}. Upgrade to unlock it for your team.`
})

const rootClass = computed(() => [
  'subscription-feature-gate dash-state-card rounded-xl border border-amber-200/60 bg-amber-50/40 px-6 py-8 text-center dark:border-amber-900/35 dark:bg-amber-950/20',
  props.extraClass,
])

const staffUnavailableClass = computed(() => [
  'dash-state-card rounded-xl border border-gray-200/60 bg-gray-50/40 px-6 py-8 text-center dark:border-gray-800/35 dark:bg-gray-950/20',
  props.extraClass,
])

const primaryBtnClass = 'btn-primary btn-primary-sm'
</script>
