<template>
  <div class="space-y-6 pb-24">
    <!-- Page Header -->
      <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Receipts</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">View and manage all sales receipts</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Receipts</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ receipts.length }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All time</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ReceiptPercentIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(totalSales) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All time revenue</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Sales</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(todaySales) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">{{ todayReceipts }} receipts</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(monthSales) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">{{ monthReceipts }} receipts</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <Card padding="md">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by receipt number, customer..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          v-model="dateFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <Button
          variant="outline"
          @click="resetFilters"
          :icon="ArrowPathIcon"
        >
          Reset
        </Button>
      </div>
    </Card>

    <!-- Receipts Table -->
    <Card padding="none">
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Receipt #
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Customer
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Items
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Total
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Payment
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="receipt in paginatedReceipts"
              :key="receipt.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ receipt.receiptNumber }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ receipt.customerName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ receipt.customerEmail }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDate(receipt.date) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(receipt.date) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ receipt.itemsCount }} items
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${{ formatCurrency(receipt.total) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ receipt.paymentMethod }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    receipt.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : receipt.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="handleViewReceipt(receipt)"
                    class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="View"
                  >
                    <EyeIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="handlePrintReceipt(receipt)"
                    class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Print"
                  >
                    <PrinterIcon class="w-5 h-5" />
          </button>
                  <button
                    v-if="receipt.status === 'completed'"
                    @click="handleRefundReceipt(receipt)"
                    class="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    title="Refund"
                  >
                    <ArrowPathIcon class="w-5 h-5" />
          </button>
        </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="filteredReceipts.length === 0">
              <td colspan="8" class="px-6 py-12">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <ReceiptPercentIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'No receipts found' : 'No receipts yet' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first receipt to get started' }}
                  </p>
                  <Button
                    v-if="!searchQuery && statusFilter === 'all' && dateFilter === 'all'"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openCreateReceiptModal"
                  >
                    Create First Receipt
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Fixed Pagination -->
    <div
      v-if="filteredReceipts.length > 0"
      class="fixed bottom-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'"
      style="left: 0;"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredReceipts.length"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Floating Action Button -->
    <button
      v-if="filteredReceipts.length > 0"
      @click="openCreateReceiptModal"
      class="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Create new receipt"
    >
      <PlusIcon class="w-6 h-6" />
    </button>

    <!-- Create Receipt Modal -->
    <CreateReceiptModal
      v-model="showCreateReceiptModal"
      @receipt-created="handleReceiptCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  PlusIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  PrinterIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Receipts - Storv',
})

interface Receipt {
  id: string
  receiptNumber: string
  customerName: string
  customerEmail: string
  date: string
  itemsCount: number
  total: number
  paymentMethod: string
  status: 'completed' | 'pending' | 'refunded'
}

const receipts = ref<Receipt[]>([
  {
    id: '1',
    receiptNumber: 'REC-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    date: new Date().toISOString(),
    itemsCount: 3,
    total: 149.97,
    paymentMethod: 'Card',
    status: 'completed',
  },
  {
    id: '2',
    receiptNumber: 'REC-002',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    date: new Date(Date.now() - 86400000).toISOString(),
    itemsCount: 5,
    total: 289.50,
    paymentMethod: 'Cash',
    status: 'completed',
  },
  {
    id: '3',
    receiptNumber: 'REC-003',
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    date: new Date(Date.now() - 172800000).toISOString(),
    itemsCount: 2,
    total: 89.99,
    paymentMethod: 'Mobile Money',
    status: 'pending',
  },
])

const searchQuery = ref('')
const statusFilter = ref('all')
const dateFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sidebarCollapsed = ref(false)

// Load sidebar state from localStorage
if (import.meta.client) {
  try {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Watch for sidebar state changes
if (import.meta.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'sidebarCollapsed' && e.newValue !== null) {
      sidebarCollapsed.value = e.newValue === 'true'
    }
  })
  // Also check periodically for changes (since storage event doesn't fire on same window)
  setInterval(() => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        const newValue = savedState === 'true'
        if (newValue !== sidebarCollapsed.value) {
          sidebarCollapsed.value = newValue
        }
      }
    } catch (e) {
      // Ignore
    }
  }, 100)
}

const totalSales = computed(() => {
  return receipts.value
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.total, 0)
})

const todaySales = computed(() => {
  const today = new Date().toDateString()
  return receipts.value
    .filter(r => r.status === 'completed' && new Date(r.date).toDateString() === today)
    .reduce((sum, r) => sum + r.total, 0)
})

const todayReceipts = computed(() => {
  const today = new Date().toDateString()
  return receipts.value.filter(r => new Date(r.date).toDateString() === today).length
})

const monthSales = computed(() => {
  const now = new Date()
  return receipts.value
    .filter(r => {
      const receiptDate = new Date(r.date)
      return r.status === 'completed' &&
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, r) => sum + r.total, 0)
})

const monthReceipts = computed(() => {
  const now = new Date()
  return receipts.value.filter(r => {
    const receiptDate = new Date(r.date)
    return receiptDate.getMonth() === now.getMonth() &&
      receiptDate.getFullYear() === now.getFullYear()
  }).length
})

const filteredReceipts = computed(() => {
  let result = [...receipts.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.receiptNumber.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.customerEmail.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(r => r.status === statusFilter.value)
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    result = result.filter(r => {
      const receiptDate = new Date(r.date)
      switch (dateFilter.value) {
        case 'today':
          return receiptDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return receiptDate >= weekAgo
        case 'month':
          return receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
})

const paginatedReceipts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredReceipts.value.slice(start, end)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFilter.value = 'all'
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const showCreateReceiptModal = ref(false)

const openCreateReceiptModal = () => {
  showCreateReceiptModal.value = true
}

const handleReceiptCreated = (receipt: Receipt) => {
  receipts.value.unshift(receipt)
  showCreateReceiptModal.value = false
}

const handleViewReceipt = (receipt: Receipt) => {
  // TODO: Implement view receipt
  alert(`Viewing receipt ${receipt.receiptNumber}`)
}

const handlePrintReceipt = (receipt: Receipt) => {
  // TODO: Implement print receipt
  alert(`Printing receipt ${receipt.receiptNumber}`)
}

const handleRefundReceipt = (receipt: Receipt) => {
  if (confirm(`Are you sure you want to refund receipt ${receipt.receiptNumber}?`)) {
    const index = receipts.value.findIndex(r => r.id === receipt.id)
    if (index > -1 && receipts.value[index]) {
      receipts.value[index].status = 'refunded'
    }
  }
}
</script>

