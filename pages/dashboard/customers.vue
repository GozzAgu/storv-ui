<template>
  <div class="ds-root s-c s-page s-customers">
    <SPageHeader title="Customers">
      <template #description>
        Everyone you've named on a sale, what they've bought and what they owe.
      </template>
      <template #actions>
        <SButton variant="primary" :to="dashPath('/receipts?new=1')">
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          New sale
        </SButton>
      </template>
    </SPageHeader>

    <dl v-if="!isLoading && customers.length > 0" class="s-metrics">
      <div v-for="metric in headerMetrics" :key="metric.key" class="s-metrics__item">
        <dt class="s-metrics__label">{{ metric.label }}</dt>
        <dd class="s-metrics__value" :class="metric.tone && `s-metrics__value--${metric.tone}`">
          {{ metric.value }}
        </dd>
      </div>
    </dl>

    <STabs
      v-if="!isLoading && customers.length > 0"
      v-model="segment"
      :tabs="segmentTabs"
      label="Customer groups"
    />

    <div v-if="!isLoading && customers.length > 0" class="s-toolbar">
      <SSearch
        v-model="searchQuery"
        class="s-toolbar__search"
        placeholder="Search customers"
        label="Search customers by name, phone or email"
      />
      <div class="s-toolbar__filter">
        <SSelect v-model="sortBy" :options="sortOptions" aria-label="Sort by" />
      </div>
    </div>

    <SCard v-if="isLoading" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading customers">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <SSkeleton circle width="32px" height="32px" />
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="72px" height="14px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="visibleCustomers.length === 0">
      <SEmptyState
        v-if="customers.length === 0"
        title="No customers yet"
        description="Customers are added automatically when you put a name, phone number or email on a sale."
      >
        <template #icon><Users :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton variant="primary" :to="dashPath('/receipts?new=1')">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            New sale
          </SButton>
        </template>
      </SEmptyState>
      <SEmptyState
        v-else
        title="No customers found"
        :description="searchQuery ? 'Try another name, phone number or email.' : 'No customers in this group yet.'"
      >
        <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="clearFilters">Show all customers</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <!-- Phone -->
      <SCard flush class="s-only-sm">
        <ul class="s-list">
          <li v-for="customer in paginatedCustomers" :key="customer.id">
            <button
              type="button"
              class="s-list__item s-list__item--interactive"
              @click="openCustomer(customer)"
            >
              <SAvatar :name="customer.name" size="sm" />
              <span class="s-list__main">
                <span class="s-list__primary">{{ customer.name }}</span>
                <span class="s-list__secondary">{{ customerSubtitle(customer) }}</span>
              </span>
              <span class="s-list__end">
                <span class="s-list__value">{{ formatCurrency(customer.totalSpent) }}</span>
                <SBadge v-if="balanceOf(customer) > 0" tone="warning">
                  Owes {{ formatCurrency(balanceOf(customer)) }}
                </SBadge>
              </span>
            </button>
          </li>
        </ul>
      </SCard>

      <!-- Tablet and desktop -->
      <div class="s-table-wrap s-hide-sm">
        <table class="s-table">
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col" class="s-hide-md">Contact</th>
              <th scope="col" class="s-table__num">Orders</th>
              <th scope="col" class="s-table__num">Total spent</th>
              <th v-if="hasBalanceFeature" scope="col" class="s-table__num">Balance</th>
              <th scope="col" class="s-hide-md">Last order</th>
              <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="customer in paginatedCustomers"
              :key="customer.id"
              class="s-table__row--interactive"
              tabindex="0"
              @click="openCustomer(customer)"
              @keydown.enter.self="openCustomer(customer)"
            >
              <td>
                <div class="s-table__inline">
                  <SAvatar :name="customer.name" size="sm" />
                  <span class="s-table__primary">{{ customer.name }}</span>
                </div>
              </td>
              <td class="s-hide-md">
                <span class="s-table__secondary">{{ customer.phone || customer.email || EMPTY_CELL }}</span>
              </td>
              <td class="s-table__num">{{ customer.receipts.length }}</td>
              <td class="s-table__num">{{ formatCurrency(customer.totalSpent) }}</td>
              <td v-if="hasBalanceFeature" class="s-table__num">
                <span v-if="balanceOf(customer) > 0" class="s-table__warning">
                  {{ formatCurrency(balanceOf(customer)) }}
                </span>
                <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
              </td>
              <td class="s-hide-md">{{ formatDate(customer.lastOrderDate) }}</td>
              <td class="s-table__actions" @click.stop>
                <SIconButton
                  label="Customer actions"
                  size="sm"
                  :data-customer-actions-anchor="customer.id"
                  aria-haspopup="menu"
                  :aria-expanded="openMenuId === customer.id"
                  @click="toggleMenu(customer.id)"
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
        :total="visibleCustomers.length"
        label="Customers pagination"
        @page-change="onPageChange"
      />
    </template>

    <SMenu
      :open="Boolean(openMenuId && customerForMenu && menuFixedStyle)"
      :style="menuFixedStyle"
      menu-id="customer"
      label="Customer actions"
      @close="closeCustomerMenu"
    >
      <SMenuItem label="View details" :icon="Eye" @select="runMenuAction(openCustomer)" />
      <SMenuItem
        v-if="hasBalanceFeature"
        label="Manage balance"
        :icon="Wallet"
        @select="runMenuAction(openBalance)"
      />
    </SMenu>

    <SDialog
      v-model:open="showDetail"
      :title="selectedCustomer?.name || 'Customer'"
      :description="selectedCustomer ? `Customer since ${formatDate(selectedCustomer.firstOrderDate)}` : undefined"
      placement="right"
    >
      <div v-if="selectedCustomer" class="s-customer">
        <dl class="s-customer__contact">
          <div v-if="selectedCustomer.phone" class="s-customer__row">
            <dt><Phone :size="16" :stroke-width="1.75" aria-hidden="true" /><span class="ds-sr-only">Phone</span></dt>
            <dd><a :href="`tel:${selectedCustomer.phone}`" class="s-link">{{ selectedCustomer.phone }}</a></dd>
          </div>
          <div v-if="selectedCustomer.email" class="s-customer__row">
            <dt><Mail :size="16" :stroke-width="1.75" aria-hidden="true" /><span class="ds-sr-only">Email</span></dt>
            <dd><a :href="`mailto:${selectedCustomer.email}`" class="s-link">{{ selectedCustomer.email }}</a></dd>
          </div>
          <div v-if="selectedCustomer.address" class="s-customer__row">
            <dt><MapPin :size="16" :stroke-width="1.75" aria-hidden="true" /><span class="ds-sr-only">Address</span></dt>
            <dd>{{ selectedCustomer.address }}</dd>
          </div>
          <p
            v-if="!selectedCustomer.phone && !selectedCustomer.email && !selectedCustomer.address"
            class="s-customer__none"
          >
            No contact details yet. Add a phone number or email on their next sale.
          </p>
        </dl>

        <dl class="s-metrics s-metrics--inline s-customer__stats">
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Orders</dt>
            <dd class="s-metrics__value">{{ selectedCustomer.receipts.length }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Total spent</dt>
            <dd class="s-metrics__value">{{ formatCurrency(selectedCustomer.totalSpent) }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Last order</dt>
            <dd class="s-metrics__value">{{ formatShortDate(selectedCustomer.lastOrderDate) }}</dd>
          </div>
        </dl>

        <section v-if="hasBalanceFeature" class="s-customer__balance" aria-label="Balance">
          <div>
            <p class="s-customer__balance-label">Balance</p>
            <p
              class="s-customer__balance-value"
              :class="{ 's-customer__balance-value--owed': balanceOf(selectedCustomer) > 0 }"
            >
              {{
                balanceOf(selectedCustomer) > 0
                  ? `Owes ${formatCurrency(balanceOf(selectedCustomer))}`
                  : 'Nothing owed'
              }}
            </p>
          </div>
          <SButton size="sm" @click="openBalance(selectedCustomer)">Manage balance</SButton>
        </section>

        <section class="s-customer__history" aria-labelledby="customer-history-title">
          <h3 id="customer-history-title" class="s-customer__heading">Sales</h3>
          <SCard flush>
            <ul class="s-list">
              <li v-for="receipt in selectedCustomerReceipts" :key="receipt.id">
                <button
                  type="button"
                  class="s-list__item s-list__item--interactive"
                  @click="goToReceipt(receipt)"
                >
                  <span class="s-list__main">
                    <span class="s-list__primary">#{{ receipt.receiptNumber }} · {{ formatDate(receipt.date) }}</span>
                    <span class="s-list__secondary">{{ receiptSummary(receipt) }}</span>
                  </span>
                  <span class="s-list__end">
                    <span class="s-list__value">{{ formatCurrency(receipt.total) }}</span>
                    <SBadge :tone="getReceiptStatusTone(receipt.status)">
                      {{ getReceiptStatusLabel(receipt.status) }}
                    </SBadge>
                  </span>
                </button>
              </li>
            </ul>
          </SCard>
        </section>
      </div>
    </SDialog>

    <CustomerBalanceModal
      v-if="balanceTarget"
      v-model="showBalanceModal"
      :customer-name="balanceTarget.name"
      :email="balanceTarget.email"
      :phone="balanceTarget.phone"
      @saved="onBalanceSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  EllipsisVertical,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  SearchX,
  Users,
  Wallet,
} from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import CustomerBalanceModal from '~/components/whatsapp/CustomerBalanceModal.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useAuthStore } from '~/stores/auth'
import { useStoresStore } from '~/stores/stores'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import { usePreferences } from '~/composables/usePreferences'
import { useWhatsAppMessaging } from '~/composables/useWhatsAppMessaging'
import { useAnchoredRowMenu } from '~/composables/useAnchoredRowMenu'
import { getVisibleMenuAnchorElement } from '~/utils/menuAnchor'
import { getReceiptStatusLabel, getReceiptStatusTone } from '~/utils/receipt-status'
import {
  buildCustomerDirectory,
  filterCustomerDirectory,
  sortCustomerDirectory,
  type CustomerDirectoryEntry,
} from '~/utils/customer-directory'

definePageMeta({
  layout: 'dashboard',
})

const PAGE_SIZE = 50
const EMPTY_CELL = '—'

const route = useRoute()
const router = useRouter()
const { dashPath } = useDashboardPaths()
const receiptsStore = useReceiptsStore()
const authStore = useAuthStore()
const storesStore = useStoresStore()
const customerAccountsStore = useCustomerAccountsStore()
const { formatCurrency } = usePreferences()
const { hasBalanceFeature } = useWhatsAppMessaging()

const isLoading = ref(receiptsStore.receipts.length === 0)

async function loadCustomers(force = false) {
  try {
    await receiptsStore.fetchReceipts(force ? { force: true } : undefined)
  } catch (error) {
    console.error('Error loading customers:', error)
  } finally {
    isLoading.value = false
  }
  if (hasBalanceFeature.value) void customerAccountsStore.fetchAccountsForStore()
}

watch(
  () => authStore.currentUser,
  (user) => {
    if (user) void loadCustomers()
  },
  { immediate: true }
)

watch(
  () => storesStore.currentStoreId,
  (next, previous) => {
    if (next && previous && next !== previous) void loadCustomers(true)
  }
)

const customers = computed(() => buildCustomerDirectory(receiptsStore.receipts))

function balanceOf(customer: CustomerDirectoryEntry): number {
  if (!hasBalanceFeature.value) return 0
  return customerAccountsStore.getBalanceForContactKey(customer.contactKey)
}

const repeatCustomers = computed(() => customers.value.filter((c) => c.receipts.length > 1))
const owingCustomers = computed(() => customers.value.filter((c) => balanceOf(c) > 0))

const headerMetrics = computed(() => {
  const total = customers.value.reduce((sum, c) => sum + c.totalSpent, 0)
  const metrics: Array<{ key: string; label: string; value: string; tone?: 'warning' }> = [
    { key: 'customers', label: 'Customers', value: String(customers.value.length) },
    { key: 'repeat', label: 'Repeat customers', value: String(repeatCustomers.value.length) },
    {
      key: 'average',
      label: 'Average spend',
      value: formatCurrency(customers.value.length ? total / customers.value.length : 0),
    },
  ]
  if (hasBalanceFeature.value) {
    const owed = owingCustomers.value.reduce((sum, c) => sum + balanceOf(c), 0)
    metrics.push({
      key: 'owed',
      label: 'Owed to you',
      value: formatCurrency(owed),
      tone: owed > 0 ? 'warning' : undefined,
    })
  }
  return metrics
})

type Segment = 'all' | 'repeat' | 'owing'
const segment = ref<Segment>('all')
const segmentTabs = computed(() => {
  const tabs = [
    { value: 'all', label: 'All', count: customers.value.length },
    { value: 'repeat', label: 'Repeat', count: repeatCustomers.value.length },
  ]
  if (hasBalanceFeature.value) {
    tabs.push({ value: 'owing', label: 'Owe money', count: owingCustomers.value.length })
  }
  return tabs
})

const searchQuery = ref('')
const sortBy = ref('lastOrder')
const sortOptions = [
  { value: 'lastOrder', label: 'Sort: Recent' },
  { value: 'name', label: 'Sort: Name' },
  { value: 'orders', label: 'Sort: Orders' },
  { value: 'spent', label: 'Sort: Spent' },
]

const visibleCustomers = computed(() => {
  const pool =
    segment.value === 'repeat'
      ? repeatCustomers.value
      : segment.value === 'owing'
        ? owingCustomers.value
        : customers.value
  return sortCustomerDirectory(filterCustomerDirectory(pool, searchQuery.value), sortBy.value)
})

const currentPage = ref(1)
const paginatedCustomers = computed(() =>
  visibleCustomers.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)
watch([segment, searchQuery, sortBy], () => {
  currentPage.value = 1
})

function onPageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearFilters() {
  searchQuery.value = ''
  segment.value = 'all'
}

function customerSubtitle(customer: CustomerDirectoryEntry) {
  const orders = `${customer.receipts.length} order${customer.receipts.length === 1 ? '' : 's'}`
  const contact = customer.phone || customer.email
  return contact ? `${contact} · ${orders}` : orders
}

function formatDate(date: unknown) {
  const value = date instanceof Date ? date : new Date((date as { toDate?: () => Date })?.toDate?.() ?? (date as string))
  return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function receiptSummary(receipt: Receipt) {
  const names = (receipt.items ?? []).map((item) => item.itemName).filter(Boolean)
  if (names.length === 0) return `${receipt.itemsCount} item${receipt.itemsCount === 1 ? '' : 's'}`
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
}

// Detail sheet
const showDetail = ref(false)
const selectedCustomerId = ref<string | null>(null)
const selectedCustomer = computed(
  () => customers.value.find((c) => c.id === selectedCustomerId.value) ?? null
)
const selectedCustomerReceipts = computed(() => {
  const customer = selectedCustomer.value
  if (!customer) return []
  const ids = new Set(customer.receipts)
  return receiptsStore.receipts
    .filter((receipt) => ids.has(receipt.id))
    .sort((a, b) => toTime(b.date) - toTime(a.date))
})

function toTime(date: unknown) {
  const d = (date as { toDate?: () => Date })?.toDate?.() ?? new Date(date as string)
  return d.getTime()
}

function openCustomer(customer: CustomerDirectoryEntry) {
  selectedCustomerId.value = customer.id
  showDetail.value = true
}

function goToReceipt(receipt: Receipt) {
  showDetail.value = false
  void router.push({ path: dashPath('/receipts'), query: { tab: 'receipts', highlight: receipt.id } })
}

// Deep links (`?customer=<id>`) open that customer's sheet.
watch(
  [() => route.query.customer, isLoading],
  ([id, loading]) => {
    if (loading || typeof id !== 'string' || !id) return
    const customer = customers.value.find((c) => c.id === id)
    if (customer) openCustomer(customer)
    const { customer: _customer, ...query } = route.query
    void router.replace({ query })
  },
  { immediate: true }
)

// Balance
const showBalanceModal = ref(false)
const balanceTarget = ref<CustomerDirectoryEntry | null>(null)

function openBalance(customer: CustomerDirectoryEntry) {
  balanceTarget.value = customer
  showBalanceModal.value = true
}

function onBalanceSaved() {
  void customerAccountsStore.fetchAccountsForStore()
}

// Row menu
const { openMenuId, menuFixedStyle, toggleMenu } = useAnchoredRowMenu({
  anchorAttr: 'data-customer-actions-anchor',
  estimatedMenuHeight: 104,
})

const customerForMenu = computed(
  () => customers.value.find((c) => c.id === openMenuId.value) ?? null
)

function runMenuAction(action: (customer: CustomerDirectoryEntry) => unknown) {
  const customer = customerForMenu.value
  openMenuId.value = null
  if (customer) action(customer)
}

function closeCustomerMenu() {
  const id = openMenuId.value
  openMenuId.value = null
  if (id) nextTick(() => getVisibleMenuAnchorElement('data-customer-actions-anchor', id)?.focus())
}
</script>
