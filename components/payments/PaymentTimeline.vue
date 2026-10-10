<template>
  <section v-if="visible" class="s-form-section s-pay-timeline">
    <h3 class="s-form-section__title">
      Payments
      <SBadge v-if="summary" :tone="saleTone" size="sm">
        {{ salePaymentStatusLabel(summary.status) }}
      </SBadge>
    </h3>

    <dl v-if="summary" class="s-record-totals">
      <div>
        <dt class="s-record-totals__label">Confirmed</dt>
        <dd class="s-record-totals__value s-record-totals__value--success">
          {{ money(summary.netPaidKobo) }}
        </dd>
      </div>
      <div v-if="summary.awaitingKobo > 0">
        <dt class="s-record-totals__label">Awaiting</dt>
        <dd class="s-record-totals__value s-record-totals__value--warning">
          {{ money(summary.awaitingKobo) }}
        </dd>
      </div>
      <div>
        <dt class="s-record-totals__label">Balance</dt>
        <dd class="s-record-totals__value">{{ money(summary.balanceKobo) }}</dd>
      </div>
    </dl>
    <p v-else class="s-form-meta">No payment recorded for this sale yet.</p>
    <p v-if="!access.canView" class="s-form-meta">Showing only payments you recorded.</p>

    <ul class="s-pay-timeline__list">
      <li v-for="p in payments" :key="p.id" class="s-pay-timeline__item">
        <div class="s-pay-timeline__head">
          <span class="s-pay-timeline__method">{{ p.methodLabel }}</span>
          <span class="s-pay-timeline__amount">{{ money(p.amountKobo) }}</span>
        </div>
        <div class="s-pay-timeline__chips">
          <SBadge :tone="paymentTone(p.status)">{{ paymentStatusLabel(p.status) }}</SBadge>
          <SBadge v-if="p.autoConfirmedReason === 'recorded_by_owner'" tone="info">
            Recorded by owner
          </SBadge>
          <SBadge v-for="f in p.flags" :key="f" tone="error">{{ flagLabel(f) }}</SBadge>
        </div>
        <p class="s-pay-timeline__meta">
          Recorded by {{ p.recordedBy === myUid ? 'you' : p.recordedByName }} ·
          {{ formatWhen(p.createdAt) }}
        </p>
        <p v-if="p.confirmedAt && !p.autoConfirmedReason" class="s-pay-timeline__meta">
          Confirmed by {{ who(p.confirmedBy) }} · {{ formatWhen(p.confirmedAt) }}
        </p>
        <p v-if="p.rejectedAt" class="s-pay-timeline__meta s-pay-timeline__meta--error">
          Rejected by {{ who(p.rejectedBy) }} · {{ formatWhen(p.rejectedAt) }}
          <template v-if="p.rejectionReason"> · “{{ p.rejectionReason }}”</template>
        </p>
        <p v-if="p.refundedKobo > 0" class="s-pay-timeline__meta">
          Refunded {{ money(p.refundedKobo) }}
          <template v-if="lastRefundReason(p)"> · “{{ lastRefundReason(p) }}”</template>
        </p>
        <p
          v-if="p.status === 'awaiting_confirmation' && isCashEndOfDay(p)"
          class="s-pay-timeline__meta"
        >
          Confirmed with the end-of-day till count.
        </p>

        <div class="s-pay-timeline__actions">
          <SButton
            v-if="canDecide(p)"
            size="sm"
            variant="primary"
            :loading="busyId === p.id"
            @click="onConfirm(p)"
          >
            Confirm
          </SButton>
          <SButton v-if="canDecide(p)" size="sm" :disabled="busyId === p.id" @click="openReject(p)">
            Reject
          </SButton>
          <SButton
            v-if="canAttachProof(p)"
            size="sm"
            :loading="busyId === p.id"
            @click="pickProof(p)"
          >
            Add proof
          </SButton>
          <SButton v-if="canSeeProof(p)" size="sm" :loading="busyId === p.id" @click="viewProof(p)">
            View proof
          </SButton>
          <SButton v-if="canRefundPayment(p)" size="sm" variant="danger" @click="openRefund(p)">
            Refund
          </SButton>
        </div>
      </li>
    </ul>

    <input
      ref="fileInput"
      type="file"
      class="s-pay-timeline__file"
      :accept="PROOF_ACCEPT"
      @change="onProofPicked"
    />

    <p v-if="payments.some(canAttachProof)" class="s-form-meta">
      Proofs (a photo, shrunk to 30 KB, or a PDF up to 5 MB) are visible only to people who can view
      or confirm payments, and are deleted 12 months after the payment is confirmed or rejected.
    </p>

    <SButton v-if="canRecordMore" size="sm" variant="primary" @click="emit('record-payment')">
      Record payment
    </SButton>

    <SDialog
      :open="rejectTarget !== null"
      size="sm"
      title="Reject payment"
      @update:open="(v: boolean) => !v && (rejectTarget = null)"
    >
      <template #default>
        <p class="s-form-meta">
          {{
            rejectTarget ? `${rejectTarget.methodLabel} · ${money(rejectTarget.amountKobo)}` : ''
          }}. The owner is told, and the sale goes back to owing this amount.
        </p>
        <STextarea v-model="reason" label="Reason" :maxlength="500" required />
      </template>
      <template #footer>
        <SDialogActions
          primary-label="Reject payment"
          primary-variant="danger"
          :primary-loading="busyId !== null"
          :primary-disabled="reason.trim().length < 3"
          @cancel="rejectTarget = null"
          @primary="onReject"
        />
      </template>
    </SDialog>

    <SDialog
      :open="refundTarget !== null"
      size="sm"
      title="Refund payment"
      @update:open="(v: boolean) => !v && (refundTarget = null)"
    >
      <template #default>
        <SField :label="`Amount (up to ${refundTarget ? money(refundable(refundTarget)) : ''})`">
          <SInput v-model="refundAmount" type="number" inputmode="decimal" min="0" step="0.01" />
        </SField>
        <STextarea v-model="reason" label="Reason" :maxlength="500" required />
        <p class="s-form-meta">
          Record here only money you have already returned to the customer. Stock is not changed.
        </p>
      </template>
      <template #footer>
        <SDialogActions
          primary-label="Record refund"
          primary-variant="danger"
          :primary-loading="busyId !== null"
          :primary-disabled="!refundValid"
          @cancel="refundTarget = null"
          @primary="onRefund"
        />
      </template>
    </SDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SInput from '~/components/s/SInput.vue'
