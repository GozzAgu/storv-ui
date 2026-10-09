<template>
  <div class="ds-root s-c s-page s-pay-till">
    <SPageHeader title="Till count">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">Payments</p>
      </template>
      <template #description>
        Count the cash in the till, then confirm the cash payments it covers. Anything you reject
        goes back to owing on its sale, and the owner is told about any difference.
      </template>
    </SPageHeader>

    <SEmptyState
      v-if="ready && (!access.enabled || !access.canConfirm)"
      title="Not available"
      description="Only the store owner and staff allowed to confirm payments can count the till."
    />
    <SEmptyState
      v-else-if="ready && access.settings.cashConfirmation !== 'end_of_day'"
      title="Cash is confirmed one by one"
      description="This store confirms each cash payment on its own. The owner can switch to an end-of-day till count in Settings, Payments."
    />

    <template v-else-if="ready">
      <SCard>
        <div class="s-form">
          <SField label="Business day">
            <SInput v-model="businessDate" type="date" :max="today" @change="load" />
          </SField>

          <SEmptyState
            v-if="lines.length === 0"
            title="No cash to count"
            description="No cash payments recorded by others are awaiting confirmation for this day."
          />

          <ul v-else class="s-pay-till__list">
            <li v-for="l in lines" :key="l.id" class="s-pay-till__row">
              <div class="s-pay-till__main">
                <strong>{{ money(l.amountKobo) }}</strong>
                <span class="s-pay-till__meta">
                  {{ l.recordedByName }} · {{ formatTime(l.createdAt) }}
                </span>
              </div>
              <SCheckbox
                variant="switch"
                :label="decisions[l.id] === 'reject' ? 'Reject' : 'In the till'"
                :model-value="decisions[l.id] !== 'reject'"
                @update:model-value="(on: boolean) => (decisions[l.id] = on ? 'confirm' : 'reject')"
              />
            </li>
          </ul>

          <p v-if="ownEntries.length" class="s-form-meta">
            {{ ownEntries.length }} cash payment{{ ownEntries.length === 1 ? '' : 's' }} ({{
              money(ownEntries.reduce((s, l) => s + l.amountKobo, 0))
            }}) were recorded by you. Someone else must count those.
          </p>

          <template v-if="lines.length">
            <dl class="s-record-totals">
              <div>
                <dt class="s-record-totals__label">Expected</dt>
                <dd class="s-record-totals__value">{{ money(confirmKobo) }}</dd>
              </div>
              <div>
                <dt class="s-record-totals__label">Difference</dt>
                <dd
                  class="s-record-totals__value"
                  :class="
                    differenceKobo === 0
                      ? 's-record-totals__value--success'
                      : 's-record-totals__value--warning'
                  "
                >
                  {{ countedValid ? money(differenceKobo) : '—' }}
                </dd>
              </div>
            </dl>

            <SField label="Cash counted">
              <SInput v-model="counted" type="number" inputmode="decimal" min="0" step="0.01" />
            </SField>
            <STextarea
              v-if="rejectIds.length"
              v-model="rejectReason"
              label="Reason for rejecting"
              :maxlength="500"
              required
            />
            <STextarea v-model="note" label="Note" hint="Optional" :maxlength="500" />

            <div>
              <SButton variant="primary" :loading="busy" :disabled="!canSubmit" @click="submit">
                Save till count
              </SButton>
            </div>
          </template>
        </div>
      </SCard>
    </template>

    <div v-else class="s-pay-till__loading"><SSpinner :size="24" /></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SField from '~/components/s/SField.vue'
import SInput from '~/components/s/SInput.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import STextarea from '~/components/s/STextarea.vue'
import type { TillLine } from '~/composables/usePaymentsV2'
import { koboToNaira, nairaToKobo } from '~/utils/money-kobo'
import { lagosDate } from '~/utils/payments-v2-tenders'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const paymentsV2 = usePaymentsV2()
const access = paymentsV2.access
const toast = useAppToast()
const { formatCurrency } = usePreferences()

const today = lagosDate(new Date())
const businessDate = ref(today)
const lines = ref<TillLine[]>([])
const ownEntries = ref<TillLine[]>([])
const decisions = ref<Record<string, 'confirm' | 'reject'>>({})
const counted = ref<number | string>('')
const rejectReason = ref('')
const note = ref('')
const ready = ref(false)
const busy = ref(false)

const money = (kobo: number) => formatCurrency(koboToNaira(kobo), { fromCurrency: 'NGN' })
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

const confirmIds = computed(() =>
  lines.value.filter((l) => decisions.value[l.id] !== 'reject').map((l) => l.id)
)
const rejectIds = computed(() =>
  lines.value.filter((l) => decisions.value[l.id] === 'reject').map((l) => l.id)
)
const confirmKobo = computed(() =>
  lines.value
    .filter((l) => decisions.value[l.id] !== 'reject')
    .reduce((s, l) => s + l.amountKobo, 0)
)
const countedValid = computed(() => counted.value !== '' && Number(counted.value) >= 0)
const differenceKobo = computed(() =>
  countedValid.value ? nairaToKobo(Number(counted.value)) - confirmKobo.value : 0
)
const canSubmit = computed(
  () =>
    !busy.value &&
    lines.value.length > 0 &&
    countedValid.value &&
    (rejectIds.value.length === 0 || rejectReason.value.trim().length >= 3)
)

async function load() {
  try {
    await paymentsV2.loadAccess(true)
    if (!access.value.enabled || !access.value.canConfirm) return
    if (access.value.settings.cashConfirmation !== 'end_of_day') return
    const res = await paymentsV2.tillPreview(businessDate.value)
    lines.value = res.lines
    ownEntries.value = res.ownEntries
    decisions.value = Object.fromEntries(res.lines.map((l) => [l.id, 'confirm' as const]))
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not load the till'))
  } finally {
    ready.value = true
  }
}

async function submit() {
  if (!canSubmit.value) return
  busy.value = true
  try {
    const res = await paymentsV2.submitTill({
      businessDate: businessDate.value,
      countedKobo: nairaToKobo(Number(counted.value)),
      confirmIds: confirmIds.value,
      rejectIds: rejectIds.value,
      rejectReason: rejectIds.value.length ? rejectReason.value.trim() : undefined,
      note: note.value.trim() || undefined,
    })
    toast.success(
      res.differenceKobo === 0
        ? 'Till count saved. Everything balances.'
        : `Till count saved. Difference ${money(res.differenceKobo)}; the owner has been told.`
    )
    counted.value = ''
    rejectReason.value = ''
    note.value = ''
    await load()
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not save the till count'))
    await load()
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.s-pay-till__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
}
.s-pay-till__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-space-1-5);
  padding: var(--s-space-1) 0;
  border-bottom: 1px solid var(--s-border);
}
.s-pay-till__main {
  display: flex;
  flex-direction: column;
}
.s-pay-till__meta {
  font: var(--s-text-small);
  color: var(--s-text-muted);
}
.s-pay-till__loading {
  display: flex;
  justify-content: center;
  padding: var(--s-space-4);
}
</style>
