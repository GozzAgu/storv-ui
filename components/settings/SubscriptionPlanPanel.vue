<template>
  <div class="subscription-plan-panel space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Your plan
        </p>
        <p class="mt-0.5 text-base font-semibold text-gray-900 dark:text-gray-100">
          {{ currentSubscriptionLabel }}
        </p>
        <p v-if="billingSummary" class="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
          {{ billingSummary }}
        </p>
        <p
          v-if="subscriptionRenewalLabel"
          class="mt-1.5 text-[12px] leading-snug text-gray-600 dark:text-gray-300"
        >
          {{ subscriptionRenewalLabel }}
        </p>
      </div>
      <span
        class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
        :class="statusBadgeClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div
      v-if="changePlanOptions.length > 0"
      class="space-y-3 border-t border-gray-100 pt-5 dark:border-white/[0.06]"
    >
      <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Switch plan</p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="min-w-0 flex-1">
          <label :class="labelClass">Plan</label>
          <select
            :model-value="selectedUpgradePlan"
            :disabled="disabled || isUpgrading"
            :class="inputClass(!disabled && !isUpgrading)"
            @change="
              emit(
                'update:selectedUpgradePlan',
                ($event.target as HTMLSelectElement).value as SubscriptionPlan | ''
              )
            "
          >
            <option value="" disabled>Select a plan</option>
            <option v-for="plan in changePlanOptions" :key="plan.id" :value="plan.id">
              {{ planOptionLabel(plan) }}
            </option>
          </select>
        </div>
        <div class="min-w-0 flex-1">
          <label :class="labelClass">Billing</label>
          <select
            :model-value="selectedBillingCycle"
            :disabled="disabled || isUpgrading"
            :class="inputClass(!disabled && !isUpgrading)"
            @change="emit('update:selectedBillingCycle', ($event.target as HTMLSelectElement).value as SubscriptionBillingCycle)"
          >
            <option v-for="cycle in SUBSCRIPTION_BILLING_CYCLES" :key="cycle" :value="cycle">
              {{ BILLING_CYCLE_LABELS[cycle] }}
            </option>
          </select>
        </div>
        <Button
          variant="neutral"
          size="sm"
          :extra-class="headerTextBtnClass"
          :disabled="disabled || !selectedUpgradePlan || isUpgrading"
          @click="emit('upgrade')"
        >
          {{ isUpgrading ? 'Redirecting…' : changePlanButtonLabel }}
        </Button>
      </div>
      <p v-if="upgradePricePreview" class="text-[12px] font-medium text-gray-700 dark:text-gray-300">
        {{ upgradePricePreview }}
      </p>
      <p v-else-if="pricingLoading" class="text-[11px] text-gray-500 dark:text-gray-400">
        Loading price…
      </p>
    </div>

    <div
      v-if="canCancel"
      class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-4 dark:border-white/[0.06]"
    >
      <Button
        variant="secondary"
        size="sm"
        :extra-class="headerTextBtnClass"
        :disabled="isCanceling || isUpgrading"
        @click="emit('cancel')"
      >
        {{ isCanceling ? 'Canceling…' : 'Cancel auto-renew' }}
      </Button>
      <span class="text-[11px] text-gray-500 dark:text-gray-400">
        Keep this plan until the period ends, then move to Micro.
      </span>
    </div>

    <details class="group text-[11px] text-gray-500 dark:text-gray-400">
      <summary class="cursor-pointer list-none font-medium text-gray-600 dark:text-gray-400">
        <span class="inline-block transition group-open:rotate-90">›</span> Compare plans
      </summary>
      <ul class="mt-2 space-y-2 pl-3">
        <li v-for="(plan, id) in SUBSCRIPTION_FEATURE_SUMMARY" :key="id">
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ SUBSCRIPTION_PLANS.find((p) => p.id === id)?.name }}
          </span>
          <ul class="mt-0.5 list-inside list-disc">
            <li v-for="(line, i) in plan" :key="i">{{ line }}</li>
          </ul>
        </li>
      </ul>
    </details>

    <div
      v-if="showQaPlanSwitcher"
      class="rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-3 dark:border-amber-500/25 dark:bg-amber-500/10"
    >
      <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
        QA plan switcher
      </p>
      <p class="mt-1 text-[10px] leading-relaxed text-amber-900/80 dark:text-amber-100/80">
        Demo only. Jump between Micro, Medium, and Enterprise without Paystack.
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <Button
          v-for="plan in SUBSCRIPTION_PLANS"
          :key="plan.id"
          variant="secondary"
          size="sm"
          :extra-class="headerTextBtnClass"
          :disabled="qaSwitching || plan.id === qaCurrentPlanId"
          @click="emit('qa-set-plan', plan.id)"
        >
          {{ plan.name }}
        </Button>
      </div>
    </div>

    <div v-if="billingHistory.length" class="border-t border-gray-100 pt-4 dark:border-white/[0.06]">
      <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">Billing history</p>
      <ul class="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
        <li
          v-for="entry in billingHistory"
          :key="entry.reference"
          class="flex flex-wrap items-baseline justify-between gap-2 py-2 text-[11px]"
        >
          <div class="min-w-0">
            <p class="font-medium text-gray-800 dark:text-gray-200">{{ entry.planLabel }}</p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400">
              {{ formatHistoryDate(entry.paidAt) }} · {{ entry.billingCycle }}
            </p>
          </div>
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ formatHistoryAmount(entry.amountKobo) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from '~/components/ui/Button.vue'
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_FEATURE_SUMMARY,
  type SubscriptionPlan,
} from '~/types/subscription'
import {
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_BILLING_CYCLES,
  type SubscriptionBillingCycle,
} from '~/types/subscription-billing'
import type { BillingHistoryEntry } from '~/server/api/paystack/billing-history.get'

