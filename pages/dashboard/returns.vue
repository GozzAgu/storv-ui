<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Returns</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage product returns and refunds</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Returns</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ returns.length }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All time</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ArrowPathIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-red-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ pendingReturns }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Awaiting processing</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ClockIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Refunded</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(totalRefunded) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Total refunded</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ monthReturns }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Returns processed</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
            placeholder="Search by return number, receipt, customer..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="refunded">Refunded</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          v-model="reasonFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Reasons</option>
          <option value="defective">Defective</option>
          <option value="wrong-item">Wrong Item</option>
          <option value="damaged">Damaged</option>
          <option value="other">Other</option>
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

    <!-- Returns Table -->
    <Card padding="none">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Return #
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Receipt #
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Customer
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Items
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Amount
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Reason
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Date
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
              v-for="returnItem in paginatedReturns"
              :key="returnItem.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ returnItem.returnNumber }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ returnItem.receiptNumber }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ returnItem.customerName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ returnItem.customerEmail }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ returnItem.itemsCount }} items
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${{ formatCurrency(returnItem.amount) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ returnItem.reason }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDate(returnItem.date) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    returnItem.status === 'refunded'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : returnItem.status === 'approved'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : returnItem.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="handleViewReturn(returnItem)"
                    class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="View"
                  >
                    <EyeIcon class="w-5 h-5" />
                  </button>
                  <button
                    v-if="returnItem.status === 'pending'"
                    @click="handleApproveReturn(returnItem)"
                    class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircleIcon class="w-5 h-5" />
                  </button>
                  <button
                    v-if="returnItem.status === 'approved'"
                    @click="handleProcessRefund(returnItem)"
                    class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Process Refund"
                  >
                    <CurrencyDollarIcon class="w-5 h-5" />
                  </button>
                  <button
                    v-if="returnItem.status === 'pending'"
                    @click="handleRejectReturn(returnItem)"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="filteredReturns.length === 0">
              <td colspan="9" class="px-6 py-12">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <ArrowPathIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery || statusFilter !== 'all' || reasonFilter !== 'all' ? 'No returns found' : 'No returns yet' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ searchQuery || statusFilter !== 'all' || reasonFilter !== 'all' ? 'Try adjusting your filters' : 'Returns will appear here when customers request refunds' }}
                  </p>
                  <Button
                    v-if="!searchQuery && statusFilter === 'all' && reasonFilter === 'all'"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openCreateReturnModal"
                  >
                    Create First Return
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <Pagination
        v-if="filteredReturns.length > 0"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredReturns.length"
        @page-change="handlePageChange"
      />
    </Card>

    <!-- Floating Action Button -->
    <button
      v-if="filteredReturns.length > 0"
      @click="openCreateReturnModal"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Create new return"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Returns - Storv',
})

interface Return {
  id: string
  returnNumber: string
  receiptNumber: string
  customerName: string
  customerEmail: string
  itemsCount: number
  amount: number
  reason: string
  date: string
  status: 'pending' | 'approved' | 'refunded' | 'rejected'
}

const returns = ref<Return[]>([
  {
    id: '1',
    returnNumber: 'RET-001',
    receiptNumber: 'REC-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    itemsCount: 1,
    amount: 29.99,
    reason: 'Defective',
    date: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: '2',
    returnNumber: 'RET-002',
    receiptNumber: 'REC-002',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    itemsCount: 2,
    amount: 89.99,
    reason: 'Wrong Item',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'approved',
  },
  {
    id: '3',
    returnNumber: 'RET-003',
    receiptNumber: 'REC-003',
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    itemsCount: 1,
    amount: 49.99,
    reason: 'Damaged',
    date: new Date(Date.now() - 172800000).toISOString(),
    status: 'refunded',
  },
])

const searchQuery = ref('')
const statusFilter = ref('all')
const reasonFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const pendingReturns = computed(() => {
  return returns.value.filter(r => r.status === 'pending').length
})

const totalRefunded = computed(() => {
  return returns.value
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + r.amount, 0)
})

const monthReturns = computed(() => {
  const now = new Date()
  return returns.value.filter(r => {
    const returnDate = new Date(r.date)
    return returnDate.getMonth() === now.getMonth() &&
      returnDate.getFullYear() === now.getFullYear()
  }).length
})

const filteredReturns = computed(() => {
  let result = [...returns.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.returnNumber.toLowerCase().includes(query) ||
      r.receiptNumber.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.customerEmail.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(r => r.status === statusFilter.value)
  }

  // Reason filter
  if (reasonFilter.value !== 'all') {
    result = result.filter(r => r.reason.toLowerCase().includes(reasonFilter.value.toLowerCase()))
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
})

const paginatedReturns = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredReturns.value.slice(start, end)
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

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  reasonFilter.value = 'all'
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openCreateReturnModal = () => {
  // TODO: Implement create return modal
  alert('Create return functionality coming soon!')
}

const handleViewReturn = (returnItem: Return) => {
  // TODO: Implement view return
  alert(`Viewing return ${returnItem.returnNumber}`)
}

const handleApproveReturn = (returnItem: Return) => {
  if (confirm(`Approve return ${returnItem.returnNumber}?`)) {
    const index = returns.value.findIndex(r => r.id === returnItem.id)
    if (index > -1 && returns.value[index]) {
      returns.value[index].status = 'approved'
    }
  }
}

const handleProcessRefund = (returnItem: Return) => {
  if (confirm(`Process refund of $${formatCurrency(returnItem.amount)} for return ${returnItem.returnNumber}?`)) {
    const index = returns.value.findIndex(r => r.id === returnItem.id)
    if (index > -1 && returns.value[index]) {
      returns.value[index].status = 'refunded'
    }
  }
}

const handleRejectReturn = (returnItem: Return) => {
  if (confirm(`Reject return ${returnItem.returnNumber}? This action cannot be undone.`)) {
    const index = returns.value.findIndex(r => r.id === returnItem.id)
    if (index > -1 && returns.value[index]) {
      returns.value[index].status = 'rejected'
    }
  }
}
</script>

