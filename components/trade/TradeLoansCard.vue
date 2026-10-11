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
          <span class="s-list__secondary">{{ lineDetail(line) }}</span>
        </div>
        <div class="s-trade-req__end">
          <template v-if="loan.direction === 'borrowed' && line.state === 'out'">
            <SButton
              size="sm"
              variant="secondary"
              :disabled="!!busyId"
              @click="ask(loan, line, 'return')"
            >
              Mark returned
            </SButton>
            <SButton
              v-if="canPay"
              size="sm"
              variant="primary"
              :loading="busyId === `${loan.id}:${line.id}:pay`"
              :disabled="!!busyId"
              @click="line.quantity > 1 ? ask(loan, line, 'pay') : pay(loan, line)"
            >
              {{ line.quantity > 1 ? 'Sold, pay' : `Sold, pay ${formatPrice(line.priceKobo)}` }}
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
            @click="ask(loan, line, 'confirm')"
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
    :title="dialogTitle"
    :description="confirming ? lineSummary(confirming.line) : ''"
    size="sm"
    :dismissible="!busyId"
    @update:open="(v) => !v && (confirming = null)"
  >
    <SInput
      v-if="confirming && confirming.line.quantity > 1"
      v-model="units"
      type="number"
      inputmode="numeric"
      :label="confirming.action === 'pay' ? 'How many did you sell?' : 'How many are back?'"
      :min="1"
      :max="confirming.line.quantity"
      :hint="`Up to ${confirming.line.quantity}`"
      required
    />
    <p class="s-partners__note">
      <template v-if="confirming?.action === 'pay'">
        You pay {{ confirming.loan.partner.displayName }}
        {{ formatPrice(confirming.line.priceKobo * (validUnits || 0)) }} by card or transfer. The
        rest stay on this loan.
      </template>
      <template v-else-if="confirming?.action === 'confirm'">
        They go back into your stock and {{ confirming.loan.partner.displayName }} no longer owes
        you for them. Only confirm once you have them in hand.
      </template>
      <template v-else-if="confirming">
        {{ confirming.loan.partner.displayName }} is asked to confirm they have them back. Until
        they do, they stay on this loan.
      </template>
    </p>
    <template #footer>
      <SDialogActions
        :primary-label="
          confirming?.action === 'pay'
            ? `Pay ${formatPrice((confirming?.line.priceKobo ?? 0) * (validUnits || 0))}`
            : confirming?.action === 'confirm'
            ? 'Confirm returned'
            : 'Mark returned'
        "
        :primary-loading="!!busyId"
        :primary-disabled="!validUnits"
        @cancel="confirming = null"
        @primary="confirmDialog"
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
import { computed, ref } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SInput from '~/components/s/SInput.vue'
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
  onReturn: (loanId: string, lineIds: string[], quantity?: number) => Promise<void>
  onPay: (loanId: string, lineIds: string[], quantity?: number) => Promise<string | null>
}>()

const toast = useAppToast()
const busyId = ref('')
const confirming = ref<{
  loan: TradeLoanView
  line: TradeLoanLineView
  action: 'return' | 'confirm' | 'pay'
} | null>(null)
const units = ref<number | string | null>(null)
const history = ref<TradeLoanView | null>(null)

/** The number entered, when it is a whole number within the line. */
const validUnits = computed(() => {
  const max = confirming.value?.line.quantity ?? 1
  if (max === 1) return 1
  const n = Number(units.value)
  return Number.isInteger(n) && n >= 1 && n <= max ? n : 0
})

const dialogTitle = computed(() => {
  switch (confirming.value?.action) {
    case 'pay':
      return 'Pay for what you sold'
    case 'confirm':
      return 'Confirm they are back?'
    default:
      return 'Mark as returned?'
  }
})

function ask(loan: TradeLoanView, line: TradeLoanLineView, action: 'return' | 'confirm' | 'pay') {
  units.value = line.quantity
  confirming.value = { loan, line, action }
}

function lineDetail(line: TradeLoanLineView): string {
  const price =
    line.quantity > 1
      ? `${line.quantity} × ${formatPrice(line.priceKobo)}`
      : formatPrice(line.priceKobo)
  return line.serial ? `${line.serial} · ${price}` : price
}

function lineSummary(line: TradeLoanLineView): string {
  return line.quantity > 1
    ? `${line.quantity} × ${line.name}`
    : [line.name, line.serial].filter(Boolean).join(' · ')
}

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
  const lines = e.lineIds
    .map((id) => loan.lines.find((l) => l.id === id))
    .filter((l): l is TradeLoanLineView => !!l)
  const count = lines.reduce((n, l) => n + l.quantity, 0)
  const what =
    lines.length === 1
      ? lineSummary(lines[0]!).split(' · ')[0]
      : `${count} item${count === 1 ? '' : 's'}`
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

async function confirmDialog() {
  const c = confirming.value
  const n = validUnits.value
  if (!c || !n || busyId.value) return
  const quantity = c.line.quantity > 1 ? n : undefined
  if (c.action === 'pay') {
    if (await pay(c.loan, c.line, quantity)) confirming.value = null
    return
  }
  busyId.value = `${c.loan.id}:${c.line.id}:return`
  try {
    await props.onReturn(c.loan.id, [c.line.id], quantity)
    const what = quantity ? `${n} × ${c.line.name}` : c.line.name
    toast.success(
      c.action === 'confirm'
        ? `${what} back in your stock`
        : `${c.loan.partner.displayName} will be asked to confirm`
    )
    confirming.value = null
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'That did not work. Refresh and try again.'))
  } finally {
    busyId.value = ''
  }
}

async function pay(loan: TradeLoanView, line: TradeLoanLineView, quantity?: number) {
  busyId.value = `${loan.id}:${line.id}:pay`
  try {
    const url = await props.onPay(loan.id, [line.id], quantity)
    if (url) window.location.assign(url)
    else
      toast.success(
        `Paid ${loan.partner.displayName} for ${quantity ? `${quantity} × ` : ''}${line.name}`
      )
    return true
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not start the payment'))
    return false
  } finally {
    busyId.value = ''
  }
}
</script>