const props = defineProps<{
  currentSubscriptionLabel: string
  billingCycleLabel: string | null
  currentPriceLabel: string | null
  statusLabel: string
  statusBadgeClass: string
  subscriptionRenewalLabel: string | null
  selectedBillingCycle: SubscriptionBillingCycle
  selectedUpgradePlan: SubscriptionPlan | ''
  changePlanOptions: Array<{
    id: SubscriptionPlan
    name: string
    direction: 'upgrade' | 'downgrade' | 'same'
  }>
  upgradePricePreview: string | null
  pricingLoading: boolean
  canCancel: boolean
  disabled: boolean
  isUpgrading: boolean
  isCanceling: boolean
  billingHistory: BillingHistoryEntry[]
  labelClass: string
  inputClass: (enabled: boolean) => string
  headerTextBtnClass: string
  showQaPlanSwitcher?: boolean
  qaCurrentPlanId?: SubscriptionPlan
  qaSwitching?: boolean
}>()

const emit = defineEmits<{
  upgrade: []
  cancel: []
  'update:selectedBillingCycle': [SubscriptionBillingCycle]
  'update:selectedUpgradePlan': [SubscriptionPlan | '']
  'qa-set-plan': [SubscriptionPlan]
}>()

const { formatCurrency } = usePreferences()

const billingSummary = computed(() => {
  const parts: string[] = []
  if (props.billingCycleLabel) parts.push(props.billingCycleLabel)
  if (props.currentPriceLabel) parts.push(props.currentPriceLabel)
  return parts.join(' · ')
})

const changePlanButtonLabel = computed(() => {
  const selected = props.changePlanOptions.find((p) => p.id === props.selectedUpgradePlan)
  if (selected?.direction === 'downgrade') return 'Downgrade'
  if (selected?.direction === 'upgrade') return 'Upgrade'
  return 'Continue'
})

function planOptionLabel(plan: {
  name: string
  direction: 'upgrade' | 'downgrade' | 'same'
}) {
  if (plan.direction === 'downgrade') return `${plan.name} · lower plan`
  if (plan.direction === 'upgrade') return `${plan.name} · higher plan`
  return plan.name
}

function formatHistoryDate(iso: string) {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatHistoryAmount(kobo: number) {
  if (!kobo) return formatCurrency(0)
  return formatCurrency(kobo / 100)
}
</script>
