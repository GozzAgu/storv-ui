<template>
  <div class="flex w-full max-w-none flex-col gap-5 pb-10 sm:gap-6">
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Payments</p>
      </template>
      <template #title>
        <h1 :class="titleClass">Payment links</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          {{
            showPaymentLinksComingSoon
              ? 'Pay-by-link checkout is coming soon.'
              : 'Get paid for orders without the customer visiting your store.'
          }}
        </p>
      </template>
      <template v-if="!showPaymentLinksComingSoon" #actions>
        <Button
          variant="ghost"
          size="sm"
          :extra-class="headerBtnClass"
          :loading="loading"
          @click="refresh"
        >
          Refresh
        </Button>
        <Button
          variant="primary"
          size="sm"
          :extra-class="headerBtnClass"
          :disabled="!payout.connected"
          :title="payout.connected ? '' : 'Connect a payout account first'"
          @click="showCreate = true"
        >
          New payment link
        </Button>
      </template>
    </DashboardPageHeader>

    <PaymentLinksComingSoon v-if="showPaymentLinksComingSoon" />

    <template v-else>
      <section
        v-if="!payout.connected || editingBank"
        class="rounded-xl border-0 bg-white px-4 py-3.5 dark:!bg-dashboard-card sm:px-5 sm:py-4"
      >
        <div class="mb-3 flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
          >
            <BuildingLibraryIcon class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Connect your payout account
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Enter your bank details. Payments settle straight to this account.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400"
              >Bank</label
            >
            <select
              v-model="bankCode"
              :class="[fieldClass, 'w-full']"
              :disabled="banksLoading"
              @change="onAccountInput"
            >
              <option value="">{{ banksLoading ? 'Loading banks…' : 'Select bank' }}</option>
              <option v-for="b in banks" :key="b.code" :value="b.code">{{ b.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400"
              >Account number</label
            >
            <input
              v-model="accountNumber"
              inputmode="numeric"
              maxlength="10"
              placeholder="0123456789"
              :class="[fieldClass, 'w-full tabular-nums']"
              @input="onAccountInput"
            />
          </div>
        </div>

        <div v-if="resolving" class="mt-3 text-xs text-gray-400">Verifying account…</div>
        <div
          v-else-if="resolvedName"
          class="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <CheckBadgeIcon class="h-4 w-4" />
          {{ resolvedName }}
        </div>
        <p v-if="connectError" class="mt-3 text-xs font-medium text-red-500">{{ connectError }}</p>

        <div class="mt-4 flex justify-end gap-2">
          <Button
            v-if="editingBank"
            variant="secondary"
            size="sm"
            :extra-class="headerBtnClass"
            @click="editingBank = false"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            :extra-class="headerBtnClass"
            :disabled="!canConnect || connecting"
            @click="connect"
          >
            {{ connecting ? 'Connecting…' : 'Connect account' }}
          </Button>
        </div>
      </section>

      <!-- Connected banner -->
      <section
        v-else
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/70 px-4 py-3 ring-1 ring-emerald-200/70 dark:bg-emerald-500/[0.06] dark:ring-emerald-500/20"
      >
        <div class="flex items-center gap-3">
          <CheckBadgeIcon class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-50">
              Payouts to {{ payout.accountName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ payout.bankName }} · ****{{ payout.accountNumberLast4 }}
              <span v-if="payout.percentageCharge"> · {{ payout.percentageCharge }}% fee</span>
            </p>
          </div>
        </div>
        <button type="button" class="btn-secondary btn-sm" @click="startEditBank">Change</button>
      </section>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          class="rounded-xl bg-white p-4 ring-1 ring-gray-100 dark:bg-dashboard-card dark:ring-white/[0.06]"
        >
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Collected</p>
          <p class="mt-1.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ formatNaira(stats.collected) }}
          </p>
        </div>
        <div
          class="rounded-xl bg-white p-4 ring-1 ring-gray-100 dark:bg-dashboard-card dark:ring-white/[0.06]"
        >
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Paid</p>
          <p class="mt-1.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ stats.paid }}
          </p>
        </div>
        <div
          class="rounded-xl bg-white p-4 ring-1 ring-gray-100 dark:bg-dashboard-card dark:ring-white/[0.06]"
        >
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Unpaid</p>
          <p class="mt-1.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ stats.unpaid }}
          </p>
        </div>
        <div
          class="rounded-xl bg-white p-4 ring-1 ring-gray-100 dark:bg-dashboard-card dark:ring-white/[0.06]"
        >
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Failed</p>
          <p
            class="mt-1.5 text-xl font-semibold tabular-nums"
            :class="
              stats.failed > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-gray-50'
            "
          >
            {{ stats.failed }}
          </p>
        </div>
      </div>

      <!-- Settlement reassurance -->
      <div
        v-if="stats.paid > 0"
        class="flex items-center gap-2.5 rounded-lg bg-emerald-50/60 px-3.5 py-2.5 text-xs text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/[0.06] dark:text-emerald-200 dark:ring-emerald-500/20"
      >
        <ShieldCheckIcon class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span
          >Paid funds are secured by Paystack and settle to your bank the next business day.</span
        >
      </div>

      <!-- Payouts to bank (real Paystack settlements) -->
      <section
        v-if="payout.connected && settlements.length > 0"
        :class="tableShellClass"
      >
        <div
          :class="[
            tableSectionHeaderClass,
            'flex items-center justify-between px-4 py-3 sm:px-5',
          ]"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Payouts to your bank
          </h2>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatNaira(settlementSummary.settledTotal) }} settled
            <template v-if="settlementSummary.pendingTotal > 0"
              >· {{ formatNaira(settlementSummary.pendingTotal) }} pending</template
            >
          </span>
        </div>
        <ul class="m-0 list-none p-0">
          <li
            v-for="(s, index) in settlements"
            :key="s.id"
            :class="[
              'flex items-center justify-between px-4 py-2.5 text-sm sm:px-5',
              index < settlements.length - 1 ? 'dash-table-list-row' : '',
            ]"
          >
            <span class="text-gray-700 dark:text-gray-200">{{ formatDate(s.dateMs) }}</span>
            <span class="flex items-center gap-2.5">
              <span class="font-medium tabular-nums text-gray-900 dark:text-gray-100">{{
                formatNaira(s.amount)
              }}</span>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                  settlementBadgeClass(s.status),
                ]"
              >
                {{ s.status }}
              </span>
            </span>
          </li>
        </ul>
      </section>

      <!-- Invoices -->
      <section :class="tableShellClass">
        <div
          :class="[
            tableSectionHeaderClass,
            'flex items-center justify-between px-4 py-3 sm:px-5',
          ]"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Recent links</h2>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ links.length }} total</span>
        </div>

        <div v-if="loading && links.length === 0" class="space-y-2 p-4 sm:p-5">
          <div
            v-for="i in 4"
            :key="i"
            class="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]"
          />
        </div>

        <div v-else-if="links.length === 0" class="px-4 py-12 text-center sm:px-5">
          <CreditCardIcon class="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200">No payment links yet</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Create your first link to start collecting.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="dashboard-table min-w-full">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Customer</th>
                <th scope="col" class="text-right">Total</th>
                <th scope="col" class="dashboard-table__col-status">Status</th>
                <th scope="col" class="dashboard-table__col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in links" :key="inv.token">
                <td>
                  <span class="dashboard-table__primary">{{ inv.invoiceNumber }}</span>
                  <span class="dashboard-table__muted mt-0.5 block text-[11px]"
                    >{{ inv.itemsCount }} item{{ inv.itemsCount === 1 ? '' : 's' }}</span
                  >
                </td>
                <td>
                  <span class="dashboard-table__primary">{{ inv.customerName }}</span>
                  <span
                    v-if="inv.customerPhone"
                    class="dashboard-table__muted mt-0.5 block text-[11px]"
                    >{{ inv.customerPhone }}</span
                  >
                </td>
                <td class="text-right">
                  <span class="dashboard-table__money">{{ formatNaira(inv.total) }}</span>
                </td>
                <td class="dashboard-table__col-status">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                      statusClass(inv.status),
                    ]"
                  >
                    {{ statusLabel(inv.status) }}
                  </span>
                  <span
                    v-if="inv.status === 'paid'"
                    class="dashboard-table__muted mt-1 block text-[11px] text-emerald-600 dark:text-emerald-400"
                  >
                    {{ settlementNote(inv) }}
                  </span>
                </td>
                <td class="dashboard-table__col-actions">
                  <div class="inline-flex gap-1.5">
                    <button type="button" class="btn-secondary btn-sm" @click="share(inv)">
                      Share
                    </button>
                    <a class="btn-outline btn-sm" :href="inv.url" target="_blank" rel="noopener"
                      >Open</a
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <CreatePaymentLinkModal v-model="showCreate" @created="onCreated" />
      <SharePaymentLinkModal v-model="showShare" :link="activeLink" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import {
  BuildingLibraryIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import DashboardPageHeader from '~/components/dashboard/DashboardPageHeader.vue'
import type { ShareableLink } from '~/components/payments/SharePaymentLinkModal.vue'

// Lazy-loaded so the page's first paint never depends on these (heavier) chunks.
// A failed modal chunk can then never blank the whole route on native.
const CreatePaymentLinkModal = defineAsyncComponent(
  () => import('~/components/payments/CreatePaymentLinkModal.vue')
)
const SharePaymentLinkModal = defineAsyncComponent(
  () => import('~/components/payments/SharePaymentLinkModal.vue')
)
import { formatNaira } from '~/utils/naira'
import { usePaymentLinks, type PaymentLinkListItem } from '~/composables/usePaymentLinks'
import { useUserStore } from '~/stores/user'
import PaymentLinksComingSoon from '~/components/payments/PaymentLinksComingSoon.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const { showPaymentLinksComingSoon } = usePaymentLinksLaunch()

const { eyebrowClass, titleClass, descriptionClass, headerBtnClass, fieldClass } =
  useDashboardPageChrome()
const { tableShellClass, tableSectionHeaderClass } = useDashboardTableChrome()
const userStore = useUserStore()
const {
  payout,
  links,
  stats,
  settlements,
  settlementSummary,
  loading,
  loadAll,
  loadLinks,
  fetchBanks,
  resolveAccount,
  connectBank,
} = usePaymentLinks()

const banks = ref<{ name: string; code: string }[]>([])
const banksLoading = ref(false)
const bankCode = ref('')
const accountNumber = ref('')
const resolving = ref(false)
const resolvedName = ref('')
const connecting = ref(false)
const connectError = ref('')
const editingBank = ref(false)

const showCreate = ref(false)
const showShare = ref(false)
const activeLink = ref<ShareableLink | null>(null)

const canConnect = computed(() =>
  Boolean(bankCode.value && accountNumber.value.length === 10 && resolvedName.value)
)

let resolveTimer: ReturnType<typeof setTimeout> | null = null
const onAccountInput = () => {
  accountNumber.value = accountNumber.value.replace(/\D/g, '').slice(0, 10)
  resolvedName.value = ''
  connectError.value = ''
  if (resolveTimer) clearTimeout(resolveTimer)
  if (accountNumber.value.length === 10 && bankCode.value) {
    resolving.value = true
    resolveTimer = setTimeout(async () => {
      try {
        resolvedName.value = await resolveAccount(accountNumber.value, bankCode.value)
        if (!resolvedName.value)
          connectError.value = 'Could not verify this account. Check the number and bank.'
      } catch (e) {
        connectError.value =
          (e as { data?: { message?: string } })?.data?.message || 'Could not verify account'
      } finally {
        resolving.value = false
      }
    }, 600)
  }
}

const loadBanks = async () => {
  if (banks.value.length > 0) return
  banksLoading.value = true
  try {
    banks.value = await fetchBanks()
  } catch (e) {
    connectError.value =
      (e as { data?: { message?: string } })?.data?.message || 'Could not load banks'
  } finally {
    banksLoading.value = false
  }
}

const startEditBank = async () => {
  editingBank.value = true
  bankCode.value = ''
  accountNumber.value = ''
  resolvedName.value = ''
  connectError.value = ''
  await loadBanks()
}

const connect = async () => {
  if (!canConnect.value || connecting.value) return
  connecting.value = true
  connectError.value = ''
  try {
    const bank = banks.value.find((b) => b.code === bankCode.value)
    await connectBank({
      bankCode: bankCode.value,
      bankName: bank?.name || '',
      accountNumber: accountNumber.value,
      accountName: resolvedName.value,
      businessName: userStore.userData?.name || '',
    })
    editingBank.value = false
  } catch (e) {
    connectError.value =
      (e as { data?: { message?: string } })?.data?.message || 'Could not connect account'
  } finally {
    connecting.value = false
  }
}

const refresh = () => loadAll()

const onCreated = async (link: ShareableLink) => {
  activeLink.value = link
  showShare.value = true
  await loadLinks()
}

const share = (inv: PaymentLinkListItem) => {
  activeLink.value = {
    url: inv.url,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    total: inv.total,
  }
  showShare.value = true
}

const statusLabel = (s: PaymentLinkListItem['status']) =>
  ({ unpaid: 'Unpaid', paid: 'Paid', failed: 'Failed', expired: 'Expired' }[s])

// Real status: a payment is settled once Paystack has run a payout dated after it was captured.
const settlementNote = (inv: PaymentLinkListItem) => {
  if (!inv.paidAtMs) return 'Funds secured'
  const lastSettled = settlementSummary.value.lastSettledAtMs
  return lastSettled && lastSettled >= inv.paidAtMs
    ? 'Settled to your bank'
    : 'Settling to your bank'
}

const formatDate = (ms: number) =>
  ms
    ? new Date(ms).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : ', '

const settlementBadgeClass = (status: string) =>
  status === 'success' || status === 'completed'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'

const statusClass = (s: PaymentLinkListItem['status']) =>
  ({
    unpaid: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    expired: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  }[s])

onMounted(async () => {
  if (showPaymentLinksComingSoon.value) return
  await loadAll()
  if (!payout.value.connected) await loadBanks()
})
</script>
