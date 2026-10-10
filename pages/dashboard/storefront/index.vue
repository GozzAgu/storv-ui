<template>
  <div class="ds-root s-c s-page s-storefront">
    <SPageHeader title="Storefront">
      <template #description>
        {{
          canCreateStandaloneLinks
            ? 'Confirm requests, send a payment link, then mark complete after the customer pays.'
            : 'Confirm requests, then contact the customer to arrange payment and pickup.'
        }}
      </template>
      <template #actions>
        <SButton to="/dashboard/settings?tab=storefront">
          <template #leading><Settings :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
          Storefront settings
        </SButton>
      </template>
    </SPageHeader>

    <dl v-if="!loading && inquiries.length > 0" class="s-metrics">
      <div class="s-metrics__item">
        <dt class="s-metrics__label">Pending</dt>
        <dd class="s-metrics__value" :class="{ 's-metrics__value--warning': pendingCount > 0 }">
          {{ pendingCount }}
        </dd>
      </div>
      <div class="s-metrics__item">
        <dt class="s-metrics__label">Awaiting payment</dt>
        <dd class="s-metrics__value">{{ awaitingPaymentCount }}</dd>
      </div>
      <div class="s-metrics__item">
        <dt class="s-metrics__label">Completed</dt>
        <dd class="s-metrics__value">{{ completedCount }}</dd>
      </div>
    </dl>

    <STabs v-model="statusFilter" :tabs="statusTabs" label="Inquiry filters" />

    <p v-if="loadError" class="s-storefront__error" role="alert">
      <TriangleAlert :size="16" :stroke-width="1.75" aria-hidden="true" />
      {{ loadError }}
    </p>

    <div v-if="!loading && inquiries.length > 0" class="s-toolbar">
      <SSearch
        v-model="searchQuery"
        class="s-toolbar__search"
        placeholder="Search inquiries"
        label="Search inquiries by customer, phone or product"
      />
    </div>

    <SCard v-if="loading && !inquiries.length" flush aria-busy="true" data-storefront-inquiries>
      <ul class="s-list" aria-label="Loading inquiries">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="72px" height="20px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="!inquiries.length" data-storefront-inquiries>
      <SEmptyState
        title="No inquiries yet"
        description="When guests contact or reserve from your storefront, they appear here."
      >
        <template #icon><ShoppingBag :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <ol v-if="canCreateStandaloneLinks" class="s-storefront__tips">
            <li>Confirm the request, then send a payment link</li>
            <li>Mark complete only after the customer pays</li>
          </ol>
          <ol v-else class="s-storefront__tips">
            <li>Confirm the request so the item stays on hold</li>
            <li>Call or message the customer to arrange payment</li>
          </ol>
        </template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="!filtered.length" data-storefront-inquiries>
      <SEmptyState
        title="No matching inquiries"
        :description="searchQuery ? 'Try another name, phone number or product.' : 'Try another status filter: All, Pending, or Confirmed.'"
      >
        <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="clearFilters">Show all inquiries</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <!-- Phone -->
      <SCard flush class="s-only-sm" data-storefront-inquiries>
        <ul class="s-list">
          <li v-for="row in paginated" :key="row.id" class="s-list__item">
            <span class="s-list__main">
              <span class="s-list__primary">{{ row.customerName }}</span>
              <span class="s-list__secondary">{{ row.listingTitle }}</span>
              <span class="s-storefront__badges">
                <SBadge :tone="statusTone(row.status)">{{ statusLabel(row.status) }}</SBadge>
                <SBadge v-if="paymentLabel(row) !== EMPTY_PAYMENT" :tone="paymentTone(row)">
                  {{ paymentLabel(row) }}
                </SBadge>
              </span>
            </span>
            <span class="s-list__end">
              <span v-if="row.listingPrice != null" class="s-list__value">{{ formatMoney(row.listingPrice) }}</span>
              <span class="s-list__secondary">{{ formatWhenShort(row.createdAtMs) }}</span>
            </span>
            <SIconButton
              label="Inquiry actions"
              size="sm"
              :data-inquiry-actions-anchor="row.id"
              aria-haspopup="menu"
              :aria-expanded="openInquiryMenuId === row.id"
              :loading="actingId === row.id"
              @click="toggleInquiryMenu(row.id)"
            >
              <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
            </SIconButton>
          </li>
        </ul>
      </SCard>

      <!-- Tablet and desktop -->
      <div class="s-table-wrap s-hide-sm" data-storefront-inquiries>
        <table class="s-table">
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Product</th>
              <th scope="col" class="s-hide-md">Type</th>
              <th scope="col" class="s-table__num">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Payment</th>
              <th scope="col" class="s-hide-lg">Received</th>
              <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginated" :key="row.id">
              <td>
                <span class="s-table__primary s-storefront__cell">{{ row.customerName }}</span>
                <span v-if="row.customerPhone" class="s-table__secondary">{{ row.customerPhone }}</span>
              </td>
              <td>
                <span class="s-table__primary s-storefront__cell" :title="row.customerNote || row.listingTitle">
                  {{ row.listingTitle }}
                </span>
                <NuxtLink
                  v-if="row.receiptNumber"
                  :to="
                    row.receiptId
                      ? `/dashboard/receipts?receipt=${encodeURIComponent(row.receiptId)}`
                      : '/dashboard/receipts'
                  "
                  class="s-link s-storefront__sale"
                >
                  Sale #{{ row.receiptNumber }}
                </NuxtLink>
              </td>
              <td class="s-hide-md">
                <SBadge :tone="row.type === 'reserve' ? 'warning' : 'info'">
                  {{ row.type === 'reserve' ? 'Reserve' : 'Contact' }}
                </SBadge>
              </td>
              <td class="s-table__num">
                <span v-if="row.listingPrice != null">{{ formatMoney(row.listingPrice) }}</span>
                <span v-else class="s-table__muted">{{ EMPTY_PAYMENT }}</span>
              </td>
              <td>
                <SBadge :tone="statusTone(row.status)" dot>{{ statusLabel(row.status) }}</SBadge>
              </td>
              <td>
                <SBadge :tone="paymentTone(row)">{{ paymentLabel(row) }}</SBadge>
              </td>
              <td class="s-hide-lg s-table__nowrap s-table__muted">{{ formatWhenShort(row.createdAtMs) }}</td>
              <td class="s-table__actions">
                <SIconButton
                  label="Inquiry actions"
                  size="sm"
                  :data-inquiry-actions-anchor="row.id"
                  aria-haspopup="menu"
                  :aria-expanded="openInquiryMenuId === row.id"
                  :loading="actingId === row.id"
                  @click="toggleInquiryMenu(row.id)"
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
        :total="filtered.length"
        label="Inquiries pagination"
        @page-change="onPageChange"
      />
    </template>

    <SharePaymentLinkModal v-model="showShareModal" :link="shareLink" />

    <SMenu
      :open="Boolean(openInquiryMenuId && inquiryForOpenMenu && inquiryMenuFixedStyle)"
      :style="inquiryMenuFixedStyle"
      menu-id="inquiry"
      label="Inquiry actions"
      @close="closeInquiryMenu"
    >
      <SMenuItem
        v-if="inquiryForOpenMenu?.status === 'pending'"
        label="Confirm"
        :icon="CircleCheck"
        @select="runMenuAction('confirmed')"
      />
      <SMenuItem
        v-if="inquiryForOpenMenu && canSendPaymentLink(inquiryForOpenMenu)"
        :label="inquiryForOpenMenu.paymentLinkToken ? 'Resend payment link' : 'Send payment link'"
        :icon="CreditCard"
        @select="sendPaymentLink()"
      />
      <SMenuItem
        v-if="inquiryForOpenMenu && canComplete(inquiryForOpenMenu)"
        label="Mark complete"
        :icon="CircleCheck"
        @select="runMenuAction('completed')"
      />
      <SMenuItem
        v-if="inquiryForOpenMenu && canCreateSale(inquiryForOpenMenu)"
        label="Create sale"
        :icon="CircleCheck"
        @select="runMenuAction('completed')"
      />
      <SMenuItem
        v-if="canAct(inquiryForOpenMenu?.status || 'pending')"
        label="Reject"
        danger
        :icon="X"
        @select="runMenuAction('rejected')"
      />
      <SMenuItem
        v-if="canAct(inquiryForOpenMenu?.status || 'pending')"
        label="Cancel hold"
        :icon="X"
        @select="runMenuAction('cancelled')"
      />
      <SMenuItem
        v-if="inquiryForOpenMenu?.customerPhone"
        label="Call customer"
        :icon="Phone"
        @select="callCustomer()"
      />
      <SMenuItem
        v-if="inquiryForOpenMenu?.receiptId"
        label="View sale"
        :icon="Receipt"
        @select="openSale()"
      />
    </SMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { getDocs, limit, query } from 'firebase/firestore'