import STextarea from '~/components/s/STextarea.vue'
import type { Receipt } from '~/stores/receipts'
import type { PaymentFlag, PaymentRecord, PaymentStatus } from '~/types/payments-v2'
import { koboToNaira, nairaToKobo } from '~/utils/money-kobo'
import { salePaymentStatusLabel } from '~/utils/payment-summary'
import { isV2Sale, saleOutstandingKobo } from '~/utils/payments-v2-tenders'
import { PROOF_ACCEPT, paymentsErrorMessage } from '~/composables/usePaymentsV2'
import { prepareImageUpload } from '~/utils/image-upload'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { useSensitiveAction } from '~/composables/useSensitiveAction'

const props = defineProps<{ receipt: Receipt }>()
const emit = defineEmits<{ 'record-payment': [] }>()

const paymentsV2 = usePaymentsV2()
const access = paymentsV2.access
const receiptsStore = useReceiptsStore()
const authStore = useAuthStore()
const toast = useAppToast()
const sensitive = useSensitiveAction()
const { formatCurrency } = usePreferences()

const payments = ref<PaymentRecord[]>([])
const busyId = ref<string | null>(null)
const rejectTarget = ref<PaymentRecord | null>(null)
const refundTarget = ref<PaymentRecord | null>(null)
const proofTarget = ref<PaymentRecord | null>(null)
const reason = ref('')
const refundAmount = ref<number | string>('')
const fileInput = ref<HTMLInputElement | null>(null)
let unsubscribe: Unsubscribe | null = null

const myUid = computed(() => authStore.currentUser?.uid ?? '')
const summary = computed(() => props.receipt.paymentSummary ?? null)
const visible = computed(() => access.value.enabled && isV2Sale(props.receipt))
const closed = computed(() => ['cancelled', 'refunded'].includes(props.receipt.status))
const canRecordMore = computed(
  () => access.value.canRecord && !closed.value && saleOutstandingKobo(props.receipt) > 0
)

const money = (kobo: number) => formatCurrency(koboToNaira(kobo), { fromCurrency: 'NGN' })

const saleTone = computed(() => {
  switch (summary.value?.status) {
    case 'paid':
      return 'success'
    case 'awaiting_confirmation':
    case 'partially_paid':
      return 'warning'
    case 'overpaid':
      return 'error'
    default:
      return 'neutral'
  }
})

function paymentTone(s: PaymentStatus) {
  if (s === 'confirmed') return 'success'
  if (s === 'awaiting_confirmation' || s === 'pending') return 'warning'
  if (s === 'rejected' || s === 'failed') return 'error'
  return 'neutral'
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  awaiting_confirmation: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  failed: 'Failed',
  expired: 'Expired',
  rejected: 'Rejected',
  partially_refunded: 'Part refunded',
  refunded: 'Refunded',
}
const paymentStatusLabel = (s: PaymentStatus) => STATUS_LABELS[s] ?? s

const FLAG_LABELS: Record<PaymentFlag, string> = {
  overpaid: 'Overpaid',
  paid_after_expiry: 'Paid after expiry',
  paid_after_revoke: 'Paid after revoke',
  duplicate_payment: 'Duplicate payment',
  oversold: 'Oversold',
}
const flagLabel = (f: PaymentFlag) => FLAG_LABELS[f] ?? f

