<template>
  <SCard v-for="loan in loans" :key="loan.id" flush>
    <template #header>
      <h2 class="s-card__title">
        {{ loan.direction === 'lent' ? 'Lent to' : 'Borrowed from' }}
        {{ loan.partner.displayName }}
      </h2>
    </template>
    <div class="s-trade-loan__meta">
      <SBadge :tone="loanTone(loan)">{{ loanLabel(loan) }}</SBadge>
      <span>
        <template v-if="!loan.settled"
          >{{ formatPrice(loan.outstandingKobo) }} still out ·
        </template>
        lent {{ formatDay(loan.createdAtMs) }}
      </span>
      <SButton size="sm" variant="ghost" @click="history = loan">History</SButton>
    </div>
    <ul class="s-list">
      <li v-for="line in loan.lines" :key="line.id" class="s-list__item s-trade-req">
        <div class="s-list__main">
          <span class="s-list__primary">{{ line.name }}</span>
          <span class="s-list__secondary">
            {{ line.serial || 'No serial number' }} · {{ formatPrice(line.priceKobo) }}
          </span>
        </div>
        <div class="s-trade-req__end">
          <template v-if="loan.direction === 'borrowed' && line.state === 'out'">
            <SButton
              size="sm"
              variant="secondary"
              :disabled="!!busyId"
              @click="confirming = { loan, line, action: 'return' }"
            >
              Mark returned
            </SButton>
            <SButton
              v-if="canPay"
              size="sm"
              variant="primary"
              :loading="busyId === `${loan.id}:${line.id}:pay`"
              :disabled="!!busyId"
              @click="pay(loan, line)"
            >
              Sold, pay {{ formatPrice(line.priceKobo) }}
            </SButton>
          </template>
          <SButton
            v-else-if="loan.direction === 'borrowed' && line.state === 'paying' && canPay"
            size="sm"
            variant="primary"
            :loading="busyId === `${loan.id}:${line.id}:pay`"
            :disabled="!!busyId"
            @click="pay(loan, line)"
          >
            Continue payment
          </SButton>
          <SButton
            v-else-if="
              loan.direction === 'lent' && (line.state === 'out' || line.state === 'return_marked')
            "
            size="sm"
            :variant="line.state === 'return_marked' ? 'primary' : 'secondary'"
            :disabled="!!busyId"
            @click="confirming = { loan, line, action: 'confirm' }"
          >
            Confirm returned
          </SButton>
          <SBadge
            v-if="line.state !== 'out' || loan.direction === 'lent'"
            :tone="lineTone(line.state)"
          >
            {{ lineLabel(loan, line.state) }}
          </SBadge>
        </div>
      </li>
    </ul>
  </SCard>

  <SDialog
    :open="!!confirming"
    :title="confirming?.action === 'confirm' ? 'Confirm it is back?' : 'Mark as returned?'"
    :description="confirming ? `${confirming.line.name} · ${confirming.line.serial}` : ''"
    size="sm"
    :dismissible="!busyId"
    @update:open="(v) => !v && (confirming = null)"
  >
    <p class="s-partners__note">
      <template v-if="confirming?.action === 'confirm'">
        It goes back into your stock and {{ confirming.loan.partner.displayName }} no longer owes
        you for it. Only confirm once you have it in hand.
      </template>
      <template v-else-if="confirming">
        {{ confirming.loan.partner.displayName }} is asked to confirm they have it back. Until they
        do, it stays on this loan.
      </template>
    </p>
    <template #footer>
      <SDialogActions
        :primary-label="confirming?.action === 'confirm' ? 'Confirm returned' : 'Mark returned'"
        :primary-loading="!!busyId"
        @cancel="confirming = null"
        @primary="confirmReturn"
      />
    </template>
  </SDialog>

  <SDialog
    :open="!!history"
    title="Loan history"
    :description="
      history ? `${history.partner.displayName} · due ${formatDay(history.dueAtMs)}` : ''
    "
    @update:open="(v) => !v && (history = null)"
  >
    <ul v-if="history" class="s-trade-loan__history">
      <li v-for="(e, i) in [...history.events].reverse()" :key="i">
        <span>{{ eventText(history, e) }}</span>
        <time :datetime="new Date(e.atMs).toISOString()">{{ formatWhen(e.atMs) }}</time>
      </li>
    </ul>
  </SDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import { useAppToast } from '~/composables/useAppToast'