import {
  CircleCheck,
  CreditCard,
  EllipsisVertical,
  Phone,
  Receipt,
  SearchX,
  Settings,
  ShoppingBag,
  TriangleAlert,
  X,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import type { ShareableLink } from '~/components/payments/SharePaymentLinkModal.vue'
import { useFirestore } from '~/composables/useFirestore'
import {
  getQueryUserId,
  getStorefrontInquiriesCollection,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { useAnchoredRowMenu } from '~/composables/useAnchoredRowMenu'
import { usePaymentLinksLaunch } from '~/composables/usePaymentLinksLaunch'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import { useStoresStore } from '~/stores/stores'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import { isStorefrontDashboardHidden } from '~/utils/storefront-launch'
import type { StorefrontInquiryStatus, StorefrontInquiryType } from '~/types/storefront'

const SharePaymentLinkModal = defineAsyncComponent(
  () => import('~/components/payments/SharePaymentLinkModal.vue')
)

definePageMeta({
  layout: 'dashboard',
})

if (isStorefrontDashboardHidden()) {
  await navigateTo('/dashboard', { replace: true })
}

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

const PAGE_SIZE = 50
const EMPTY_PAYMENT = '—'

const { authFetch } = useAuthenticatedFetch()
const storesStore = useStoresStore()
const { canCreateStandaloneLinks } = usePaymentLinksLaunch()

const loading = ref(true)
const loadError = ref('')
const inquiries = ref<InquiryRow[]>([])
const pendingCount = ref(0)
const statusFilter = ref<'all' | StorefrontInquiryStatus>('all')
const searchQuery = ref('')
const actingId = ref('')
const showShareModal = ref(false)
const shareLink = ref<ShareableLink | null>(null)

const statusTabs = computed(() => [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending', count: pendingCount.value || undefined },
  { value: 'confirmed', label: 'Confirmed' },
])

const awaitingPaymentCount = computed(
  () => inquiries.value.filter((row) => row.paymentLinkStatus === 'unpaid' && !row.receiptId).length
)
const completedCount = computed(
  () => inquiries.value.filter((row) => row.status === 'completed').length
)

const filtered = computed(() => {
  let rows = inquiries.value
  if (statusFilter.value !== 'all') rows = rows.filter((i) => i.status === statusFilter.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    [row.customerName, row.customerPhone, row.listingTitle]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  )
})

const currentPage = ref(1)
const paginated = computed(() =>
  filtered.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)
watch([statusFilter, searchQuery], () => {
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
  if (!canCreateStandaloneLinks.value) return false
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
  return EMPTY_PAYMENT
}

function paymentTone(row: InquiryRow) {
  if (row.paymentLinkStatus === 'paid' || row.receiptId) return 'success'
  if (row.paymentLinkStatus === 'unpaid') return 'warning'
  if (row.paymentLinkStatus === 'failed') return 'error'
  return 'neutral'
}

function statusLabel(status: StorefrontInquiryStatus) {
  return status[0]!.toUpperCase() + status.slice(1)
}

function statusTone(status: StorefrontInquiryStatus) {
  if (status === 'confirmed') return 'success'
  if (status === 'completed') return 'accent'
  return 'neutral'
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

useDashboardPageRefreshRegister(load)

onMounted(() => {
  void load()
})
</script>
