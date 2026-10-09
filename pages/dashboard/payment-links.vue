<template>
  <div class="ds-root s-c s-page s-paylinks">
    <SPageHeader title="Payment links">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">Payments</p>
      </template>
      <template #description>
        {{
          showPaymentLinksComingSoon
            ? 'Pay-by-link checkout is coming soon.'
            : 'Send customers a secure link to pay. Paid links settle straight to your bank.'
        }}
      </template>
      <template v-if="!showPaymentLinksComingSoon" #actions>
        <SButton
          variant="primary"
          :disabled="!payout.connected"
          :title="payout.connected ? '' : 'Connect a payout account first'"
          aria-label="New payment link"
          @click="showCreate = true"
        >
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          New payment link
        </SButton>
      </template>
    </SPageHeader>

    <PaymentLinksComingSoon v-if="showPaymentLinksComingSoon" />

    <template v-else>
      <SCard
        v-if="!payout.connected && !canChangePayout"
        title="No payout account yet"
        description="Only the store owner can connect the bank account that payments settle to."
      />

      <SCard
        v-else-if="!payout.connected || editingBank"
        title="Connect your payout account"
        description="Enter your bank details. Payments settle straight to this account. You need two-factor authentication turned on."
      >
        <div class="s-form">
          <div class="s-form-pair">
            <SSelect
              v-model="bankCode"
              label="Bank"
              :options="bankOptions"
              :placeholder="banksLoading ? 'Loading banks…' : 'Select bank'"
              :disabled="banksLoading"
              @change="onAccountInput"
            />
            <SInput
              v-model="accountNumber"
              label="Account number"
              inputmode="numeric"
              maxlength="10"
              placeholder="0123456789"
              @input="onAccountInput"
            />
          </div>

          <p v-if="resolving" class="s-form-meta s-paylinks__verify" role="status">
            <SSpinner :size="14" />
            Verifying account…
          </p>
          <p v-else-if="resolvedName" class="s-paylinks__verified">
            <BadgeCheck :size="16" :stroke-width="2" aria-hidden="true" />
            {{ resolvedName }}
          </p>
          <p v-if="connectError" class="s-paylinks__error" role="alert">{{ connectError }}</p>
        </div>

        <template #footer>
          <SButton v-if="editingBank" @click="editingBank = false">Cancel</SButton>
          <SButton
            variant="primary"
            :loading="connecting"
            :disabled="!canConnect"
            @click="connect"
          >
            Connect account
          </SButton>
        </template>
      </SCard>

      <section v-else class="s-paylinks__payout" aria-label="Payout account">
        <span class="s-paylinks__payout-icon" aria-hidden="true">
          <Landmark :size="20" :stroke-width="1.75" />
        </span>
        <div class="s-paylinks__payout-text">
          <p class="s-paylinks__payout-name">Payouts to {{ payout.accountName }}</p>
          <p class="s-paylinks__payout-meta">
            {{ payout.bankName }} · ****{{ payout.accountNumberLast4 }}
            <span v-if="payout.percentageCharge"> · {{ payout.percentageCharge }}% fee</span>
          </p>
        </div>
        <SBadge tone="success" dot>Connected</SBadge>
        <SButton v-if="canChangePayout" size="sm" @click="startEditBank">Change</SButton>
      </section>

      <div v-if="!loading || links.length > 0" class="s-paylinks__stats" aria-label="Payment links summary">
        <SStat label="Collected" :value="formatNaira(stats.collected)" />
        <SStat label="Paid" :value="stats.paid" />
        <SStat
          label="Unpaid"
          :value="stats.unpaid"
          :hint="stats.unpaid > 0 ? 'Awaiting payment' : undefined"
          :tone="stats.unpaid > 0 ? 'warning' : undefined"
        />
        <SStat
          label="Failed"
          :value="stats.failed"
          :hint="stats.failed > 0 ? 'Follow up with the customer' : undefined"
          :tone="stats.failed > 0 ? 'error' : undefined"
        />
      </div>

      <p v-if="stats.paid > 0" class="s-callout s-paylinks__callout">
        <ShieldCheck :size="16" :stroke-width="1.75" aria-hidden="true" />
        <span>Paid funds are secured by Paystack and settle to your bank the next business day.</span>
      </p>

      <SCard v-if="payout.connected && settlements.length > 0" title="Payouts to your bank" flush>
        <template #actions>
          <span class="s-paylinks__summary">
            {{ formatNaira(settlementSummary.settledTotal) }} settled
            <template v-if="settlementSummary.pendingTotal > 0">
              · {{ formatNaira(settlementSummary.pendingTotal) }} pending
            </template>
          </span>
        </template>
        <ul class="s-list">
          <li v-for="s in settlements" :key="s.id" class="s-list__item">
            <span class="s-list__main">
              <span class="s-list__primary">{{ formatDate(s.dateMs) }}</span>
            </span>
            <span class="s-paylinks__settlement-end">
              <span class="s-list__value">{{ formatNaira(s.amount) }}</span>
              <SBadge :tone="settlementTone(s.status)">{{ capitalize(s.status) }}</SBadge>
            </span>
          </li>
        </ul>
      </SCard>

      <div v-if="links.length > 0" class="s-toolbar">
        <SSearch
          v-model="searchQuery"
          class="s-toolbar__search"
          placeholder="Search links"
          label="Search payment links by invoice, customer or phone"
        />
        <div class="s-toolbar__filter">
          <SSelect v-model="statusFilter" :options="statusOptions" aria-label="Filter by status" />
        </div>
      </div>

      <SCard v-if="loading && links.length === 0" flush aria-busy="true">
        <ul class="s-list" aria-label="Loading payment links">
          <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
            <div class="s-list__main">
              <SSkeleton width="40%" height="14px" />
              <SSkeleton width="25%" height="12px" />
            </div>
            <SSkeleton width="72px" height="20px" />
          </li>
        </ul>
      </SCard>

      <SCard v-else-if="links.length === 0">
        <SEmptyState title="No payment links yet" description="Create your first link to start collecting.">
          <template #icon><CreditCard :size="24" :stroke-width="1.75" /></template>
          <template v-if="payout.connected" #actions>
            <SButton variant="primary" @click="showCreate = true">
              <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
              New payment link
            </SButton>
          </template>
        </SEmptyState>
      </SCard>

      <SCard v-else-if="visibleLinks.length === 0">
        <SEmptyState title="No links found" description="Try another status, or clear the search.">
          <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="clearFilters">Show all links</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="inv in paginatedLinks" :key="inv.token" class="s-list__item">
              <span class="s-list__main">
                <span class="s-list__primary">{{ inv.customerName }}</span>
                <span class="s-list__secondary">
                  #{{ inv.invoiceNumber }} · {{ itemsLabel(inv.itemsCount) }}
                </span>
              </span>
              <span class="s-list__end">
                <span class="s-list__value">{{ formatNaira(inv.total) }}</span>
                <SBadge :tone="statusTone(inv.status)">{{ statusLabel(inv.status) }}</SBadge>
              </span>
              <SIconButton
                label="Payment link actions"
                size="sm"
                :data-payment-link-actions-anchor="inv.token"
                aria-haspopup="menu"
                :aria-expanded="openPaymentLinkMenuId === inv.token"
                @click="togglePaymentLinkMenu(inv.token)"
              >
                <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
              </SIconButton>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Customer</th>
                <th scope="col" class="s-table__num">Total</th>
                <th scope="col">Status</th>
                <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in paginatedLinks" :key="inv.token">
                <td>
                  <span class="s-table__primary">{{ inv.invoiceNumber }}</span>
                  <span class="s-table__secondary">{{ itemsLabel(inv.itemsCount) }}</span>
                </td>
                <td>
                  <span class="s-table__primary">{{ inv.customerName }}</span>
                  <span v-if="inv.customerPhone" class="s-table__secondary">{{ inv.customerPhone }}</span>
                </td>
                <td class="s-table__num">{{ formatNaira(inv.total) }}</td>
                <td>
                  <SBadge :tone="statusTone(inv.status)" dot>{{ statusLabel(inv.status) }}</SBadge>
                  <span v-if="inv.status === 'paid'" class="s-table__secondary">{{ settlementNote(inv) }}</span>
                </td>
                <td class="s-table__actions">
                  <SIconButton
                    label="Payment link actions"
                    size="sm"
                    :data-payment-link-actions-anchor="inv.token"
                    aria-haspopup="menu"
                    :aria-expanded="openPaymentLinkMenuId === inv.token"
                    @click="togglePaymentLinkMenu(inv.token)"
                  >
                    <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SPagination
          :current-page="currentPage"
          :page-size="PAGE_SIZE"
          :total="visibleLinks.length"
          label="Payment links pagination"
          @page-change="onPageChange"
        />
      </template>

      <CreatePaymentLinkModal v-model="showCreate" @created="onCreated" />
      <SharePaymentLinkModal
        v-model="showShare"
        :link="activeLink"
        :auto-share="autoShareAfterCreate"
        @shared="onLinkShared"
      />
      <TotpConfirmModal
        v-model="totpModalOpen"
        title="Confirm bank connection"
        description="Enter your authenticator code to connect a payout bank account."
        @confirm="confirmTotp"
        @cancel="cancelTotp"
      />
    </template>

    <SMenu
      :open="Boolean(openPaymentLinkMenuId && paymentLinkForOpenMenu && paymentLinkMenuFixedStyle)"
      :style="paymentLinkMenuFixedStyle"
      menu-id="payment-link"
      label="Payment link actions"
      @close="closePaymentLinkMenu"
    >
      <SMenuItem
        label="Share"
        :icon="Share2"
        @select="
          () => {
            share(paymentLinkForOpenMenu!)
            closePaymentLinkMenu()
          }
        "
      />
      <SMenuItem label="Open link" :icon="ExternalLink" @select="openPaymentLink" />
    </SMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import {
  BadgeCheck,
  CreditCard,
  EllipsisVertical,
  ExternalLink,
  Landmark,
  Plus,
  SearchX,
  Share2,
  ShieldCheck,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import SStat from '~/components/s/SStat.vue'
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
import TotpConfirmModal from '~/components/security/TotpConfirmModal.vue'
import { usePaymentLinksLaunch } from '~/composables/usePaymentLinksLaunch'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { useTotpConfirmModal } from '~/composables/useTotpConfirmModal'
import { resolveTotpForSensitiveAction } from '~/utils/security-api-errors'
import { EMPTY_CELL } from '~/utils/ui-empty'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const PAGE_SIZE = 50

const route = useRoute()
const { showPaymentLinksComingSoon } = usePaymentLinksLaunch()
const isNativeShell = computed(() => isCapacitorNative())
const userStore = useUserStore()
const {
  payout,
  canChangePayout,
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

const {
  open: totpModalOpen,
  prompt: promptTotp,
  confirm: confirmTotp,
  cancel: cancelTotp,
} = useTotpConfirmModal()

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
const autoShareAfterCreate = ref(false)
const activeLink = ref<ShareableLink | null>(null)

const bankOptions = computed(() => banks.value.map((b) => ({ value: b.code, label: b.name })))

const canConnect = computed(() =>
  Boolean(bankCode.value && accountNumber.value.length === 10 && resolvedName.value)
)

let resolveTimer: ReturnType<typeof setTimeout> | null = null
const onAccountInput = () => {
  accountNumber.value = String(accountNumber.value ?? '').replace(/\D/g, '').slice(0, 10)
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
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    const bank = banks.value.find((b) => b.code === bankCode.value)
    await connectBank({
      bankCode: bankCode.value,
      bankName: bank?.name || '',
      accountNumber: accountNumber.value,
      accountName: resolvedName.value,
      businessName: userStore.userData?.name || '',
      totpCode,
    })
    editingBank.value = false
  } catch (e) {
    connectError.value =
      (e as { data?: { message?: string } })?.data?.message || 'Could not connect account'
  } finally {
    connecting.value = false
  }
}

const onCreated = async (link: ShareableLink) => {
  activeLink.value = link
  autoShareAfterCreate.value = isNativeShell.value
  showShare.value = true
  await loadLinks()
}

const onLinkShared = () => {
  autoShareAfterCreate.value = false
}

const share = (inv: PaymentLinkListItem) => {
  activeLink.value = {
    url: inv.url,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    total: inv.total,
  }
  autoShareAfterCreate.value = false
  showShare.value = true
}

const searchQuery = ref('')
const statusFilter = ref<'all' | PaymentLinkListItem['status']>('all')
const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
]

