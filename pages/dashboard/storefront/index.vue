<template>
  <div
    :class="[
      'flex w-full max-w-none flex-col',
      isCapacitorIos ? 'dash-page--unified' : 'gap-5 pb-10 sm:gap-6 dash-page--unified',
    ]"
  >
    <!-- iOS -->
    <div v-if="isCapacitorIos" class="ios-sales-shell" data-storefront-page>
      <IosPageNavBar title="Storefront" />

      <div class="ios-sales-chrome">
        <IosQuickActionBar
          v-model="statusFilter"
          aria-label="Filter inquiries by status"
          :options="iosStatusOptions"
        />
        <div class="flex justify-end px-1">
          <NuxtLink
            to="/dashboard/settings?tab=storefront"
            class="text-xs font-semibold text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
          >
            Settings →
          </NuxtLink>
        </div>
      </div>

      <p v-if="loadError" class="px-1 text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>

      <IosTransactionListSkeleton v-if="loading && !inquiries.length" :count="6" />

      <DashboardTableEmptyState
        v-else-if="!storesStore.currentStoreId"
        :icon="ShoppingBagIcon"
        title="Select a store"
        description="Use the store selector to view storefront inquiries for a branch."
        :fill="false"
      />

      <DashboardTableEmptyState
        v-else-if="!inquiries.length"
        :icon="ShoppingBagIcon"
        title="No inquiries yet"
        description="When guests contact or reserve from your storefront, they appear here."
        :fill="false"
      />

      <DashboardTableEmptyState
        v-else-if="!filtered.length"
        :icon="ShoppingBagIcon"
        title="No matching inquiries"
        description="Try another status filter: Pending, Confirmed, or All."
        :fill="false"
      />

      <div v-else class="ios-receipt-transaction-list">
        <IosReceiptTransactionRow
          v-for="(row, index) in filtered"
          :key="row.id"
          :title="row.customerName"
          :subtitle="iosSubtitle(row)"
          :amount="row.listingPrice != null ? formatMoney(row.listingPrice) : '-'"
          :amount-tone="iosAmountTone(row)"
          :date="formatWhenShort(row.createdAtMs)"
          :variant="iosVariant(row.status)"
          :last="index === filtered.length - 1"
          :show-menu="
            canAct(row.status) ||
            canSendPaymentLink(row) ||
            canComplete(row) ||
            canCreateSale(row) ||
            Boolean(row.receiptId)
          "
          menu-kind="inquiry"
          :menu-id="row.id"
          @click="onIosRowClick(row)"
          @menu="toggleInquiryMenu(row.id)"
        />
      </div>
    </div>

    <!-- Web -->
    <template v-else>
      <DashboardPageHeader class="dash-page-header--unified">
        <template #title>
          <h1
            class="dash-page-title text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50"
          >
            Storefront
          </h1>
        </template>
        <template #description>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Confirm requests, send a payment link, then mark complete after the customer pays.
          </p>
        </template>
        <template #actions>
          <NuxtLink
            to="/dashboard/settings?tab=storefront"
            class="text-xs font-semibold text-gray-600 underline-offset-2 hover:underline dark:text-gray-300"
          >
            Storefront settings →
          </NuxtLink>
        </template>
      </DashboardPageHeader>

      <div class="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5">
        <nav :class="segmentTabsClass" aria-label="Inquiry filters" role="tablist">
          <button
            v-for="opt in statusTabs"
            :key="opt.value"
            type="button"
            role="tab"
            :aria-selected="statusFilter === opt.value"
            :class="[
              segmentTabsBtnClass,
              statusFilter === opt.value ? segmentTabsBtnActiveClass : '',
            ]"
            @click="statusFilter = opt.value"
          >
            {{ opt.label }}
            <span
              v-if="opt.value === 'pending' && pendingCount"
              class="ml-1.5 min-w-[1.125rem] rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums dark:bg-white/10"
            >
              {{ pendingCount }}
            </span>
          </button>
        </nav>

        <p v-if="loadError" class="text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>

        <div :class="tableShellFlexClass" data-storefront-inquiries>
          <DashTableSkeleton
            v-if="loading && !inquiries.length"
            :columns="[
              { label: 'Customer', lines: 1 },
              { label: 'Product', lines: 1 },
              { label: 'Type', bone: '4rem' },
              { label: 'Price', bone: '4.5rem' },
              { label: 'Status', class: 'dashboard-table__col-status', bone: '5.5rem' },
              { label: 'Payment', bone: '4.5rem' },
              { label: 'Received', bone: '6rem' },
              { label: 'Actions', class: 'dashboard-table__col-actions', bone: '2rem' },
            ]"
            :rows="6"
            leading="none"
            flush
            aria-label="Loading inquiries"
          />

          <DashboardTableEmptyState
            v-else-if="!inquiries.length"
            :icon="ShoppingBagIcon"
            title="No inquiries yet"
            description="When guests contact or reserve from your storefront, they appear here."
            :tips="[
              'Confirm the request, then send a payment link',
              'Mark complete only after the customer pays',
            ]"
          />

          <DashboardTableEmptyState
            v-else-if="!filtered.length"
            :icon="ShoppingBagIcon"
            title="No matching inquiries"
            description="Try another status filter: All, Pending, or Confirmed."
          />

          <div v-else class="overflow-x-auto">
            <table class="dashboard-table dashboard-table--storefront-compact min-w-full">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Product</th>
                  <th scope="col">Type</th>
                  <th scope="col">Price</th>
                  <th scope="col" class="dashboard-table__col-status">Status</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Received</th>
                  <th scope="col" class="dashboard-table__col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filtered" :key="row.id">
                  <td class="max-w-[12rem]">
                    <span class="dashboard-table__primary block truncate">{{
                      row.customerName
                    }}</span>
                    <span
                      v-if="row.customerPhone"
                      class="dashboard-table__muted block truncate text-[10px]"
                      >{{ row.customerPhone }}</span
                    >
                  </td>
                  <td class="max-w-[14rem]">
                    <span
                      class="dashboard-table__primary block truncate"
                      :title="row.customerNote || row.listingTitle"
                      >{{ row.listingTitle }}</span
                    >
                    <NuxtLink
                      v-if="row.receiptNumber"
                      :to="
                        row.receiptId
                          ? `/dashboard/receipts?receipt=${encodeURIComponent(row.receiptId)}`
                          : '/dashboard/receipts'
                      "
                      class="mt-0.5 block truncate text-[10px] font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                    >
                      Sale #{{ row.receiptNumber }}
                    </NuxtLink>
                  </td>
                  <td class="whitespace-nowrap">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      :class="typeBadgeClass(row.type)"
                    >
                      {{ row.type === 'reserve' ? 'Reserve' : 'Contact' }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap tabular-nums">
                    <span v-if="row.listingPrice != null" class="dashboard-table__money">{{
                      formatMoney(row.listingPrice)
                    }}</span>
                    <span v-else class="dashboard-table__muted">-</span>
                  </td>
                  <td class="dashboard-table__col-status">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      :class="statusBadgeClass(row.status)"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      :class="paymentBadgeClass(row)"
                    >
                      {{ paymentLabel(row) }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                    {{ formatWhenShort(row.createdAtMs) }}
                  </td>
                  <td class="dashboard-table__col-actions">
                    <button
                      type="button"
                      class="dashboard-table__action-btn"
                      :data-inquiry-actions-anchor="row.id"
                      aria-label="Inquiry actions"
                      :disabled="actingId === row.id"
                      @click="toggleInquiryMenu(row.id)"
                    >
                      <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <SharePaymentLinkModal v-model="showShareModal" :link="shareLink" />

    <IosContextMenu
      :open="Boolean(openInquiryMenuId && inquiryForOpenMenu && inquiryMenuFixedStyle)"
      :style="inquiryMenuFixedStyle"
      menu-id="inquiry"
    >
      <IosContextMenuItem
        v-if="inquiryForOpenMenu?.status === 'pending'"
        label="Confirm"
        :icon="CheckCircleIcon"
        @click="runMenuAction('confirmed')"
      />
      <IosContextMenuItem
        v-if="inquiryForOpenMenu && canSendPaymentLink(inquiryForOpenMenu)"
        :label="inquiryForOpenMenu.paymentLinkToken ? 'Resend payment link' : 'Send payment link'"
        :icon="CreditCardIcon"
        @click="sendPaymentLink()"
      />
      <IosContextMenuItem
        v-if="inquiryForOpenMenu && canComplete(inquiryForOpenMenu)"
        label="Mark complete"
        :icon="CheckCircleIcon"
        @click="runMenuAction('completed')"
      />
      <IosContextMenuItem
        v-if="inquiryForOpenMenu && canCreateSale(inquiryForOpenMenu)"
        label="Create sale"
        :icon="CheckCircleIcon"
        @click="runMenuAction('completed')"
      />
      <IosContextMenuItem
        v-if="canAct(inquiryForOpenMenu?.status || 'pending')"
        label="Reject"
        danger
        :icon="XMarkIcon"
        @click="runMenuAction('rejected')"
      />
      <IosContextMenuItem
        v-if="canAct(inquiryForOpenMenu?.status || 'pending')"
        label="Cancel hold"
        :icon="XMarkIcon"
        @click="runMenuAction('cancelled')"
      />
      <IosContextMenuItem
        v-if="inquiryForOpenMenu?.customerPhone"
        label="Call customer"
        :icon="DevicePhoneMobileIcon"
        @click="callCustomer()"
      />
      <IosContextMenuItem
        v-if="inquiryForOpenMenu?.receiptId"
        label="View sale"
        :icon="ReceiptPercentIcon"
        @click="openSale()"
      />
    </IosContextMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { getDocs, limit, query } from 'firebase/firestore'
import {
  CheckCircleIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '~/utils/app-icons'
import IosContextMenu from '~/components/ios/IosContextMenu.vue'
import IosContextMenuItem from '~/components/ios/IosContextMenuItem.vue'
import IosPageNavBar from '~/components/ios/IosPageNavBar.vue'
import IosQuickActionBar, { type IosQuickActionOption } from '~/components/ios/IosQuickActionBar.vue'
import IosReceiptTransactionRow, {
  type ReceiptTransactionAmountTone,
  type ReceiptTransactionVariant,
} from '~/components/ios/IosReceiptTransactionRow.vue'
import IosTransactionListSkeleton from '~/components/ios/IosTransactionListSkeleton.vue'
import type { ShareableLink } from '~/components/payments/SharePaymentLinkModal.vue'
import { useFirestore } from '~/composables/useFirestore'
import {
  getQueryUserId,
  getStorefrontInquiriesCollection,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { useAnchoredRowMenu } from '~/composables/useAnchoredRowMenu'
import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'
import { useDashboardTableChrome } from '~/composables/useDashboardTableChrome'
import { useIosPullToRefreshRegister } from '~/composables/useIosPullToRefresh'
import { useStoresStore } from '~/stores/stores'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import type { StorefrontInquiryStatus, StorefrontInquiryType } from '~/types/storefront'

const SharePaymentLinkModal = defineAsyncComponent(
  () => import('~/components/payments/SharePaymentLinkModal.vue')
)

definePageMeta({
  layout: 'dashboard',
})

type PaymentLinkStatus = 'unpaid' | 'paid' | 'failed' | 'expired'

type InquiryRow = {
  id: string
  type: StorefrontInquiryType
  status: StorefrontInquiryStatus
  customerName: string
  customerPhone: string
  customerNote: string | null
  listingId: string
  listingTitle: string
  listingPrice: number | null
  paymentLinkToken: string | null
  paymentLinkStatus: PaymentLinkStatus | null
  paymentLinkInvoiceNumber: string | null
  receiptId: string | null
  receiptNumber: string | null
  createdAtMs: number
}

const VALID_STATUSES = new Set<StorefrontInquiryStatus>([
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
])

const { authFetch } = useAuthenticatedFetch()
const { isCapacitorIos } = useIsCapacitorIos()
const { tableShellFlexClass } = useDashboardTableChrome()
const { segmentTabsClass, segmentTabsBtnClass, segmentTabsBtnActiveClass } =
  useDashboardPageChrome()
const storesStore = useStoresStore()

const loading = ref(true)
const loadError = ref('')
const inquiries = ref<InquiryRow[]>([])
const pendingCount = ref(0)
/** Default to All so iOS users see every inquiry without hunting tabs. */
const statusFilter = ref<'all' | StorefrontInquiryStatus>('all')
const actingId = ref('')
const showShareModal = ref(false)
const shareLink = ref<ShareableLink | null>(null)

const statusTabs = [
  { value: 'all' as const, label: 'All' },
  { value: 'pending' as const, label: 'Pending' },
  { value: 'confirmed' as const, label: 'Confirmed' },
]

const iosStatusOptions = computed((): IosQuickActionOption[] => [
  { value: 'all', label: 'All' },
  {
    value: 'pending',
    label: pendingCount.value ? `Pending (${pendingCount.value})` : 'Pending',
    badge: pendingCount.value || undefined,
  },
  { value: 'confirmed', label: 'Confirmed' },
])

const filtered = computed(() => {
  if (statusFilter.value === 'all') return inquiries.value
  return inquiries.value.filter((i) => i.status === statusFilter.value)
})

const {
  openMenuId: openInquiryMenuId,
  menuFixedStyle: inquiryMenuFixedStyle,
  toggleMenu: toggleInquiryMenu,
  closeMenu: closeInquiryMenu,
} = useAnchoredRowMenu({
  anchorAttr: 'data-inquiry-actions-anchor',
})

const inquiryForOpenMenu = computed(() => {
  const id = openInquiryMenuId.value
  if (!id) return null
  return inquiries.value.find((row) => row.id === id) ?? null
})

function toMillis(value: unknown): number {
  if (!value) return 0
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object') {
    const withToMillis = value as { toMillis?: () => number; seconds?: number }
    if (typeof withToMillis.toMillis === 'function') {
      try {
        return withToMillis.toMillis()
      } catch {
        /* fall through */
      }
    }
    if (typeof withToMillis.seconds === 'number') {
      return withToMillis.seconds * 1000
    }
  }
  return 0
}

function mapInquiryDoc(id: string, data: Record<string, unknown>): InquiryRow {
  const rawStatus = String(data.status || 'pending') as StorefrontInquiryStatus
  const status = VALID_STATUSES.has(rawStatus) ? rawStatus : 'pending'
  const rawType = String(data.type || 'contact')
  return {
    id: (typeof data.id === 'string' && data.id) || id,
    type: rawType === 'reserve' ? 'reserve' : 'contact',
    status,
    customerName: String(data.customerName || 'Guest'),
    customerPhone: String(data.customerPhone || ''),
    customerNote: typeof data.customerNote === 'string' ? data.customerNote : null,
    listingId: String(data.listingId || ''),
    listingTitle: String(data.listingTitle || 'Listing'),
    listingPrice: (() => {
      if (data.listingPrice == null || data.listingPrice === '') return null
      const price = Number(data.listingPrice)
      return Number.isFinite(price) ? price : null
    })(),
    paymentLinkToken: typeof data.paymentLinkToken === 'string' ? data.paymentLinkToken : null,
    paymentLinkStatus: (() => {
      const raw = String(data.paymentLinkStatus || '')
      if (raw === 'unpaid' || raw === 'paid' || raw === 'failed' || raw === 'expired') return raw
      return null
    })(),
    paymentLinkInvoiceNumber:
      typeof data.paymentLinkInvoiceNumber === 'string' ? data.paymentLinkInvoiceNumber : null,
    receiptId: typeof data.receiptId === 'string' ? data.receiptId : null,
    receiptNumber: typeof data.receiptNumber === 'string' ? data.receiptNumber : null,
    createdAtMs: toMillis(data.createdAt),
  }
}

function canAct(status: StorefrontInquiryStatus) {
  return status === 'pending' || status === 'confirmed'
}

function isPaid(row: InquiryRow) {
  return row.paymentLinkStatus === 'paid' || Boolean(row.receiptId)
}

function canSendPaymentLink(row: InquiryRow) {
  if (!canAct(row.status)) return false
  if (isPaid(row)) return false
  if (row.listingPrice == null || row.listingPrice <= 0) return false
  return true
}

function canComplete(row: InquiryRow) {
  // After the customer pays, settle may already create the sale receipt while
  // leaving the inquiry confirmed. Mark complete still closes the request.
  return row.status === 'confirmed' && isPaid(row)
}

function canCreateSale(row: InquiryRow) {
  return row.status === 'completed' && !row.receiptId && isPaid(row)
}

function paymentLabel(row: InquiryRow) {
  if (row.paymentLinkStatus === 'paid' || row.receiptId) return 'Paid'
  if (row.paymentLinkStatus === 'unpaid') return 'Awaiting'
  if (row.paymentLinkStatus === 'failed') return 'Failed'
  if (row.paymentLinkStatus === 'expired') return 'Expired'
  if (row.status === 'confirmed') return 'No link'
  return '-'
}

function paymentBadgeClass(row: InquiryRow) {
  if (row.paymentLinkStatus === 'paid' || row.receiptId) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
  }
  if (row.paymentLinkStatus === 'unpaid') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
  }
  if (row.paymentLinkStatus === 'failed') {
    return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200'
  }
  if (row.paymentLinkStatus === 'expired') {
    return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
  }
  return 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400'
}

function typeBadgeClass(type: StorefrontInquiryType) {
  return type === 'reserve'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
    : 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200'
}

function statusBadgeClass(status: StorefrontInquiryStatus) {
  if (status === 'pending') return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'
  if (status === 'confirmed')
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
  if (status === 'completed')
    return 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200'
  return 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400'
}

function iosSubtitle(row: InquiryRow) {
  const type = row.type === 'reserve' ? 'Reserve' : 'Contact'
  const status =
    row.status === 'pending'
      ? 'Pending'
      : row.status === 'confirmed'
        ? 'Confirmed'
        : row.status === 'completed'
          ? 'Completed'
          : row.status
  const payment = ` · ${paymentLabel(row)}`
  const note = row.customerNote ? ` · ${row.customerNote}` : ''
  return `${row.listingTitle} · ${type} · ${status}${payment}${note}`
}

function iosVariant(status: StorefrontInquiryStatus): ReceiptTransactionVariant {
  if (status === 'completed') return 'credit'
  if (status === 'pending' || status === 'confirmed') return 'pending'
  if (status === 'rejected' || status === 'cancelled') return 'cancelled'
  return 'pending'
}

function iosAmountTone(row: InquiryRow): ReceiptTransactionAmountTone {
  if (row.status === 'completed') return 'positive'
  if (row.status === 'rejected' || row.status === 'cancelled') return 'neutral'
  return 'warning'
}

function formatWhen(ms: number) {
  if (!ms) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ms))
  } catch {
    return ''
  }
}

