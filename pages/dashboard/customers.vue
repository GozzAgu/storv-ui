<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage your customer database and relationships</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ customers.length }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All customers</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UsersIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(totalRevenue) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All time sales</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ activeCustomers }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Purchased this month</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UserCircleIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Order Value</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(averageOrderValue) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Per customer</p>
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
            placeholder="Search by name, email, phone..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="sortBy"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="name">Sort by Name</option>
          <option value="orders">Sort by Orders</option>
          <option value="spent">Sort by Total Spent</option>
          <option value="recent">Most Recent</option>
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

    <!-- Customers Grid -->
    <div v-if="paginatedCustomers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="customer in paginatedCustomers"
        :key="customer.id"
        padding="md"
        extra-class="hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {{ customer.initials }}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ customer.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ customer.email }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click.stop="handleEditCustomer(customer)"
              class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Edit"
            >
              <PencilIcon class="w-5 h-5" />
            </button>
            <button
              @click.stop="handleDeleteCustomer(customer)"
              class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Phone:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ customer.phone }}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Orders:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ customer.orders }} orders
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Total Spent:</span>
            <span class="font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(customer.totalSpent) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Last Order:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatDate(customer.lastOrderDate) }}
            </span>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click.stop="handleViewCustomer(customer)"
            class="w-full px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else>
      <div class="text-center py-12">
        <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <UsersIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {{ searchQuery ? 'No customers found' : 'No customers yet' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search' : 'Add your first customer to get started' }}
        </p>
        <Button
          v-if="!searchQuery"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateCustomerModal"
        >
          Add First Customer
        </Button>
      </div>
    </Card>

    <!-- Pagination -->
    <Pagination
      v-if="filteredCustomers.length > 0"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total="filteredCustomers.length"
      @page-change="handlePageChange"
    />

    <!-- Floating Action Button -->
    <button
      v-if="filteredCustomers.length > 0"
      @click="openCreateCustomerModal"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Add new customer"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PlusIcon,
  UsersIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Customers - Storv',
})

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  orders: number
  totalSpent: number
  initials: string
  lastOrderDate: string
}

const customers = ref<Customer[]>([
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '+1 234 567 8900', 
    orders: 12, 
    totalSpent: 2450.50, 
    initials: 'JD',
    lastOrderDate: '2024-12-01'
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    phone: '+1 234 567 8901', 
    orders: 8, 
    totalSpent: 1890.99, 
    initials: 'JS',
    lastOrderDate: '2024-11-28'
  },
  { 
    id: 3, 
    name: 'Bob Wilson', 
    email: 'bob@example.com', 
    phone: '+1 234 567 8902', 
    orders: 15, 
    totalSpent: 3456.00, 
    initials: 'BW',
    lastOrderDate: '2024-12-05'
  },
  { 
    id: 4, 
    name: 'Alice Johnson', 
    email: 'alice@example.com', 
    phone: '+1 234 567 8903', 
    orders: 5, 
    totalSpent: 890.25, 
    initials: 'AJ',
    lastOrderDate: '2024-11-20'
  },
  { 
    id: 5, 
    name: 'Charlie Brown', 
    email: 'charlie@example.com', 
    phone: '+1 234 567 8904', 
    orders: 20, 
    totalSpent: 5678.75, 
    initials: 'CB',
    lastOrderDate: '2024-12-08'
  },
  { 
    id: 6, 
    name: 'Diana Prince', 
    email: 'diana@example.com', 
    phone: '+1 234 567 8905', 
    orders: 3, 
    totalSpent: 456.50, 
    initials: 'DP',
    lastOrderDate: '2024-10-15'
  },
])

const searchQuery = ref('')
const sortBy = ref('name')
const currentPage = ref(1)
const itemsPerPage = ref(9)

const totalRevenue = computed(() => {
  return customers.value.reduce((sum, customer) => sum + customer.totalSpent, 0)
})

const activeCustomers = computed(() => {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return customers.value.filter(customer => {
    const lastOrder = new Date(customer.lastOrderDate)
    return lastOrder.getMonth() === thisMonth && lastOrder.getFullYear() === thisYear
  }).length
})

const averageOrderValue = computed(() => {
  if (customers.value.length === 0) return 0
  const totalOrders = customers.value.reduce((sum, customer) => sum + customer.orders, 0)
  if (totalOrders === 0) return 0
  return totalRevenue.value / totalOrders
})

const filteredCustomers = computed(() => {
  let result = [...customers.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    )
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'orders':
        return b.orders - a.orders
      case 'spent':
        return b.totalSpent - a.totalSpent
      case 'recent':
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      default:
        return 0
    }
  })

  return result
})

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCustomers.value.slice(start, end)
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
  sortBy.value = 'name'
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openCreateCustomerModal = () => {
  // TODO: Implement create customer modal
  alert('Create customer functionality coming soon!')
}

const handleViewCustomer = (customer: Customer) => {
  // TODO: Implement view customer details
  alert(`Viewing customer: ${customer.name}`)
}

const handleEditCustomer = (customer: Customer) => {
  // TODO: Implement edit customer modal
  alert(`Editing customer: ${customer.name}`)
}

const handleDeleteCustomer = (customer: Customer) => {
  if (confirm(`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`)) {
    const index = customers.value.findIndex(c => c.id === customer.id)
    if (index > -1) {
      customers.value.splice(index, 1)
    }
  }
}
</script>
