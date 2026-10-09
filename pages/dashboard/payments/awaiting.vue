<template>
  <div class="ds-root s-c s-page s-pay-awaiting">
    <SPageHeader title="Awaiting payments">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">Payments</p>
      </template>
      <template #description>
        Check each payment against your bank app or terminal before you confirm it. You cannot
        confirm payments you recorded yourself.
      </template>
      <template v-if="access.enabled && access.canConfirm" #actions>
        <SButton
          v-if="access.settings.cashConfirmation === 'end_of_day'"
          :to="dashPath('/payments/till')"
        >
          Count the till
        </SButton>
        <SButton :loading="loading" @click="load">Refresh</SButton>
      </template>
    </SPageHeader>

    <SEmptyState
      v-if="ready && (!access.enabled || !access.canConfirm)"
      title="Not available"
      description="Only the store owner and staff allowed to confirm payments can see this page."
    />

    <template v-else-if="ready">
      <SEmptyState
        v-if="rows.length === 0"
        title="Nothing to confirm"
        description="Payments recorded by your team will show here until someone confirms them."
      />

      <SCard v-else flush>
        <div class="s-pay-awaiting__bar">
          <SCheckbox
            :model-value="allSelected"
            :disabled="selectable.length === 0"
            :label="selected.size ? `${selected.size} selected` : 'Select all'"
            @update:model-value="toggleAll"
          />
          <div class="s-pay-awaiting__bulk">
            <SButton
              size="sm"
              variant="primary"
              :disabled="selected.size === 0 || busy"
              :loading="busy && bulkMode === 'confirm'"
              @click="confirmSelected"
            >
              Confirm selected
            </SButton>
            <SButton size="sm" :disabled="selected.size === 0 || busy" @click="rejectOpen = true">
              Reject selected
            </SButton>
          </div>
        </div>

        <ul class="s-pay-awaiting__list">
          <li v-for="p in rows" :key="p.id" class="s-pay-awaiting__row">
            <SCheckbox
              :model-value="selected.has(p.id)"
              :disabled="!isSelectable(p)"
              :aria-label="`Select ${p.methodLabel} ${money(p.amountKobo)}`"
              @update:model-value="toggle(p.id, $event)"
            />
            <div class="s-pay-awaiting__main">
              <div class="s-pay-awaiting__head">
                <span>{{ p.methodLabel }}</span>
                <strong>{{ money(p.amountKobo) }}</strong>
              </div>
              <p class="s-pay-awaiting__meta">
                Recorded by {{ p.isOwnEntry ? 'you' : p.recordedByName }} ·
                {{ formatWhen(p.createdAt) }}
              </p>
              <div class="s-pay-awaiting__chips">
                <SBadge v-if="p.isOwnEntry" tone="neutral"
                  >Your entry: someone else confirms</SBadge
                >
                <SBadge v-if="p.confirmViaTillCount" tone="info">Confirm with till count</SBadge>
                <SBadge v-if="p.hasProof" tone="accent">Proof attached</SBadge>
              </div>
            </div>
            <SButton
              size="sm"
              variant="ghost"
              :to="dashPath(`/receipts?receipt=${encodeURIComponent(p.receiptId)}`)"
            >
              Open sale
            </SButton>
          </li>
        </ul>
      </SCard>
    </template>

    <div v-else class="s-pay-awaiting__loading"><SSpinner :size="24" /></div>

    <SDialog
      :open="rejectOpen"
      size="sm"
      title="Reject selected payments"
      @update:open="(v: boolean) => (rejectOpen = v)"
    >
      <template #default>
        <p class="s-form-meta">
          {{ selected.size }} payment{{ selected.size === 1 ? '' : 's' }}. The owner is told and
          each sale goes back to owing the amount.
        </p>
        <STextarea v-model="reason" label="Reason" :maxlength="500" required />
      </template>
      <template #footer>
        <SDialogActions
          primary-label="Reject"
          primary-variant="danger"
          :primary-loading="busy"
          :primary-disabled="reason.trim().length < 3"
          @cancel="rejectOpen = false"
          @primary="rejectSelected"
        />
      </template>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SBadge from '~/components/s/SBadge.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import STextarea from '~/components/s/STextarea.vue'
