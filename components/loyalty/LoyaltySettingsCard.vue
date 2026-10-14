<template>
  <SCard
    title="Customer rewards"
    description="Customers with a phone number or email on their sales earn points on what they pay. Top spenders move up tiers and earn faster."
  >
    <SSkeleton v-if="loading" :lines="4" />
    <p v-else-if="loadError" class="s-form-meta">{{ loadError }}</p>
    <form v-else id="loyalty-settings-form" class="s-settings__rows" @submit.prevent="save">
      <div class="s-settings__row">
        <SCheckbox
          v-model="form.enabled"
          variant="switch"
          label="Give customers points"
          description="Points start from the next sale. Turning this off stops new points; points already earned stay."
          :disabled="!canEdit"
        />
      </div>

      <div class="s-settings__row">
        <div class="s-settings__row-text">
          <label class="s-settings__row-label" for="loyalty-spend-per-point"
            >Spend for 1 point</label
          >
          <p class="s-settings__row-hint">
            Customers earn 1 point for every {{ formatCurrency(form.spendPerPoint || 0) }} they pay.
          </p>
        </div>
        <div class="s-settings__control s-settings__control--narrow">
          <SInput
            id="loyalty-spend-per-point"
            v-model.number="form.spendPerPoint"
            type="number"
            inputmode="decimal"
            min="1"
            :disabled="!canEdit"
          />
        </div>
      </div>

      <div class="s-settings__row">
        <div class="s-settings__row-text">
          <span class="s-settings__row-label">Which sales earn points</span>
          <p class="s-settings__row-hint">{{ earnFromHint }}</p>
        </div>
        <div class="s-settings__control">
          <SSelect
            v-model="form.earnFrom"
            :options="earnFromOptions"
            aria-label="Which sales earn points"
            :disabled="!canEdit"
          />
        </div>
      </div>

      <section class="s-form-section">
        <h3 class="s-form-section__title">Tiers</h3>
        <p class="s-form-meta">
          Based on what a customer paid across all branches in the last 12 months. A customer moves
          up as soon as their spend reaches a tier, and drops back if it falls below. Higher tiers
          earn points faster.
        </p>
        <div v-for="(tier, index) in form.tiers" :key="tier.id" class="s-loyalty-tier">
          <LoyaltyTierBadge class="s-loyalty-tier__badge" :tier="tier.id" :size="20" />
          <SInput
            v-model="tier.name"
            :label="index === 0 ? 'Name' : undefined"
            :aria-label="`Tier ${index + 1} name`"
            maxlength="24"
            :disabled="!canEdit"
          />
          <SInput
            v-model.number="tier.minSpend"
            :label="index === 0 ? 'Spend to reach' : undefined"
            :aria-label="`${tier.name} spend to reach`"
            type="number"
            inputmode="decimal"
            min="0"
            :disabled="!canEdit || index === 0"
          />
          <SInput
            v-model.number="tier.multiplier"
            :label="index === 0 ? 'Points rate (×)' : undefined"
            :aria-label="`${tier.name} points rate`"
            type="number"
            inputmode="decimal"
            min="1"
            max="5"
            step="0.05"
            :disabled="!canEdit"
          />
        </div>
      </section>
    </form>
    <template v-if="canEdit && !loading && !loadError" #footer>
      <SButton variant="primary" type="submit" form="loyalty-settings-form" :loading="saving">
        Save rewards
      </SButton>
    </template>
  </SCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import LoyaltyTierBadge from '~/components/loyalty/LoyaltyTierBadge.vue'
import { paymentsV2UiFlag, paymentsErrorMessage } from '~/composables/usePaymentsV2'
import { useLoyalty } from '~/composables/useLoyalty'
import { LOYALTY_DEFAULT_SETTINGS, type LoyaltySettings } from '~/utils/loyalty'

const loyalty = useLoyalty()
const toast = useAppToast()
const { formatCurrency } = usePreferences()

const form = ref<LoyaltySettings>(structuredClone(LOYALTY_DEFAULT_SETTINGS))
const canEdit = ref(false)
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)

const earnFromOptions = computed(() => {
  const options = [{ value: 'all', label: 'Every paid sale' }]
  if (paymentsV2UiFlag() || form.value.earnFrom === 'confirmed') {
    options.push({ value: 'confirmed', label: 'Only sales with confirmed payments' })
  }
  return options
})

const earnFromHint = computed(() =>
  form.value.earnFrom === 'confirmed'
    ? 'Points are given only once a payment is confirmed in Storvv. Refunds take points back.'
    : 'Completed sales earn on their total; part-paid sales earn on what has been paid. Refunds take points back.'
)

onMounted(async () => {
  try {
    const res = await loyalty.getSettings()
    form.value = structuredClone(res.settings)
    canEdit.value = res.canEdit
  } catch (err) {
    loadError.value = paymentsErrorMessage(err, 'Could not load rewards settings')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const res = await loyalty.saveSettings(form.value)
    form.value = structuredClone(res.settings)
    toast.success('Rewards settings saved')
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not save rewards settings'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.s-loyalty-tier {
  display: grid;
  grid-template-columns: auto minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 0.8fr);
  gap: var(--s-space-1-5);
  align-items: end;
}

.s-loyalty-tier__badge {
  align-self: end;
  margin-bottom: 0.375rem;
}
</style>
