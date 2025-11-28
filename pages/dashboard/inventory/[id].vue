<template>
  <div class="space-y-6">
    <!-- Enhanced Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-4 flex-1">
        <button
          @click="navigateTo('/dashboard/inventory')"
          class="mt-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          title="Back to folders"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                getFolderColorClass(folder?.color || 'blue')
              ]"
            >
              <FolderIcon class="w-7 h-7 text-white" />
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ folder?.name || 'Loading...' }}
              </h1>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ folder?.description || 'No description' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4" />
              <span>Created {{ formatDate(folder?.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CubeIcon class="w-4 h-4" />
              <span>{{ folder?.itemCount || 0 }} items</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ folder?.itemCount || 0 }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Items in this folder</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CubeIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(folder?.totalValue || 0) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Inventory value</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ folder?.lowStockCount || 0 }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Need restocking</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ExclamationTriangleIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">In Stock</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ (folder?.itemCount || 0) - (folder?.lowStockCount || 0) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Items available</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Enhanced Filters Section -->
    <Card padding="md">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, SKU..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="stockFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <select
          v-model="sortBy"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="name">Sort by Name</option>
          <option value="stock">Sort by Stock</option>
          <option value="price">Sort by Price</option>
          <option value="sku">Sort by SKU</option>
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

    <!-- Enhanced Items Table -->
    <Card padding="none">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="column.sortable && toggleSort(column.key)"
              >
                <div class="flex items-center gap-2">
                  {{ column.label }}
                  <template v-if="column.sortable">
                    <ChevronUpIcon
                      v-if="currentSort.key === column.key && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === column.key && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in paginatedItems"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {{ item.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ item.name }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ item.sku }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300 font-mono">
                  {{ item.sku }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    item.stock === 0
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      : item.stock < 10
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      : item.stock < 20
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  ]"
                >
                  <span class="w-2 h-2 rounded-full mr-2" :class="{
                    'bg-red-500': item.stock === 0,
                    'bg-orange-500': item.stock > 0 && item.stock < 10,
                    'bg-yellow-500': item.stock >= 10 && item.stock < 20,
                    'bg-green-500': item.stock >= 20
                  }"></span>
                  {{ item.stock }} units
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${{ formatCurrency(item.price) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="handleEditItem(item)"
                    class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="handleDeleteItem(item)"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="sortedFilteredItems.length === 0">
              <td :colspan="columns.length + 1" class="px-6 py-12">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <CubeIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery || stockFilter !== 'all' ? 'No items found' : 'No items in this folder' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ searchQuery || stockFilter !== 'all' ? 'Try adjusting your filters' : 'Add items to get started' }}
                  </p>
                  <Button
                    v-if="!searchQuery && stockFilter === 'all'"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openAddItemModal"
                  >
                    Add Your First Item
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <Pagination
        v-if="sortedFilteredItems.length > 0"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="sortedFilteredItems.length"
        @page-change="handlePageChange"
      />
    </Card>

    <!-- Floating Action Button -->
    <button
      v-if="sortedFilteredItems.length > 0"
      @click="openAddItemModal"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Add new item"
    >
      <PlusIcon class="w-6 h-6" />
    </button>

    <!-- Enhanced Add/Edit Item Modal -->
    <Modal
      v-model="showAddItemModal"
      :title="editingItem ? 'Edit Item' : 'Add New Item'"
      size="md"
    >
      <form @submit.prevent="handleSaveItem" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Item Name *
          </label>
          <input
            v-model="itemForm.name"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="Enter item name"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SKU *
            </label>
            <input
              v-model="itemForm.sku"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="SKU-001"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price *
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                v-model.number="itemForm.price"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stock Quantity *
          </label>
          <input
            v-model.number="itemForm.stock"
            type="number"
            min="0"
            required
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="0"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Items available in stock
          </p>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" @click="handleCancelItem">Cancel</Button>
        <Button variant="primary" type="submit" @click="handleSaveItem">
          {{ editingItem ? 'Update' : 'Add' }} Item
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  ArrowLeftIcon,
  FolderIcon,
  PlusIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarsArrowUpIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import Pagination from '~/components/ui/Pagination.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const folderId = computed(() => route.params.id as string)

interface Folder {
  id: string
  name: string
  description: string
  color: string
  itemCount: number
  totalValue: number
  lowStockCount: number
  createdAt?: string
}

interface InventoryItem {
  id: string
  name: string
  sku: string
  stock: number
  price: number
}

const folder = ref<Folder | null>(null)
const items = ref<InventoryItem[]>([])
const searchQuery = ref('')
const stockFilter = ref('all')
const sortBy = ref('name')
const showAddItemModal = ref(false)
const editingItem = ref<InventoryItem | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)

const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' })

const itemForm = reactive({
  name: '',
  sku: '',
  price: 0,
  stock: 0,
})

// Sample folders data
const foldersData: Folder[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic items and gadgets',
    color: 'blue',
    itemCount: 45,
    totalValue: 12500,
    lowStockCount: 3,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    color: 'pink',
    itemCount: 120,
    totalValue: 8500,
    lowStockCount: 8,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Food & Beverages',
    description: 'Food items and drinks',
    color: 'orange',
    itemCount: 89,
    totalValue: 3200,
    lowStockCount: 12,
    createdAt: '2024-01-05',
  },
  {
    id: '4',
    name: 'Office Supplies',
    description: 'Stationery and office equipment',
    color: 'purple',
    itemCount: 67,
    totalValue: 2100,
    lowStockCount: 0,
    createdAt: '2024-01-20',
  },
  {
    id: '5',
    name: 'Home & Garden',
    description: 'Home improvement and garden items',
    color: 'green',
    itemCount: 34,
    totalValue: 5600,
    lowStockCount: 5,
    createdAt: '2024-01-12',
  },
  {
    id: '6',
    name: 'Toys & Games',
    description: 'Children toys and games',
    color: 'yellow',
    itemCount: 56,
    totalValue: 3400,
    lowStockCount: 2,
    createdAt: '2024-01-18',
  },
]