import type { AwaitingPayment } from '~/composables/usePaymentsV2'
import { koboToNaira } from '~/utils/money-kobo'
import { runSequential } from '~/utils/payments-v2-tenders'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const paymentsV2 = usePaymentsV2()
const access = paymentsV2.access
const toast = useAppToast()
const { dashPath } = useDashboardPaths()
const { formatCurrency } = usePreferences()

const rows = ref<AwaitingPayment[]>([])
const selected = ref(new Set<string>())
const ready = ref(false)
const loading = ref(false)
const busy = ref(false)
const bulkMode = ref<'confirm' | 'reject' | null>(null)
const rejectOpen = ref(false)
const reason = ref('')

const money = (kobo: number) => formatCurrency(koboToNaira(kobo), { fromCurrency: 'NGN' })
const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const isSelectable = (p: AwaitingPayment) => !p.isOwnEntry && !p.confirmViaTillCount
const selectable = computed(() => rows.value.filter(isSelectable))
const allSelected = computed(
  () => selectable.value.length > 0 && selectable.value.every((p) => selected.value.has(p.id))
)

function toggle(id: string, on: boolean) {
  const next = new Set(selected.value)
  if (on) next.add(id)
  else next.delete(id)
  selected.value = next
}

function toggleAll(on: boolean) {
  selected.value = on ? new Set(selectable.value.map((p) => p.id)) : new Set()
}

async function load() {
  loading.value = true
  try {
    await paymentsV2.loadAccess(true)
    if (access.value.enabled && access.value.canConfirm) {
      rows.value = await paymentsV2.listAwaiting()
      const ids = new Set(rows.value.map((r) => r.id))
      selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
    }
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not load payments'))
  } finally {
    loading.value = false
    ready.value = true
  }
}

async function runBulk(mode: 'confirm' | 'reject', fn: (id: string) => Promise<unknown>) {
  busy.value = true
  bulkMode.value = mode
  const { ok, failed } = await runSequential([...selected.value], fn)
  busy.value = false
  bulkMode.value = null
  const verb = mode === 'confirm' ? 'confirmed' : 'rejected'
  if (ok > 0) toast.success(`${ok} payment${ok === 1 ? '' : 's'} ${verb}`)
  if (failed.length > 0)
    toast.error(`${failed.length} not ${verb}: ${paymentsErrorMessage(failed[0]!.error)}`)
  selected.value = new Set()
  await load()
}

function confirmSelected() {
  void runBulk('confirm', (id) => paymentsV2.confirm(id))
}

async function rejectSelected() {
  const why = reason.value.trim()
  await runBulk('reject', (id) => paymentsV2.reject(id, why))
  rejectOpen.value = false
  reason.value = ''
}

onMounted(load)
</script>

<style scoped>
.s-pay-awaiting__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-space-1-5);
  padding: var(--s-space-1-5) var(--s-space-2);
  border-bottom: 1px solid var(--s-border);
}
.s-pay-awaiting__bulk,
.s-pay-awaiting__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half);
}
.s-pay-awaiting__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.s-pay-awaiting__row {
  display: flex;
  align-items: flex-start;
  gap: var(--s-space-1-5);
  padding: var(--s-space-1-5) var(--s-space-2);
  border-bottom: 1px solid var(--s-border);
}
.s-pay-awaiting__row:last-child {
  border-bottom: 0;
}
.s-pay-awaiting__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
}
.s-pay-awaiting__head {
  display: flex;
  justify-content: space-between;
  font: var(--s-text-subheading);
  color: var(--s-text);
}
.s-pay-awaiting__meta {
  margin: 0;
  font: var(--s-text-small);
  color: var(--s-text-muted);
}
.s-pay-awaiting__loading {
  display: flex;
  justify-content: center;
  padding: var(--s-space-4);
}
</style>
