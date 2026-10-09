<template>
  <section v-if="visible" class="s-form-section s-pay-links">
    <h3 class="s-form-section__title">Payment links</h3>

    <p v-if="loadError" class="s-form-meta s-pay-links__error">{{ loadError }}</p>
    <p v-else-if="!loading && links.length === 0" class="s-form-meta">
      No payment links for this sale yet.
    </p>

    <ul class="s-pay-links__list">
      <li v-for="l in links" :key="l.id" class="s-pay-links__item">
        <div class="s-pay-links__head">
          <span>{{ money(l.amountKobo) }}</span>
          <SBadge :tone="statusTone(l.status)">{{ statusLabel(l.status) }}</SBadge>
        </div>
        <p class="s-pay-links__meta">
          Created {{ formatWhen(l.createdAt) }}
          <template v-if="l.status === 'active'"> · expires {{ formatWhen(l.expiresAt) }}</template>
          <template v-else-if="l.endedAt"> · ended {{ formatWhen(l.endedAt) }}</template>
        </p>
        <p v-if="l.linkSale && l.status === 'active'" class="s-pay-links__meta">
          Items are held for this order until it is paid or the link ends.
        </p>

        <ul v-if="l.status === 'active' && activeCopies(l).length > 0" class="s-pay-links__copies">
          <li v-for="(t, i) in activeCopies(l)" :key="t.tokenId" class="s-pay-links__copy">
            <span>Copy {{ i + 1 }} · shared {{ formatWhen(t.createdAt) }}</span>
            <SButton
              v-if="access.canRecord"
              size="sm"
              :loading="busy === t.tokenId"
              @click="onRevokeCopy(l, t)"
            >
              Revoke copy
            </SButton>
          </li>
        </ul>

        <div v-if="l.status === 'active' && access.canRecord" class="s-pay-links__actions">
          <SButton size="sm" :loading="busy === l.id" @click="onShareAgain(l)">New copy</SButton>
          <SButton size="sm" variant="danger" @click="openRevoke(l)">Revoke link</SButton>
        </div>
      </li>
    </ul>

    <SButton v-if="canCreate" size="sm" variant="primary" @click="openCreate">
      Create payment link
    </SButton>

    <SDialog
      :open="createOpen"
      size="sm"
      title="Create payment link"
      @update:open="(v: boolean) => !v && (createOpen = false)"
    >
      <template #default>
        <SField :label="`Amount (up to ${money(outstanding)})`">
          <SInput v-model="amount" type="number" inputmode="decimal" min="0" step="0.01" />
        </SField>
        <SSelect v-model="expiresInHours" label="Link expires after" :options="EXPIRY_OPTIONS" />
        <p class="s-form-meta">
          The link is shown once. Anyone with it can pay this amount, so send it only to the
          customer.
        </p>
      </template>
      <template #footer>
        <SDialogActions
          primary-label="Create link"
          :primary-loading="busy === 'create'"
          :primary-disabled="!amountValid"
          @cancel="createOpen = false"
          @primary="onCreate"
        />
      </template>
    </SDialog>

    <SDialog
      :open="revokeTarget !== null"
      size="sm"
      title="Revoke payment link"
      @update:open="(v: boolean) => !v && (revokeTarget = null)"
    >
      <template #default>
        <p class="s-form-meta">
          Every copy of this link stops working.
          <template v-if="revokeTarget?.linkSale">
            The order is cancelled and its items go back into stock.
          </template>
        </p>
        <STextarea v-model="reason" label="Reason" :maxlength="500" required />
      </template>
      <template #footer>
        <SDialogActions
          primary-label="Revoke link"
          primary-variant="danger"
          :primary-loading="busy === 'revoke'"
          :primary-disabled="reason.trim().length < 3"
          @cancel="revokeTarget = null"
          @primary="onRevoke"
        />
      </template>
    </SDialog>

    <SharePaymentLinkModal v-model="shareOpen" :link="shareLink" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import SharePaymentLinkModal, {
  type ShareableLink,
} from '~/components/payments/SharePaymentLinkModal.vue'
import type { Receipt } from '~/stores/receipts'
import { koboToNaira, nairaToKobo } from '~/utils/money-kobo'
import { isV2Sale, saleOutstandingKobo } from '~/utils/payments-v2-tenders'
import {
  paymentsErrorMessage,
  type PaymentLinkCopy,
  type ReceiptPaymentLink,
} from '~/composables/usePaymentsV2'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
]

const props = defineProps<{ receipt: Receipt }>()
const emit = defineEmits<{ changed: [] }>()

const paymentsV2 = usePaymentsV2()
const access = paymentsV2.access
const toast = useAppToast()
const { formatCurrency } = usePreferences()