function who(uid: string | null) {
  if (!uid) return 'someone'
  if (uid === myUid.value) return 'you'
  if (uid === payments.value[0]?.ownerId) return 'owner'
  return 'a confirmer'
}

function lastRefundReason(p: PaymentRecord) {
  const h = [...(p.statusHistory ?? [])]
    .reverse()
    .find((c) => c.to === 'refunded' || c.to === 'partially_refunded')
  return h?.reason ?? null
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const isCashEndOfDay = (p: PaymentRecord) =>
  p.kind === 'cash' && access.value.settings.cashConfirmation === 'end_of_day'

const canDecide = (p: PaymentRecord) =>
  access.value.canConfirm &&
  p.status === 'awaiting_confirmation' &&
  p.recordedBy !== myUid.value &&
  !isCashEndOfDay(p)

const canAttachProof = (p: PaymentRecord) =>
  p.recordedBy === myUid.value && p.status === 'awaiting_confirmation' && !p.proofPath

const canSeeProof = (p: PaymentRecord) =>
  !!p.proofPath && !p.proofDeletedAt && (access.value.canView || p.recordedBy === myUid.value)

const refundable = (p: PaymentRecord) => p.amountKobo - (p.refundedKobo || 0)
const canRefundPayment = (p: PaymentRecord) =>
  access.value.canRefund &&
  (p.status === 'confirmed' || p.status === 'partially_refunded') &&
  refundable(p) > 0

const refundValid = computed(() => {
  if (!refundTarget.value || reason.value.trim().length < 3) return false
  const n = Number(refundAmount.value)
  if (!Number.isFinite(n) || n <= 0) return false
  return nairaToKobo(n) <= refundable(refundTarget.value)
})

async function run(p: PaymentRecord, fn: () => Promise<unknown>, done: string) {
  busyId.value = p.id
  try {
    await fn()
    await receiptsStore.syncV2Receipt(props.receipt.id)
    toast.success(done)
    return true
  } catch (err) {
    toast.error(paymentsErrorMessage(err))
    return false
  } finally {
    busyId.value = null
  }
}

function onConfirm(p: PaymentRecord) {
  void run(p, () => paymentsV2.confirm(p.id), 'Payment confirmed')
}

function openReject(p: PaymentRecord) {
  reason.value = ''
  rejectTarget.value = p
}

async function onReject() {
  const p = rejectTarget.value
  if (!p) return
  if (await run(p, () => paymentsV2.reject(p.id, reason.value.trim()), 'Payment rejected')) {
    rejectTarget.value = null
  }
}

function openRefund(p: PaymentRecord) {
  reason.value = ''
  refundAmount.value = koboToNaira(refundable(p))
  refundTarget.value = p
}

async function onRefund() {
  const p = refundTarget.value
  if (!p || !refundValid.value) return
  if (!(await sensitive.confirm('refund'))) return
  const amountKobo = nairaToKobo(Number(refundAmount.value))
  if (
    await run(p, () => paymentsV2.refund(p.id, amountKobo, reason.value.trim()), 'Refund recorded')
  ) {
    refundTarget.value = null
  }
}

function pickProof(p: PaymentRecord) {
  proofTarget.value = p
  fileInput.value?.click()
}

async function onProofPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const p = proofTarget.value
  input.value = ''
  if (!file || !p) return
  await run(
    p,
    async () => {
      const proof =
        file.type === 'application/pdf'
          ? file
          : await prepareImageUpload(file, { maxEdge: 1280, name: 'proof' })
      await paymentsV2.uploadProof(p.id, proof)
    },
    'Proof attached'
  )
}

async function viewProof(p: PaymentRecord) {
  busyId.value = p.id
  try {
    const { url } = await paymentsV2.proofUrl(p.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not open the proof'))
  } finally {
    busyId.value = null
  }
}

async function subscribe() {
  unsubscribe?.()
  unsubscribe = null
  payments.value = []
  await paymentsV2.loadAccess()
  if (!visible.value || !myUid.value) return
  unsubscribe = await paymentsV2.watchReceiptPayments(
    props.receipt.id,
    myUid.value,
    access.value.canView,
    (list) => (payments.value = list)
  )
}

watch(() => props.receipt.id, subscribe, { immediate: true })
onBeforeUnmount(() => unsubscribe?.())
</script>

<style scoped>
.s-pay-timeline__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1-5);
}
.s-pay-timeline__item {
  border: 1px solid var(--s-border);
  border-radius: var(--s-radius);
  padding: var(--s-space-1-5);
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
}
.s-pay-timeline__head {
  display: flex;
  justify-content: space-between;
  font: var(--s-text-subheading);
  color: var(--s-text);
}
.s-pay-timeline__chips,
.s-pay-timeline__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half);
}
.s-pay-timeline__actions:empty {
  display: none;
}
.s-pay-timeline__meta {
  font: var(--s-text-small);
  color: var(--s-text-muted);
  margin: 0;
}
.s-pay-timeline__meta--error {
  color: var(--s-error);
}
.s-pay-timeline__file {
  display: none;
}
</style>