function formatWhenShort(ms: number) {
  if (!ms) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ms))
  } catch {
    return formatWhen(ms)
  }
}

function formatMoney(amount: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return String(amount)
  }
}

function onIosRowClick(row: InquiryRow) {
  if (row.receiptId) {
    void navigateTo(`/dashboard/receipts?receipt=${encodeURIComponent(row.receiptId)}`)
    return
  }
  if (
    canAct(row.status) ||
    canSendPaymentLink(row) ||
    canComplete(row) ||
    canCreateSale(row)
  ) {
    toggleInquiryMenu(row.id)
  }
}

async function runMenuAction(status: StorefrontInquiryStatus) {
  const row = inquiryForOpenMenu.value
  const id = row?.id
  closeInquiryMenu()
  if (!id) return
  if (status === 'completed' && row && !isPaid(row) && !row.receiptId) {
    loadError.value =
      'Send a payment link and wait for the customer to pay before marking complete.'
    return
  }
  await updateStatus(id, status)
}

async function sendPaymentLink() {
  const row = inquiryForOpenMenu.value
  closeInquiryMenu()
  if (!row || !canSendPaymentLink(row)) return
  actingId.value = row.id
  loadError.value = ''
  try {
    const ownerUserId = await getQueryUserId()
    const storeId = (await getCurrentStoreId()) || storesStore.currentStoreId || ''
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    const res = await authFetch<{
      success?: boolean
      url?: string
      invoiceNumber?: string
      amount?: number
    }>(`/api/storefront/inquiries/${row.id}/payment-link`, {
      method: 'POST',
      body: { ownerUserId, storeId },
    })
    if (!res?.url) throw new Error('Payment link was not created')
    shareLink.value = {
      url: res.url,
      invoiceNumber: res.invoiceNumber || row.paymentLinkInvoiceNumber || '',
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      total: typeof res.amount === 'number' ? res.amount / 100 : row.listingPrice || 0,
    }
    showShareModal.value = true
    await load()
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Could not create payment link'
  } finally {
    actingId.value = ''
  }
}

