<template>
  <SCard id="settings-subscription" title="Plan & billing">
    <template #actions>
      <SBadge :tone="statusTone" dot>{{ statusLabel }}</SBadge>
    </template>

    <div class="s-plan">
      <div class="s-plan__current">
        <p class="s-plan__name">{{ currentSubscriptionLabel }}</p>
        <p v-if="billingSummary" class="s-plan__meta">{{ billingSummary }}</p>
        <p v-if="subscriptionRenewalLabel" class="s-plan__meta">{{ subscriptionRenewalLabel }}</p>
      </div>

      <section v-if="changePlanOptions.length > 0" class="s-plan__section" aria-labelledby="plan-switch-heading">
        <h3 id="plan-switch-heading" class="s-plan__heading">Switch plan</h3>
        <div class="s-plan__switch">
          <SSelect
            :model-value="selectedUpgradePlan"
            label="Plan"
            placeholder="Select a plan"
            :options="planSelectOptions"
            :disabled="disabled || isUpgrading"
            @update:model-value="(value) => emit('update:selectedUpgradePlan', (value ?? '') as SubscriptionPlan | '')"
          />
          <SSelect
            :model-value="selectedBillingCycle"
            label="Billing"
            :options="billingCycleOptions"
            :disabled="disabled || isUpgrading"
            @update:model-value="(value) => emit('update:selectedBillingCycle', value as SubscriptionBillingCycle)"
          />
          <SButton
            variant="primary"
            :disabled="disabled || !selectedUpgradePlan || isUpgrading"
            :loading="isUpgrading"
            @click="emit('upgrade')"
          >
            {{ isUpgrading ? 'Redirecting…' : changePlanButtonLabel }}
          </SButton>
        </div>
        <p v-if="upgradePricePreview" class="s-plan__price">{{ upgradePricePreview }}</p>
        <p v-else-if="pricingLoading" class="s-plan__meta">Loading price…</p>
      </section>

      <details class="s-plan__compare">
        <summary>
          <ChevronRight :size="16" :stroke-width="2" aria-hidden="true" />
          Compare plans
        </summary>
        <dl class="s-plan__features">
          <div v-for="(lines, id) in SUBSCRIPTION_FEATURE_SUMMARY" :key="id">
            <dt>{{ SUBSCRIPTION_PLANS.find((p) => p.id === id)?.name }}</dt>
            <dd>
              <ul>
                <li v-for="(line, i) in lines" :key="i">{{ line }}</li>
              </ul>
            </dd>
          </div>
        </dl>
      </details>

      <section v-if="showQaPlanSwitcher" class="s-plan__qa" aria-labelledby="plan-qa-heading">
        <h3 id="plan-qa-heading" class="s-plan__heading">QA plan switcher</h3>
        <p class="s-plan__meta">Demo only. Jump between plans without Paystack.</p>
        <div class="s-plan__qa-actions">
          <SButton
            v-for="plan in SUBSCRIPTION_PLANS"
            :key="plan.id"
            variant="secondary"
            size="sm"
            :disabled="qaSwitching || plan.id === qaCurrentPlanId"
            @click="emit('qa-set-plan', plan.id)"
          >
            {{ plan.name }}
          </SButton>
        </div>
      </section>

      <section v-if="billingHistory.length" class="s-plan__section" aria-labelledby="plan-history-heading">
        <h3 id="plan-history-heading" class="s-plan__heading">Billing history</h3>
        <ul class="s-list">
          <li v-for="entry in billingHistory" :key="entry.reference" class="s-list__item">
            <div class="s-list__main">
              <p class="s-list__primary">{{ entry.planLabel }}</p>
              <p class="s-list__secondary">
                {{ formatHistoryDate(entry.paidAt) }} · {{ entry.billingCycle }}
              </p>
            </div>
            <p class="s-list__end s-list__value">{{ formatHistoryAmount(entry.amountKobo) }}</p>
          </li>
        </ul>
      </section>

      <div v-if="canCancel" class="s-plan__cancel">
        <SButton
          variant="secondary"
          size="sm"
          :disabled="isCanceling || isUpgrading"
          :loading="isCanceling"
          @click="emit('cancel')"
        >
          {{ isCanceling ? 'Canceling…' : 'Cancel auto-renew' }}
        </SButton>
        <p class="s-plan__meta">Keep this plan until the period ends, then move to Micro.</p>
      </div>
    </div>

    <template #footer>
      <p class="s-plan__meta">Billing help? <GrowthSupportLink class="s-link" /></p>
    </template>
  </SCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SSelect from '~/components/s/SSelect.vue'
import GrowthSupportLink from '~/components/growth/GrowthSupportLink.vue'
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
  statusTone?: 'neutral' | 'success' | 'warning' | 'error'
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

const planSelectOptions = computed(() =>
  props.changePlanOptions.map((plan) => ({ value: plan.id, label: planOptionLabel(plan) }))
)
const billingCycleOptions = SUBSCRIPTION_BILLING_CYCLES.map((cycle) => ({
  value: cycle,
  label: BILLING_CYCLE_LABELS[cycle],
}))

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