const visibleLinks = computed(() => {
  let rows = links.value
  if (statusFilter.value !== 'all') rows = rows.filter((inv) => inv.status === statusFilter.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((inv) =>
    [inv.invoiceNumber, inv.customerName, inv.customerPhone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  )
})

const currentPage = ref(1)
const paginatedLinks = computed(() =>
  visibleLinks.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

function onPageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
}

const {
  openMenuId: openPaymentLinkMenuId,
  menuFixedStyle: paymentLinkMenuFixedStyle,
  toggleMenu: togglePaymentLinkMenu,
  closeMenu: closePaymentLinkMenu,
} = useAnchoredRowMenu({
  anchorAttr: 'data-payment-link-actions-anchor',
})

const paymentLinkForOpenMenu = computed(() => {
  const token = openPaymentLinkMenuId.value
  if (!token) return null
  return links.value.find((inv) => inv.token === token) ?? null
})

function openPaymentLink() {
  const url = paymentLinkForOpenMenu.value?.url
  closePaymentLinkMenu()
  if (url) window.open(url, '_blank', 'noopener')
}

const itemsLabel = (count: number) => `${count} item${count === 1 ? '' : 's'}`

const capitalize = (value: string) => (value ? value[0]!.toUpperCase() + value.slice(1) : value)

const statusLabel = (s: PaymentLinkListItem['status']) =>
  ({ unpaid: 'Unpaid', paid: 'Paid', failed: 'Failed', expired: 'Expired' }[s])

const statusTone = (s: PaymentLinkListItem['status']) =>
  ({ unpaid: 'neutral', paid: 'success', failed: 'error', expired: 'warning' } as const)[s]

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
    : EMPTY_CELL

const settlementTone = (status: string) =>
  status === 'success' || status === 'completed' ? 'success' : 'warning'

onMounted(async () => {
  if (showPaymentLinksComingSoon.value) return
  await loadAll()
  if (!payout.value.connected) await loadBanks()
  if (route.query.create === '1' && payout.value.connected) {
    showCreate.value = true
  }
})
</script>