function callCustomer() {
  const phone = inquiryForOpenMenu.value?.customerPhone
  closeInquiryMenu()
  if (!phone || !import.meta.client) return
  window.location.href = `tel:${phone}`
}

function openSale() {
  const receiptId = inquiryForOpenMenu.value?.receiptId
  closeInquiryMenu()
  if (!receiptId) return
  void navigateTo(`/dashboard/receipts?receipt=${encodeURIComponent(receiptId)}`)
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const ownerUserId = await getQueryUserId()
    const storeId = (await getCurrentStoreId()) || storesStore.currentStoreId || ''
    if (!ownerUserId || !storeId) {
      inquiries.value = []
      pendingCount.value = 0
      loadError.value = 'Select a store first.'
      return
    }

    // Prefer Firestore client reads on native. same path as buybacks/leads and
    // works even when the Capacitor shell's hosted API is behind or unreachable.
    const db = useFirestore().getFirestoreInstance()
    if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)

    const col = getStorefrontInquiriesCollection(db, ownerUserId, storeId)
    const snap = await getDocs(query(col, limit(200)))
    const rows = snap.docs.map((d) => mapInquiryDoc(d.id, d.data() as Record<string, unknown>))
    rows.sort((a, b) => b.createdAtMs - a.createdAtMs)

    inquiries.value = rows
    pendingCount.value = rows.filter((row) => row.status === 'pending').length
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Failed to load inquiries'
    inquiries.value = []
    pendingCount.value = 0
  } finally {
    loading.value = false
  }
}

