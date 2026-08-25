<template>
  <div v-if="userStore.isSuperAdmin" :class="rootClass">
    <SparklesIcon class="mx-auto mb-3 h-8 w-8 text-amber-500/80 dark:text-amber-400/70" stroke-width="1.5" />
    <p :class="['dash-state-card__title', titleClass, '!text-sm']">
      {{ title }}
    </p>
    <p :class="['dash-state-card__desc', descClass]">
      {{ description }}
    </p>
    <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <NuxtLink :to="upgradeHref" class="btn-primary btn-primary-sm">
        View plans
      </NuxtLink>
      <NuxtLink
        v-if="helpHref"
        :to="helpHref"
        class="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        Learn more
      </NuxtLink>
    </div>
  </div>
  <div v-else :class="staffUnavailableClass">
    <p :class="['dash-state-card__title', titleClass, '!text-sm']">
      {{ staffTitle }}
    </p>
    <p :class="['dash-state-card__desc', descClass]">
      {{ staffDescription }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SparklesIcon } from '~/utils/app-icons'
import { useUserStore } from '~/stores/user'
import {
  getMinimumPlanForFeature,
  getPlanDisplayName,
  type SubscriptionFeature,
} from '~/types/subscription'

const props = withDefaults(
  defineProps<{
    feature: SubscriptionFeature
    title?: string
    description?: string
    extraClass?: string
    titleClass?: string
    descClass?: string
    helpHref?: string
  }>(),
  {
    helpHref: '/dashboard/help#settings-subscription',
  }
)

const userStore = useUserStore()

const requiredPlan = computed(() => getMinimumPlanForFeature(props.feature))
const requiredPlanLabel = computed(() =>
  requiredPlan.value ? getPlanDisplayName(requiredPlan.value) : 'a higher plan'
)

const title = computed(
  () => props.title ?? `${requiredPlanLabel.value} feature`
)

const description = computed(
  () =>
    props.description ??
    `This screen is included on ${requiredPlanLabel.value}. Upgrade to unlock it for your team.`
)

const upgradeHref = '/dashboard/settings?upgrade=1'

const staffTitle = computed(() => 'Feature unavailable')

const staffDescription = computed(() => 'This feature is not enabled for your workspace.')

const rootClass = computed(() => [
  'dash-state-card rounded-xl border border-amber-200/60 bg-amber-50/40 px-6 py-8 text-center dark:border-amber-900/35 dark:bg-amber-950/20',
  props.extraClass,
])

const staffUnavailableClass = computed(() => [
  'dash-state-card rounded-xl border border-gray-200/60 bg-gray-50/40 px-6 py-8 text-center dark:border-gray-800/35 dark:bg-gray-950/20',
  props.extraClass,
])
</script>