const columns = [
  { key: 'name', label: 'Item', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
]

const filteredItems = computed(() => {
  let result = [...items.value]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
    )
  }

  // Filter by stock status
  if (stockFilter.value !== 'all') {
    result = result.filter(item => {
      if (stockFilter.value === 'in-stock') return item.stock >= 20
      if (stockFilter.value === 'low-stock') return item.stock < 20 && item.stock > 0
      if (stockFilter.value === 'out-of-stock') return item.stock === 0
      return true
    })
  }

  return result
})

const sortedFilteredItems = computed(() => {
  const result = [...filteredItems.value]
  
  result.sort((a, b) => {
    let aValue = a[currentSort.value.key as keyof InventoryItem]
    let bValue = b[currentSort.value.key as keyof InventoryItem]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSort.value.order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return currentSort.value.order === 'asc'
        ? aValue - bValue
        : bValue - aValue
    }
    
    return 0
  })
  
  return result
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedFilteredItems.value.slice(start, end)
})

const toggleSort = (key: string) => {
  if (currentSort.value.key === key) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.key = key
    currentSort.value.order = 'asc'
  }
}

const getFolderColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  }
  return colorMap[color] || 'bg-gradient-to-br from-gray-500 to-gray-600'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  stockFilter.value = 'all'
  sortBy.value = 'name'
  currentSort.value = { key: 'name', order: 'asc' }
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openAddItemModal = () => {
  editingItem.value = null
  itemForm.name = ''
  itemForm.sku = ''
  itemForm.price = 0
  itemForm.stock = 0
  showAddItemModal.value = true
}

const handleEditItem = (item: InventoryItem) => {
  editingItem.value = item
  itemForm.name = item.name
  itemForm.sku = item.sku
  itemForm.price = item.price
  itemForm.stock = item.stock
  showAddItemModal.value = true
}

const handleDeleteItem = (item: InventoryItem) => {
  if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
    const index = items.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      items.value.splice(index, 1)
      // Update folder stats
      if (folder.value) {
        folder.value.itemCount--
        folder.value.totalValue -= item.price * item.stock
        if (item.stock < 10) {
          folder.value.lowStockCount--
        }
      }
    }
  }
}

const handleSaveItem = () => {
  if (!itemForm.name.trim() || !itemForm.sku.trim()) {
    alert('Please fill in all required fields')
    return
  }

  if (editingItem.value) {
    // Update existing item
    const index = items.value.findIndex(i => i.id === editingItem.value!.id)
    if (index > -1) {
      const oldItem = items.value[index]
      if (oldItem) {
        items.value[index] = { ...itemForm, id: editingItem.value.id }
        
        // Update folder stats
        if (folder.value) {
          folder.value.totalValue -= oldItem.price * oldItem.stock
          folder.value.totalValue += itemForm.price * itemForm.stock
          
          // Update low stock count
          if (oldItem.stock < 10 && itemForm.stock >= 10) {
            folder.value.lowStockCount--
          } else if (oldItem.stock >= 10 && itemForm.stock < 10) {
            folder.value.lowStockCount++
          }
        }
      }
    }
  } else {
    // Add new item
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      ...itemForm,
    }
    items.value.push(newItem)
    // Update folder stats
    if (folder.value) {
      folder.value.itemCount++
      folder.value.totalValue += newItem.price * newItem.stock
      if (newItem.stock < 10) {
        folder.value.lowStockCount++
      }
    }
  }
  handleCancelItem()
}

const handleCancelItem = () => {
  showAddItemModal.value = false
  editingItem.value = null
  itemForm.name = ''
  itemForm.sku = ''
  itemForm.price = 0
  itemForm.stock = 0
}

// Load folder and items
onMounted(() => {
  // Find folder
  folder.value = foldersData.find(f => f.id === folderId.value) || null

  // Load sample items for this folder
  if (folderId.value === '1') {
    items.value = [
      { id: '1', name: 'Wireless Mouse', sku: 'ELEC-001', stock: 45, price: 29.99 },
      { id: '2', name: 'USB Keyboard', sku: 'ELEC-002', stock: 32, price: 49.99 },
      { id: '3', name: 'Webcam HD', sku: 'ELEC-003', stock: 5, price: 79.99 },
      { id: '4', name: 'Bluetooth Speaker', sku: 'ELEC-004', stock: 18, price: 89.99 },
      { id: '5', name: 'USB-C Hub', sku: 'ELEC-005', stock: 22, price: 64.99 },
    ]
  } else {
    // Generate sample items for other folders
    items.value = Array.from({ length: 10 }, (_, i) => ({
      id: `${folderId.value}-${i + 1}`,
      name: `${folder.value?.name || 'Item'} ${i + 1}`,
      sku: `${folder.value?.name.substring(0, 4).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      stock: Math.floor(Math.random() * 100),
      price: Math.floor(Math.random() * 500) + 10,
    }))
  }

  useHead({
    title: `${folder.value?.name || 'Folder'} - Inventory - Storv`,
  })
})
</script>