async function updateStatus(id: string, status: StorefrontInquiryStatus) {
  actingId.value = id
  loadError.value = ''
  try {
    const ownerUserId = await getQueryUserId()
    const storeId = (await getCurrentStoreId()) || storesStore.currentStoreId || ''
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    const res = await authFetch<{
      success?: boolean
      receiptId?: string
      receiptNumber?: string
      folderId?: string
    }>(`/api/storefront/inquiries/${id}`, {
      method: 'PATCH',
      body: { ownerUserId, storeId, status },
    })
    if (status === 'completed' && res?.receiptId) {
      const { resetReceiptsFetchStamp, useReceiptsStore } = await import('~/stores/receipts')
      const { resetInventoryFetchStamps } = await import('~/stores/inventory')
      const { invalidateFolderItemCaches } = await import('~/utils/inventory-items-firestore')
      resetReceiptsFetchStamp()
      resetInventoryFetchStamps()
      if (res.folderId) invalidateFolderItemCaches(res.folderId)
      await useReceiptsStore().fetchReceipts({ force: true })
    }
    await load()
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Update failed'
  } finally {
    actingId.value = ''
  }
}

watch(
  () => storesStore.currentStoreId,
  (storeId) => {
    if (storeId) {
      void load()
    } else {
      inquiries.value = []
      pendingCount.value = 0
    }
  }
)

useIosPullToRefreshRegister(load)

onMounted(() => {
  void load()
})
</script>
