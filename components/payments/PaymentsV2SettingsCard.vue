<template>
  <SCard
    v-if="access.enabled && access.isOwner"
    title="Payment confirmation"
    description="Staff-recorded payments wait for a confirmer before they count as paid. Payments you record yourself confirm straight away."
  >
    <div class="s-form">
      <SSelect v-model="cashConfirmation" label="Cash payments" :options="cashOptions" />
      <p class="s-form-meta">
        {{
          cashConfirmation === 'end_of_day'
            ? 'Cash waits for the end-of-day till count; a confirmer counts the till and confirms the day in one go.'
            : 'Each cash payment is confirmed on its own from Awaiting payments.'
        }}
      </p>

      <section v-if="tenders.length" class="s-form-section">
        <h3 class="s-form-section__title">What each method is</h3>
        <p class="s-form-meta">
          This decides how a payment is checked. Every method still needs a confirmer.
        </p>
        <div v-for="t in tenders" :key="t" class="s-pay-settings__row">
          <span>{{ t }}</span>
          <SSelect
            :model-value="kinds[normalizeTenderLabel(t)]"
            :options="kindOptions"
            :aria-label="`Kind for ${t}`"
            @update:model-value="(v) => (kinds[normalizeTenderLabel(t)] = v as ManualKind)"
          />
        </div>
      </section>
    </div>
    <template #footer>
      <SButton variant="primary" :loading="saving" @click="save"
        >Save confirmation settings</SButton
      >
    </template>
  </SCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SCard from '~/components/s/SCard.vue'
import SButton from '~/components/s/SButton.vue'
import SSelect from '~/components/s/SSelect.vue'
import type { CashConfirmationMode } from '~/types/payments-v2'
import { kindForTender, normalizeTenderLabel, type ManualKind } from '~/utils/payment-tender-kind'

const props = defineProps<{ tenders: string[] }>()

const paymentsV2 = usePaymentsV2()
const access = paymentsV2.access
const toast = useAppToast()

const cashConfirmation = ref<CashConfirmationMode>('each')
const kinds = ref<Record<string, ManualKind>>({})
const saving = ref(false)

const cashOptions = [
  { value: 'each', label: 'Confirm each payment' },
  { value: 'end_of_day', label: 'Confirm with an end-of-day till count' },
]
const kindOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'pos', label: 'Card / POS terminal' },
  { value: 'manual_transfer', label: 'Bank transfer or wallet' },
]

function hydrate() {
  const s = access.value.settings
  cashConfirmation.value = s.cashConfirmation
  const tenderKinds = s.tenderKinds ?? {}
  kinds.value = Object.fromEntries(
    props.tenders.map((t) => [normalizeTenderLabel(t), kindForTender(t, { tenderKinds })])
  )
}

async function save() {
  saving.value = true
  try {
    const tenderKinds = Object.fromEntries(
      props.tenders.map((t) => [normalizeTenderLabel(t), kinds.value[normalizeTenderLabel(t)]!])
    )
    const res = await paymentsV2.saveSettings({
      cashConfirmation: cashConfirmation.value,
      tenderKinds,
    })
    access.value = { ...access.value, settings: res.settings }
    toast.success('Confirmation settings saved')
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not save settings'))
  } finally {
    saving.value = false
  }
}

watch(() => props.tenders, hydrate, { deep: true })
watch(() => access.value.settings, hydrate)
void paymentsV2.loadAccess().then(hydrate)
</script>

<style scoped>
.s-pay-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-space-1-5);
}
</style>