const links = ref<ReceiptPaymentLink[]>([])
const loading = ref(false)
const loadError = ref('')
const busy = ref<string | null>(null)
const createOpen = ref(false)
const amount = ref<number | string>('')
const expiresInHours = ref<string | number | null>(24)
const revokeTarget = ref<ReceiptPaymentLink | null>(null)
const reason = ref('')
const shareOpen = ref(false)
const shareLink = ref<ShareableLink | null>(null)

const visible = computed(
  () =>
    access.value.enabled &&
    (access.value.canRecord || access.value.canView) &&
    isV2Sale(props.receipt)
)
const closed = computed(() => ['cancelled', 'refunded'].includes(props.receipt.status))
const outstanding = computed(() => saleOutstandingKobo(props.receipt))
const canCreate = computed(() => access.value.canRecord && !closed.value && outstanding.value > 0)

const amountKobo = computed(() => {
  try {
    return nairaToKobo(amount.value === '' ? NaN : Number(amount.value))
  } catch {
    return 0
  }
})
const amountValid = computed(() => amountKobo.value > 0 && amountKobo.value <= outstanding.value)

const money = (kobo: number) => formatCurrency(koboToNaira(kobo), { fromCurrency: 'NGN' })
const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

const statusLabel = (s: ReceiptPaymentLink['status']) =>
  ({ active: 'Active', paid: 'Paid', expired: 'Expired', revoked: 'Revoked' }[s])
const statusTone = (s: ReceiptPaymentLink['status']) =>
  s === 'paid' ? 'success' : s === 'active' ? 'info' : 'neutral'
const activeCopies = (l: ReceiptPaymentLink) => l.tokens.filter((t) => t.status === 'active')

async function load() {
  if (!visible.value) return
  loading.value = true
  loadError.value = ''
  try {
    links.value = await paymentsV2.listLinks(props.receipt.id)
  } catch (err) {
    loadError.value = paymentsErrorMessage(err, 'Could not load payment links')
  } finally {
    loading.value = false
  }
}

function showUrl(url: string, kobo: number) {
  shareLink.value = {
    url,
    invoiceNumber: props.receipt.receiptNumber,
    customerName: props.receipt.customerName,
    customerPhone: props.receipt.customerPhone || '',
    total: koboToNaira(kobo),
  }
  shareOpen.value = true
}

function openCreate() {
  amount.value = koboToNaira(outstanding.value)
  expiresInHours.value = 24
  createOpen.value = true
}

async function onCreate() {
  if (!amountValid.value) return
  busy.value = 'create'
  try {
    const created = await paymentsV2.createLink(props.receipt.id, {
      amountKobo: amountKobo.value,
      expiresInHours: Number(expiresInHours.value),
    })
    createOpen.value = false
    showUrl(created.url, created.amountKobo)
    emit('changed')
    await load()
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not create the link'))
  } finally {
    busy.value = null
  }
}

async function onShareAgain(l: ReceiptPaymentLink) {
  busy.value = l.id
  try {
    const shared = await paymentsV2.shareLink(l.id)
    showUrl(shared.url, l.amountKobo)
    await load()
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not make a new copy'))
  } finally {
    busy.value = null
  }
}

async function onRevokeCopy(l: ReceiptPaymentLink, t: PaymentLinkCopy) {
  busy.value = t.tokenId
  try {
    await paymentsV2.revokeLinkCopy(l.id, t.tokenId)
    toast.success('That copy of the link no longer works')
    await load()
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not revoke the copy'))
  } finally {
    busy.value = null
  }
}

function openRevoke(l: ReceiptPaymentLink) {
  reason.value = ''
  revokeTarget.value = l
}

async function onRevoke() {
  const target = revokeTarget.value
  if (!target || reason.value.trim().length < 3) return
  busy.value = 'revoke'
  try {
    await paymentsV2.revokeLink(target.id, reason.value.trim())
    revokeTarget.value = null
    toast.success('Payment link revoked')
    emit('changed')
    await load()
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not revoke the link'))
  } finally {
    busy.value = null
  }
}

watch(
  () => [props.receipt.id, visible.value] as const,
  () => {
    links.value = []
    void load()
  },
  { immediate: true }
)
</script>

<style scoped>
.s-pay-links__list,
.s-pay-links__copies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
}
.s-pay-links__item {
  border: 1px solid var(--s-border);
  border-radius: var(--s-radius);
  padding: var(--s-space-1-5);
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
}
.s-pay-links__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font: var(--s-text-subheading);
}
.s-pay-links__meta,
.s-pay-links__copy {
  font: var(--s-text-small);
  color: var(--s-text-muted);
  margin: 0;
}
.s-pay-links__copy {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-space-1);
}
.s-pay-links__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half);
}
.s-pay-links__error {
  color: var(--s-error);
}
</style>