import { tradeErrorMessage } from '~/composables/useTradePartners'
import type {
  TradeLoanEventView,
  TradeLoanLineState,
  TradeLoanLineView,
  TradeLoanView,
} from '~/types/trade'

const props = defineProps<{
  loans: TradeLoanView[]
  /** Paying for sold items needs permission to record sales. */
  canPay: boolean
  onReturn: (loanId: string, lineIds: string[]) => Promise<void>
  onPay: (loanId: string, lineIds: string[]) => Promise<string | null>
}>()

const toast = useAppToast()
const busyId = ref('')
const confirming = ref<{
  loan: TradeLoanView
  line: TradeLoanLineView
  action: 'return' | 'confirm'
} | null>(null)
const history = ref<TradeLoanView | null>(null)

const priceFormat = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})
const formatPrice = (kobo: number) => priceFormat.format(kobo / 100)
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Africa/Lagos',
})
const formatDay = (ms: number) => dayFormat.format(ms)
const whenFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Lagos',
})
const formatWhen = (ms: number) => whenFormat.format(ms)

function loanLabel(loan: TradeLoanView): string {
  if (loan.settled) return 'Settled'
  if (loan.overdue) return `Overdue since ${formatDay(loan.dueAtMs)}`
  const days = Math.ceil((loan.dueAtMs - Date.now()) / 86_400_000)
  return days <= 1 ? 'Due today' : `Due ${formatDay(loan.dueAtMs)}`
}
const loanTone = (loan: TradeLoanView) =>
  loan.settled ? 'success' : loan.overdue ? 'error' : 'accent'

function lineLabel(loan: TradeLoanView, state: TradeLoanLineState): string {
  const lent = loan.direction === 'lent'
  switch (state) {
    case 'out':
      return `With ${loan.partner.displayName}`
    case 'return_marked':
      return lent ? 'They say it is back' : 'Waiting for them to confirm'
    case 'paying':
      return lent ? 'Being paid for' : 'Payment started'
    case 'returned':
      return 'Returned'
    case 'paid':
      return lent ? 'Sold and paid' : 'Paid'
  }
}
const lineTone = (state: TradeLoanLineState) =>
  state === 'returned' || state === 'paid'
    ? 'success'
    : state === 'return_marked' || state === 'paying'
    ? 'warning'
    : 'neutral'

function eventText(loan: TradeLoanView, e: TradeLoanEventView): string {
  const names = e.lineIds.map((id) => loan.lines.find((l) => l.id === id)?.name).filter(Boolean)
  const what =
    names.length === 1 ? names[0] : `${names.length} item${names.length === 1 ? '' : 's'}`
  const lender = loan.direction === 'lent' ? 'You' : loan.partner.displayName
  const borrower = loan.direction === 'borrowed' ? 'You' : loan.partner.displayName
  switch (e.action) {
    case 'lent':
      return `${lender} lent ${what}`
    case 'return_marked':
      return `${borrower} marked ${what} returned`
    case 'returned':
      return `${lender} confirmed ${what} returned`
    case 'pay_started':
      return `${borrower} started paying for ${what}`
    case 'paid':
      return `Payment for ${what} confirmed`
  }
}

async function confirmReturn() {
  const c = confirming.value
  if (!c || busyId.value) return
  busyId.value = `${c.loan.id}:${c.line.id}:return`
  try {
    await props.onReturn(c.loan.id, [c.line.id])
    toast.success(
      c.action === 'confirm'
        ? `${c.line.name} is back in your stock`
        : `${c.loan.partner.displayName} will be asked to confirm`
    )
    confirming.value = null
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'That did not work. Refresh and try again.'))
  } finally {
    busyId.value = ''
  }
}

async function pay(loan: TradeLoanView, line: TradeLoanLineView) {
  busyId.value = `${loan.id}:${line.id}:pay`
  try {
    const url = await props.onPay(loan.id, [line.id])
    if (url) window.location.assign(url)
    else toast.success(`Paid ${loan.partner.displayName} for ${line.name}`)
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not start the payment'))
  } finally {
    busyId.value = ''
  }
}
</script>
