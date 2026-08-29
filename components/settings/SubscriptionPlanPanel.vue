<template>
  <div class="space-y-4">
    <div
      class="rounded-lg border border-gray-200/80 bg-gray-50/60 px-3 py-3 dark:border-white/[0.08] dark:bg-white/[0.03] sm:px-4"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Current plan
          </p>
          <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ currentSubscriptionLabel }}
          </p>
          <p v-if="billingCycleLabel" class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Billed {{ billingCycleLabel.toLowerCase() }}
            <span v-if="currentPriceLabel"> · {{ currentPriceLabel }}</span>
          </p>
        </div>
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
          :class="statusBadgeClass"
        >
          {{ statusLabel }}
        </span>
      </div>
      <p
        v-if="planExplainer"
        class="mt-3 border-t border-gray-200/70 pt-3 text-[10px] leading-relaxed text-gray-500 dark:border-white/[0.06] dark:text-gray-400"
      >
        {{ planExplainer }}
      </p>
      <p
        v-if="subscriptionRenewalLabel"
        class="mt-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300"
      >
        {{ subscriptionRenewalLabel }}
      </p>
    </div>

    <div class="space-y-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="min-w-0 flex-1">
          <label :class="labelClass">Billing cycle</label>
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
        <div class="min-w-0 flex-1">
          <label :class="labelClass">Upgrade to</label>
          <select
            :model-value="selectedUpgradePlan"
            :disabled="disabled || isUpgrading || upgradeOptions.length === 0"
            :class="inputClass(!disabled && !isUpgrading && upgradeOptions.length > 0)"
            @change="
              emit(
                'update:selectedUpgradePlan',
                ($event.target as HTMLSelectElement).value as SubscriptionPlan | ''
              )
            "
          >
            <option value="" disabled>
              {{ upgradeOptions.length === 0 ? 'No upgrades available' : 'Select a plan' }}
            </option>
            <option v-for="plan in upgradeOptions" :key="plan.id" :value="plan.id">
              {{ plan.name }}
            </option>
          </select>
        </div>
        <Button
          variant="primary"
          size="sm"
          :class="headerBtnClass"
          :disabled="disabled || !selectedUpgradePlan || isUpgrading || upgradeOptions.length === 0"
          @click="emit('upgrade')"
        >
          {{ isUpgrading ? 'Upgrading…' : 'Upgrade' }}
        </Button>
      </div>

      <p v-if="upgradePricePreview" class="text-[11px] font-medium text-gray-700 dark:text-gray-300">
        {{ upgradePricePreview }}
      </p>
      <p v-else-if="pricingLoading" class="text-[10px] text-gray-500 dark:text-gray-400">
        Loading price…
      </p>

      <p class="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
        Paystack auto-renews on your selected cycle. Plan updates after the first payment completes.
      </p>

      <div v-if="canCancel" class="pt-1">
        <Button
          variant="secondary"
          size="sm"
          :class="headerBtnClass"
          :disabled="isCanceling || isUpgrading"
          @click="emit('cancel')"
        >
          {{ isCanceling ? 'Canceling…' : 'Cancel auto-renew' }}
        </Button>
        <p class="mt-1.5 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
          Stops future Paystack charges. You keep your current plan until the billing period ends.
        </p>
      </div>

      <details class="group rounded-lg bg-gray-50/50 px-3 py-2 dark:bg-white/[0.02]">
        <summary
          class="cursor-pointer list-none text-[11px] font-medium text-gray-600 dark:text-gray-400"
        >
          <span class="inline-block transition group-open:rotate-90">›</span> Compare plans
        </summary>
        <ul class="mt-2 space-y-2 pl-3">
          <li v-for="(plan, id) in SUBSCRIPTION_FEATURE_SUMMARY" :key="id" class="text-[10px]">
            <span class="font-medium text-gray-700 dark:text-gray-300">
              {{ SUBSCRIPTION_PLANS.find((p) => p.id === id)?.name }}
            </span>
            <ul class="mt-0.5 list-inside list-disc text-gray-500 dark:text-gray-400">
              <li v-for="(line, i) in plan" :key="i">{{ line }}</li>
            </ul>
          </li>
        </ul>
      </details>
    </div>

    <div v-if="billingHistory.length" class="border-t border-gray-100 pt-3 dark:border-white/[0.06]">
      <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">Billing history</p>
      <p class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
        Recent subscription payments on this account.
      </p>
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
import { formatPlanPriceKobo, subscriptionStatusLabel } from '~/utils/subscription-billing-ui'
import type { BillingHistoryEntry } from '~/server/api/paystack/billing-history.get'

const props = defineProps<{
  currentSubscriptionLabel: string
  billingCycleLabel: string | null
  currentPriceLabel: string | null
  statusLabel: string
  statusBadgeClass: string
  planExplainer: string
  subscriptionRenewalLabel: string | null
  selectedBillingCycle: SubscriptionBillingCycle
  selectedUpgradePlan: SubscriptionPlan | ''
  upgradeOptions: Array<{ id: SubscriptionPlan; name: string }>
  upgradePricePreview: string | null
  pricingLoading: boolean
  canCancel: boolean
  disabled: boolean
  isUpgrading: boolean
  isCanceling: boolean
  billingHistory: BillingHistoryEntry[]
  labelClass: string
  inputClass: (enabled: boolean) => string
  headerBtnClass: string
}>()

const emit = defineEmits<{
  upgrade: []
  cancel: []
  'update:selectedBillingCycle': [SubscriptionBillingCycle]
  'update:selectedUpgradePlan': [SubscriptionPlan | '']
}>()

const { formatCurrency } = usePreferences()

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
