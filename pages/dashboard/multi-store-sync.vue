<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Multi-Store Sync</h1>
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Transfer items between stores and view consolidated reports</p>
      </div>
    </div>

    <!-- Access Denied Message -->
    <Card v-if="!canAccess" padding="sm" extra-class="p-4">
      <div class="flex items-center gap-3">
        <ExclamationTriangleIcon class="w-8 h-8 text-orange-500 flex-shrink-0" />
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Access Restricted</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Only super admins can access multi-store sync features.</p>
        </div>
      </div>
    </Card>

    <!-- Main Content -->
    <template v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="sm" class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Stores</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{{ stores.length }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BuildingStorefrontIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card padding="sm" class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Transfers</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{{ transferHistory.length }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ArrowPathIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-4">
          <button
            @click="activeTab = 'transfer'"
            :class="[
              'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              activeTab === 'transfer'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            Transfer Items
          </button>
          <button
            @click="activeTab = 'reports'"
            :class="[
              'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            Consolidated Reports
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            Transfer History
          </button>
        </nav>
      </div>

      <!-- Transfer Items Tab -->
      <Card v-if="activeTab === 'transfer'" padding="sm" extra-class="p-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Transfer Items Between Stores</h2>
        
        <div class="space-y-4">
          <!-- Source Store -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Source Store</label>
            <select
              v-model="transferForm.sourceStoreId"
              @change="loadSourceStoreInventory"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select source store</option>
              <option v-for="store in stores" :key="store.id" :value="store.id">
                {{ store.name || store.branchName || store.id }}
              </option>
            </select>
          </div>

          <!-- Destination Store -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Destination Store</label>
            <select
              v-model="transferForm.destinationStoreId"
              @change="loadDestinationStoreFolders"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select destination store</option>
              <option v-for="store in stores.filter(s => s.id !== transferForm.sourceStoreId)" :key="store.id" :value="store.id">
                {{ store.name || store.branchName || store.id }}
              </option>
            </select>
          </div>

          <!-- Destination Folder -->
          <div v-if="transferForm.destinationStoreId">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Destination Folder</label>
            <select
              v-model="transferForm.destinationFolderId"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select destination folder</option>
              <option v-for="folder in destinationFolders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Select which folder in the destination store to transfer items to</p>
          </div>

          <!-- Inventory Folder -->
          <div v-if="transferForm.sourceStoreId">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Inventory Folder</label>
            <select
              v-model="transferForm.folderId"
              @change="loadFolderItems"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select folder</option>
              <option v-for="folder in sourceFolders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>
          </div>

          <!-- Items List -->
          <div v-if="transferForm.folderId && availableItems.length > 0" class="space-y-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Select Items to Transfer</label>
            <div class="border border-gray-200 dark:border-gray-700 rounded-md max-h-64 overflow-y-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Item</th>
                    <th v-if="!currentFolderHasSerialNumbers" class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Available</th>
                    <th v-if="!currentFolderHasSerialNumbers" class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Transfer Qty</th>
                    <th v-else class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Select</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="item in availableItems" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="px-3 py-2">
                      <div>
                        <div class="flex items-center gap-2">
                          <p class="font-medium text-gray-900 dark:text-gray-100">{{ item.name || item.itemName || 'Unnamed Item' }}</p>
                        </div>
                        <p v-if="item.brand && item.model" class="text-gray-500 dark:text-gray-400 text-[10px]">
                          {{ item.brand }} {{ item.model }}
                        </p>
                        <p v-if="item.serialNo || item.serialNumber" class="text-gray-500 dark:text-gray-400 text-[10px]">
                          Serial: {{ item.serialNo || item.serialNumber }}
                        </p>
                      </div>
                    </td>
                    <td v-if="!currentFolderHasSerialNumbers" class="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {{ getAvailableQuantity(item) }}
                    </td>
                    <td v-if="!currentFolderHasSerialNumbers" class="px-3 py-2">
                      <input
                        v-model.number="transferForm.items[item.id]"
                        type="number"
                        :max="getAvailableQuantity(item)"
                        min="0"
                        class="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </td>
                    <td v-else class="px-3 py-2">
                      <input
                        v-model="transferForm.items[item.id]"
                        type="checkbox"
                        :true-value="1"
                        :false-value="0"
                        class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
            <textarea
              v-model="transferForm.notes"
              rows="3"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Add any notes about this transfer..."
            ></textarea>
          </div>

          <!-- Transfer Button -->
          <div class="flex justify-end">
            <button
              @click="handleTransfer"
              :disabled="!canTransfer || isTransferring"
              class="px-4 py-2 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowPathIcon v-if="isTransferring" class="w-4 h-4 animate-spin" />
              <ArrowsRightLeftIcon v-else class="w-4 h-4" />
              {{ isTransferring ? 'Transferring...' : 'Transfer Items' }}
            </button>
          </div>
        </div>
      </Card>

      <!-- Consolidated Reports Tab -->
      <div v-if="activeTab === 'reports'" class="space-y-4">
        <Card padding="sm" extra-class="p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Consolidated Reports</h2>
          
          <!-- Report Filters -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <select
                v-model="reportFilters.dateRange"
                @change="loadConsolidatedReports"
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Stores</label>
              <select
                v-model="reportFilters.storeIds"
                @change="loadConsolidatedReports"
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All stores</option>
                <option v-for="store in stores" :key="store.id" :value="store.id">
                  {{ store.name || store.branchName || store.id }}
                </option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="exportConsolidatedReport"
                class="w-full px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon class="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          <!-- Report Summary -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card padding="sm" class="p-3">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{{ formatCurrency(consolidatedReport.totalRevenue) }}</p>
            </Card>
            <Card padding="sm" class="p-3">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Sales</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{{ consolidatedReport.totalSales }}</p>
            </Card>
            <Card padding="sm" class="p-3">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Items</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{{ consolidatedReport.totalItems }}</p>
            </Card>
            <Card padding="sm" class="p-3">
              <p class="text-xs text-gray-600 dark:text-gray-400">Avg Order Value</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{{ formatCurrency(consolidatedReport.avgOrderValue) }}</p>
            </Card>
          </div>

          <!-- Store Breakdown -->
          <div class="mt-4">
            <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Store Breakdown</h3>
            <div class="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <table class="w-full text-xs">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Store</th>
                    <th class="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                    <th class="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Sales</th>
                    <th class="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Items</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="store in consolidatedReport.storeBreakdown" :key="store.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="px-3 py-2 text-gray-900 dark:text-gray-100">{{ store.name }}</td>
                    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ formatCurrency(store.revenue) }}</td>
                    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ store.sales }}</td>
                    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ store.items }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      <!-- Transfer History Tab -->
      <Card v-if="activeTab === 'history'" padding="sm" extra-class="p-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Transfer History</h2>
        
        <div v-if="transferHistory.length === 0" class="text-center py-8">
          <p class="text-xs text-gray-500 dark:text-gray-400">No transfer history found</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="transfer in transferHistory"
            :key="transfer.id"
            class="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <ArrowsRightLeftIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {{ getStoreName(transfer.sourceStoreId) }} → {{ getStoreName(transfer.destinationStoreId) }}
                  </p>
                </div>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
                  {{ transfer.itemsCount }} items • {{ formatDate(transfer.createdAt) }}
                </p>
                <!-- Item Details -->
                <div v-if="transfer.items && transfer.items.length > 0" class="space-y-1 mt-1.5">
                  <div
                    v-for="(item, idx) in transfer.items.slice(0, 3)"
                    :key="idx"
                    class="text-[10px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5"
                  >
                    <span class="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                    <span>
                      {{ item.itemName || 'Item' }}
                      <span v-if="item.serialNumber" class="text-gray-500 dark:text-gray-500">({{ item.serialNumber }})</span>
                    </span>
                  </div>
                  <div v-if="transfer.items.length > 3" class="text-[10px] text-gray-500 dark:text-gray-500 italic pl-2.5">
                    and {{ transfer.items.length - 3 }} more item{{ transfer.items.length - 3 > 1 ? 's' : '' }}
                  </div>
                </div>
                <p v-if="transfer.notes" class="text-[10px] text-gray-600 dark:text-gray-400 mt-1.5 italic">{{ transfer.notes }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-[10px] font-medium rounded',
                  transfer.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                ]"
              >
                {{ transfer.status }}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
import { useToast } from '~/composables/useToast'
import { useFirestore } from '~/composables/useFirestore'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Multi-Store Sync - Storvv',
})

const { formatCurrency } = usePreferences()
const toast = useToast()
const storesStore = useStoresStore()
const inventoryStore = useInventoryStore()
const userStore = useUserStore()
const { isStaff } = usePermissions()

// Security check - only super admins can access
const canAccess = computed(() => !isStaff.value)

// State
const activeTab = ref<'transfer' | 'reports' | 'history'>('transfer')
const stores = ref<any[]>([])
const sourceFolders = ref<any[]>([])
const destinationFolders = ref<any[]>([])
const availableItems = ref<any[]>([])
const transferHistory = ref<any[]>([])
const isTransferring = ref(false)

// Transfer Form
const transferForm = ref({
  sourceStoreId: '',
  destinationStoreId: '',
  folderId: '',
  destinationFolderId: '',
  items: {} as Record<string, number>,
  notes: '',
})

// Report Filters
const reportFilters = ref({
  dateRange: '30',
  storeIds: 'all',
})

// Consolidated Report
const consolidatedReport = ref({
  totalRevenue: 0,
  totalSales: 0,
  totalItems: 0,
  avgOrderValue: 0,
  storeBreakdown: [] as any[],
})

// Computed
const currentFolderHasSerialNumbers = computed(() => {
  const folder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
  return folder?.hasSerialNumbers || false
})

const canTransfer = computed(() => {
  return (
    transferForm.value.sourceStoreId &&
    transferForm.value.destinationStoreId &&
    transferForm.value.folderId &&
    transferForm.value.destinationFolderId &&
    Object.values(transferForm.value.items).some(qty => qty > 0)
  )
})


// Helper function to remove undefined values from object (Firestore doesn't allow undefined)
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined)
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value)
      }
    }
    return cleaned
  }
  return obj
}

// Methods
const loadStores = async () => {
  try {
    await storesStore.fetchStores()
    stores.value = storesStore.stores
  } catch (error: any) {
    toast.error('Failed to load stores: ' + error.message)
  }
}

const loadSourceStoreInventory = async () => {
  if (!transferForm.value.sourceStoreId) return
  
  const storeId = transferForm.value.sourceStoreId
  
  try {
    // Switch to source store temporarily to load inventory
    const currentStoreId = storesStore.currentStoreId
    await storesStore.setCurrentStore(storeId)
    
    // Fetch folders
    await inventoryStore.fetchFolders()
    sourceFolders.value = inventoryStore.folders
    
    // Restore original store
    if (currentStoreId) {
      await storesStore.setCurrentStore(currentStoreId)
    }
  } catch (error: any) {
    toast.error('Failed to load inventory: ' + error.message)
  }
}

const loadDestinationStoreFolders = async () => {
  if (!transferForm.value.destinationStoreId) {
    destinationFolders.value = []
    transferForm.value.destinationFolderId = ''
    return
  }
  
  try {
    // Switch to destination store temporarily to load folders
    const currentStoreId = storesStore.currentStoreId
    await storesStore.setCurrentStore(transferForm.value.destinationStoreId)
    
    // Fetch folders
    await inventoryStore.fetchFolders()
    destinationFolders.value = inventoryStore.folders
    
    // Restore original store
    if (currentStoreId) {
      await storesStore.setCurrentStore(currentStoreId)
    }
  } catch (error: any) {
    toast.error('Failed to load destination folders: ' + error.message)
    destinationFolders.value = []
  }
}

const loadFolderItems = async () => {
  if (!transferForm.value.folderId || !transferForm.value.sourceStoreId) return
  
  try {
    const currentStoreId = storesStore.currentStoreId
    await storesStore.setCurrentStore(transferForm.value.sourceStoreId)
    
    await inventoryStore.fetchItems(transferForm.value.folderId)
    const folderItems = inventoryStore.items[transferForm.value.folderId] || []
    
    // Get folder info to check if it has serial numbers
    const folder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
    const hasSerialNumbers = folder?.hasSerialNumbers || false
    
    // Filter items based on type
    if (hasSerialNumbers) {
      // For serial numbers, only show unsold items (no dateOut) that haven't been transferred
      availableItems.value = folderItems.filter(item => {
        const dateOut = item.dateOut
        const isSold = dateOut && dateOut !== null && dateOut !== ''
        if (isSold) return false
        
        // Filter out items that have been transferred
        const isTransferred = item.isTransferred || item.transferredTo
        if (isTransferred) return false
        
        return true
      })
    } else {
      // For bulk items, show items that have available quantity (not sold and quantity > 0) and haven't been transferred
      availableItems.value = folderItems.filter(item => {
        const dateOut = item.dateOut
        const isSold = dateOut && dateOut !== null && dateOut !== ''
        if (isSold) return false
        
        // Filter out items that have been transferred
        const isTransferred = item.isTransferred || item.transferredTo
        if (isTransferred) return false
        
        const quantity = item.quantity || item.Quantity || 0
        return quantity > 0
      })
    }
    
    if (currentStoreId) {
      await storesStore.setCurrentStore(currentStoreId)
    }
  } catch (error: any) {
    toast.error('Failed to load items: ' + error.message)
  }
}

const getAvailableQuantity = (item: any) => {
  // Get folder info from sourceFolders
  const folder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
  const hasSerialNumbers = folder?.hasSerialNumbers || false
  
  if (hasSerialNumbers) {
    // For serial numbers, each unsold item counts as 1
    // Since we already filtered out sold items, each item in availableItems is available
    return 1
  }
  
  // For bulk items, use quantity field
  // Make sure we're not counting sold items
  const dateOut = item.dateOut
  if (dateOut && dateOut !== null && dateOut !== '') {
    return 0 // Item is sold
  }
  
  return item.quantity || item.Quantity || 0
}

const handleTransfer = async () => {
  if (!canTransfer.value) return
  
  isTransferring.value = true
  try {
    const itemsToTransfer = Object.entries(transferForm.value.items)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, quantity: qty }))
    
    // Get current user ID
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      throw new Error('Only super admins can transfer items')
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    // Get folder info to check if it has serial numbers
    const sourceFolder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
    const hasSerialNumbers = sourceFolder?.hasSerialNumbers || false

    // Import Firebase functions
    const { doc, getDoc, setDoc, updateDoc, serverTimestamp, query, where, getDocs } = await import('firebase/firestore')
    const { getInventoryItemDocument, getInventoryItemsCollection, getStoreDocument } = await import('~/composables/useFirestorePaths')

    // For super admins, use their own UID directly in Firestore paths
    // This ensures userId in path matches request.auth.uid, which Firestore rules check
    // The rules allow operations when userId == request.auth.uid
    const pathUserId = userId // Always use current user's UID for super admins
    
    // Verify both stores belong to the user
    const sourceStoreRef = getStoreDocument(db, pathUserId, transferForm.value.sourceStoreId)
    const destStoreRef = getStoreDocument(db, pathUserId, transferForm.value.destinationStoreId)
    
    const [sourceStoreSnap, destStoreSnap] = await Promise.all([
      getDoc(sourceStoreRef),
      getDoc(destStoreRef)
    ])
    
    if (!sourceStoreSnap.exists() || !destStoreSnap.exists()) {
      throw new Error('One or both stores not found')
    }
    
    const sourceStore = sourceStoreSnap.data()
    const destStore = destStoreSnap.data()
    
    if (sourceStore.ownerId !== userId || destStore.ownerId !== userId) {
      throw new Error('You do not have permission to transfer items between these stores')
    }

    const transferredItems: any[] = []
    const errors: string[] = []

    // Process each item to transfer
    for (const { itemId, quantity } of itemsToTransfer) {
      try {
        // Get source item
        // Use pathUserId to ensure Firestore rules allow access (userId in path must match request.auth.uid)
        // CRITICAL: pathUserId must equal request.auth.uid for Firestore rules to allow access
        console.log('[Transfer] Using pathUserId:', pathUserId, 'userId:', userId, 'auth.uid:', authStore.currentUser?.uid)
        const sourceItemRef = getInventoryItemDocument(db, pathUserId, transferForm.value.sourceStoreId, itemId)
        const sourceItemSnap = await getDoc(sourceItemRef)
        
        if (!sourceItemSnap.exists()) {
          errors.push(`Item ${itemId} not found`)
          continue
        }

        const sourceItem = sourceItemSnap.data()
        console.log('[Transfer] Source item createdBy:', sourceItem.createdBy, 'pathUserId:', pathUserId)
        
        // Check if item is sold
        if (sourceItem.dateOut) {
          errors.push(`Item ${itemId} has already been sold`)
          continue
        }

        if (hasSerialNumbers) {
          // For serial numbers, transfer the item itself (move, not duplicate)
          if (quantity !== 1) {
            errors.push(`Serial number items can only be transferred one at a time`)
            continue
          }

          // Create new item in destination store
          // Use pathUserId to ensure Firestore rules allow access
          const destItemsRef = getInventoryItemsCollection(db, pathUserId, transferForm.value.destinationStoreId)
          const { doc: createDoc, deleteDoc } = await import('firebase/firestore')
          const newItemRef = createDoc(destItemsRef)
          
          // Create new item in destination store
          // Set createdBy to current user to ensure Firestore rules allow it
          // Preserve original dateIn from source item
          const { createdBy: _createdBy, dateOut: _dateOut, id: _id, ...itemDataWithoutSystemFields } = sourceItem
          // Remove undefined values before setting document (Firestore doesn't allow undefined)
          const cleanedItemData = removeUndefined(itemDataWithoutSystemFields)
          console.log('[Transfer] Moving serial item to destination store:', transferForm.value.destinationStoreId, 'pathUserId:', pathUserId, 'createdBy:', userId, 'auth.uid:', authStore.currentUser?.uid)
          try {
            // First create in destination store
            // Preserve original dateIn from source item
            const originalDateIn = sourceItem.dateIn || sourceItem.DateIn || null
            await setDoc(newItemRef, {
              ...cleanedItemData,
              id: newItemRef.id,
              folderId: transferForm.value.destinationFolderId,
              storeId: transferForm.value.destinationStoreId,
              dateIn: originalDateIn, // Preserve original dateIn
              createdBy: userId, // Set to current user for Firestore rules
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              transferredFrom: transferForm.value.sourceStoreId,
              transferredFromFolder: transferForm.value.folderId,
              transferredAt: serverTimestamp(), // Transfer date
              isTransferred: true, // Mark as transferred item
            })
            console.log('[Transfer] Serial item created in destination store successfully')
            
            // Then delete from source store (move, not duplicate)
            console.log('[Transfer] Deleting serial item from source store:', transferForm.value.sourceStoreId)
            await deleteDoc(sourceItemRef)
            console.log('[Transfer] Serial item deleted from source store successfully')
          } catch (moveError: any) {
            console.error('[Transfer] Error moving item:', moveError)
            throw new Error(`Failed to move item: ${moveError.message}`)
          }

          // Store item details for transfer history (without quantity)
          const itemName = sourceItem.name || sourceItem.itemName || 'Unnamed Item'
          const itemSerial = sourceItem.serialNo || sourceItem.serialNumber || null
          transferredItems.push({ 
            itemId, 
            itemName,
            serialNumber: itemSerial
          })
        } else {
          // For bulk items, check available quantity
          const availableQty = sourceItem.quantity || sourceItem.Quantity || 0
          if (availableQty < quantity) {
            errors.push(`Insufficient quantity for item ${itemId}. Available: ${availableQty}, Requested: ${quantity}`)
            continue
          }

          // Remove transferred quantity from source store
          const newQty = availableQty - quantity
          console.log('[Transfer] Removing bulk item quantity from source store:', itemId, 'in store:', transferForm.value.sourceStoreId, 'pathUserId:', pathUserId, 'auth.uid:', authStore.currentUser?.uid, 'qty transferred:', quantity, 'remaining:', newQty)
          try {
            const { deleteDoc } = await import('firebase/firestore')
            
            if (newQty <= 0) {
              // All quantity transferred - delete the source item completely
              console.log('[Transfer] All quantity transferred, deleting source item completely')
              await deleteDoc(sourceItemRef)
              console.log('[Transfer] Source item deleted successfully')
            } else {
              // Partial transfer - reduce quantity in source (item stays but with reduced qty)
              console.log('[Transfer] Partial transfer, reducing source quantity to:', newQty)
              await updateDoc(sourceItemRef, {
                quantity: newQty,
                Quantity: newQty,
                updatedAt: serverTimestamp(),
              })
              console.log('[Transfer] Source item quantity reduced successfully')
            }
          } catch (updateError: any) {
            console.error('[Transfer] Error updating source item:', updateError)
            throw new Error(`Failed to remove quantity from source store: ${updateError.message}`)
          }

          // Check if item exists in destination store with same name
          // Use pathUserId to ensure Firestore rules allow access
          const destItemsRef = getInventoryItemsCollection(db, pathUserId, transferForm.value.destinationStoreId)
          const existingItemsQuery = query(
            destItemsRef,
            where('folderId', '==', transferForm.value.destinationFolderId),
            where('name', '==', sourceItem.name || sourceItem.itemName || '')
          )
          const existingItemsSnap = await getDocs(existingItemsQuery)
          
          if (existingItemsSnap.empty) {
            // Create new item in destination store
            // Set createdBy to current user to ensure Firestore rules allow it
            const { doc: createDoc } = await import('firebase/firestore')
            const newItemRef = createDoc(destItemsRef)
            const { createdBy: _, ...itemDataWithoutCreatedBy } = sourceItem
            // Remove undefined values before setting document (Firestore doesn't allow undefined)
            const cleanedItemData = removeUndefined(itemDataWithoutCreatedBy)
            // Preserve original dateIn from source item
            const originalDateIn = sourceItem.dateIn || sourceItem.DateIn || null
            await setDoc(newItemRef, {
              ...cleanedItemData,
              id: newItemRef.id,
              folderId: transferForm.value.destinationFolderId,
              storeId: transferForm.value.destinationStoreId,
              dateIn: originalDateIn, // Preserve original dateIn
              quantity: quantity,
              Quantity: quantity,
              createdBy: userId, // Set to current user for Firestore rules
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              transferredFrom: transferForm.value.sourceStoreId,
              transferredFromFolder: transferForm.value.folderId,
              transferredAt: serverTimestamp(), // Transfer date
            })
          } else {
            // Update existing item quantity
            const existingItem = existingItemsSnap.docs[0]
            if (existingItem) {
              const existingQty = existingItem.data().quantity || existingItem.data().Quantity || 0
              const existingData = existingItem.data()
              // Preserve original dateIn if it doesn't exist, or use the older one
              const originalDateIn = existingData.dateIn || existingData.DateIn || (sourceItem.dateIn || sourceItem.DateIn || null)
              await updateDoc(existingItem.ref, {
                quantity: existingQty + quantity,
                Quantity: existingQty + quantity,
                dateIn: originalDateIn, // Preserve original dateIn
                transferredAt: serverTimestamp(), // Update transfer date
                updatedAt: serverTimestamp(),
              })
            }
          }

          // Store item details for transfer history (without quantity)
          const itemName = sourceItem.name || sourceItem.itemName || 'Unnamed Item'
          transferredItems.push({ 
            itemId, 
            itemName
          })
        }
      } catch (error: any) {
        errors.push(`Error transferring item ${itemId}: ${error.message}`)
      }
    }

    // Create transfer record
    // Use pathUserId to ensure Firestore rules allow access
    const { collection } = await import('firebase/firestore')
    const transfersRef = collection(db, 'users', pathUserId, 'storeTransfers')
    const { doc: createDoc } = await import('firebase/firestore')
    const transferRef = createDoc(transfersRef)
    console.log('[Transfer] Creating transfer record, pathUserId:', pathUserId, 'createdBy:', userId, 'auth.uid:', authStore.currentUser?.uid)
    try {
      await setDoc(transferRef, {
        sourceStoreId: transferForm.value.sourceStoreId,
        destinationStoreId: transferForm.value.destinationStoreId,
        folderId: transferForm.value.folderId,
        destinationFolderId: transferForm.value.destinationFolderId,
        items: transferredItems,
        itemsCount: transferredItems.length,
        notes: transferForm.value.notes || '',
        status: errors.length > 0 ? 'partial' : 'completed',
        errors: errors.length > 0 ? errors : null,
        createdBy: userId,
        createdAt: serverTimestamp(),
      })
      console.log('[Transfer] Transfer record created successfully')
    } catch (recordError: any) {
      console.error('[Transfer] Error creating transfer record:', recordError)
      // Don't throw - transfer might have succeeded even if record creation failed
      console.warn('Transfer items succeeded but failed to create transfer record')
    }

    if (errors.length > 0) {
      toast.warning(`Transfer completed with ${errors.length} errors. ${transferredItems.length} items transferred.`)
    } else {
      toast.success(`Successfully transferred ${transferredItems.length} items!`)
    }

    // Reset form
    transferForm.value = {
      sourceStoreId: '',
      destinationStoreId: '',
      folderId: '',
      destinationFolderId: '',
      items: {},
      notes: '',
    }
    availableItems.value = []
    sourceFolders.value = []
    destinationFolders.value = []
    
    // Reload history
    await loadTransferHistory()
  } catch (error: any) {
    console.error('Transfer error:', error)
    const authStore = useAuthStore()
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      userId: authStore.currentUser?.uid,
      sourceStoreId: transferForm.value.sourceStoreId,
      destinationStoreId: transferForm.value.destinationStoreId,
    })
    
    // Provide more specific error message
    let errorMessage = 'Transfer failed: ' + error.message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      errorMessage = 'Permission denied. Please ensure:\n1. You are logged in as a super admin\n2. Both stores belong to you\n3. Firestore rules have been deployed to Firebase'
    }
    
    toast.error(errorMessage)
  } finally {
    isTransferring.value = false
  }
}

const loadTransferHistory = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) {
      console.log('[TransferHistory] No user ID')
      return
    }

    // Wait for user data to be loaded if not already
    if (!userStore.userData) {
      await userStore.fetchUserData(userId)
    }

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      console.log('[TransferHistory] User is not super admin, role:', userStore.userData?.role)
      return
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      console.error('[TransferHistory] Firestore not initialized')
      return
    }

    // Import Firebase functions
    const { collection, query, orderBy, getDocs, getDoc, where: firestoreWhere } = await import('firebase/firestore')
    const pathUserId = userId

    console.log('[TransferHistory] Loading transfer history for userId:', pathUserId, 'auth.uid:', authStore.currentUser?.uid)

    // Fetch transfer history from Firestore
    // The path must match: users/{userId}/storeTransfers where userId == request.auth.uid
    const transfersRef = collection(db, 'users', pathUserId, 'storeTransfers')
    
    try {
      // Try with orderBy first, if it fails due to missing index, try without
      let transfersQuery
      try {
        transfersQuery = query(transfersRef, orderBy('createdAt', 'desc'))
      } catch (queryError: any) {
        // If orderBy fails, try without it (might be missing index)
        console.warn('[TransferHistory] orderBy failed, trying without:', queryError.message)
        transfersQuery = query(transfersRef)
      }
      
      const transfersSnap = await getDocs(transfersQuery)

      console.log('[TransferHistory] Successfully loaded', transfersSnap.docs.length, 'transfers')

      // Sort manually if orderBy didn't work
      const transfers = transfersSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
        }
      })

      // Sort by createdAt descending if available
      const sortedTransfers: any[] = transfers.sort((a: any, b: any) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0))
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0))
        return bDate.getTime() - aDate.getTime()
      })

      // Fetch item details for transfers that don't have item names stored (backward compatibility)
      const { getInventoryItemDocument, getInventoryItemsCollection } = await import('~/composables/useFirestorePaths')
      
      for (const transfer of sortedTransfers) {
        if (transfer.items && Array.isArray(transfer.items)) {
          for (const item of transfer.items as any[]) {
            // If item already has itemName, use it (for new transfers)
            if (item.itemName && item.itemName !== 'Item' && item.itemName !== 'Item (deleted or moved)') {
              continue
            }
            
            // Try to fetch item name if not stored
            if (!item.itemName || item.itemName === 'Item' || item.itemName === 'Item (deleted or moved)') {
              try {
                const sourceStoreId = (transfer as any).sourceStoreId
                const destinationStoreId = (transfer as any).destinationStoreId
                const destinationFolderId = (transfer as any).destinationFolderId
                
                // First, try to find in destination store (where item was moved to)
                // Search for items that were transferred from the source store
                if (destinationStoreId && destinationFolderId) {
                  try {
                    const destItemsRef = getInventoryItemsCollection(db, pathUserId, destinationStoreId)
                    const transferredItemsQuery = query(
                      destItemsRef,
                      firestoreWhere('folderId', '==', destinationFolderId),
                      firestoreWhere('transferredFrom', '==', sourceStoreId),
                      firestoreWhere('isTransferred', '==', true)
                    )
                    const transferredItemsSnap = await getDocs(transferredItemsQuery)
                    
                    if (!transferredItemsSnap.empty) {
                      // Find the item that matches the original itemId or was transferred around the same time
                      const transferredItems = transferredItemsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                      })) as any[]
                      
                      // Try to match by original itemId if stored, or just use the first one if only one item
                      let matchedItem: any = null
                      if (transferredItems.length === 1) {
                        matchedItem = transferredItems[0]
                      } else {
                        // Try to find by matching transferredFromFolder and itemId
                        matchedItem = transferredItems.find((ti: any) => {
                          const transferredFromFolder = ti.transferredFromFolder || ti.folderId
                          return transferredFromFolder === (transfer as any).folderId
                        })
                        if (!matchedItem && transferredItems.length > 0) {
                          matchedItem = transferredItems[0] // Fallback to first item
                        }
                      }
                      
                      if (matchedItem) {
                        item.itemName = matchedItem.name || matchedItem.itemName || 'Unnamed Item'
                        if (matchedItem.serialNo || matchedItem.serialNumber) {
                          item.serialNumber = matchedItem.serialNo || matchedItem.serialNumber
                        }
                        continue // Successfully found, skip other attempts
                      }
                    }
                  } catch (queryError) {
                    console.warn('[TransferHistory] Error querying transferred items:', queryError)
                  }
                }
                
                // Fallback: Try source store (item might still be there if transfer failed or was partial)
                if (sourceStoreId && item.itemId) {
                  try {
                    const itemRef = getInventoryItemDocument(db, pathUserId, sourceStoreId, item.itemId)
                    const itemSnap = await getDoc(itemRef)
                    if (itemSnap.exists()) {
                      const itemData = itemSnap.data() as any
                      item.itemName = itemData.name || itemData.itemName || 'Unnamed Item'
                      if (itemData.serialNo || itemData.serialNumber) {
                        item.serialNumber = itemData.serialNo || itemData.serialNumber
                      }
                      continue // Successfully found
                    }
                  } catch (sourceError) {
                    console.warn('[TransferHistory] Error fetching from source store:', sourceError)
                  }
                }
                
                // If still no name found, use itemId as fallback
                if (!item.itemName || item.itemName === 'Item' || item.itemName === 'Item (deleted or moved)') {
                  item.itemName = `Item ${item.itemId?.substring(0, 8) || 'Unknown'}`
                }
              } catch (fetchError) {
                console.warn('[TransferHistory] Error fetching item details:', fetchError)
                // Final fallback
                if (!item.itemName || item.itemName === 'Item' || item.itemName === 'Item (deleted or moved)') {
                  item.itemName = `Item ${item.itemId?.substring(0, 8) || 'Unknown'}`
                }
              }
            }
          }
        }
      }

      transferHistory.value = sortedTransfers
    } catch (queryError: any) {
      console.error('[TransferHistory] Query error:', queryError)
      // If it's a permission error, provide more helpful message
      if (queryError.code === 'permission-denied' || queryError.message?.includes('permission')) {
        console.error('[TransferHistory] Permission denied. Check:')
        console.error('  1. User is logged in as super admin:', userStore.userData?.role)
        console.error('  2. pathUserId matches auth.uid:', pathUserId, '===', authStore.currentUser?.uid)
        console.error('  3. Firestore rules allow read access to users/{userId}/storeTransfers')
        // Don't show error toast if it's just that there are no transfers yet
        if (queryError.message?.includes('index')) {
          throw new Error('Firestore index required. Please create a composite index for storeTransfers collection on createdAt field.')
        }
        throw new Error('Permission denied. Please ensure you are logged in as a super admin and Firestore rules are properly configured.')
      }
      // If it's an index error, try without orderBy
      if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
        console.log('[TransferHistory] Index error, trying without orderBy')
        const transfersQuery = query(transfersRef)
        const transfersSnap = await getDocs(transfersQuery)
        transferHistory.value = transfersSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as object),
        }))
        return
      }
      throw queryError
    }
  } catch (error: any) {
    console.error('[TransferHistory] Failed to load transfer history:', error)
    // Only show toast if it's not a silent return
    if (error.message && !error.message.includes('No user ID') && !error.message.includes('not super admin')) {
      toast.error('Failed to load transfer history: ' + error.message)
    }
  }
}

const loadConsolidatedReports = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) return

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      return
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      console.error('Firestore not initialized')
      return
    }

    // Import Firebase functions
    const { collection, query, where, getDocs, Timestamp } = await import('firebase/firestore')
    const { getReceiptsCollection } = await import('~/composables/useFirestorePaths')
    const pathUserId = userId

    // Calculate date range
    const days = reportFilters.value.dateRange === 'all' ? null : parseInt(reportFilters.value.dateRange)
    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null

    // Get stores to include
    const storesToInclude = reportFilters.value.storeIds === 'all' 
      ? stores.value 
      : stores.value.filter(s => s.id === reportFilters.value.storeIds)

    let totalRevenue = 0
    let totalSales = 0
    let totalItems = 0
    const storeBreakdown: any[] = []

    // Aggregate data from each store
    for (const store of storesToInclude) {
      const receiptsRef = getReceiptsCollection(db, pathUserId, store.id)
      let receiptsQuery: any = query(receiptsRef)
      
      if (startDate) {
        receiptsQuery = query(receiptsRef, where('date', '>=', Timestamp.fromDate(startDate)))
      }
      
      const receiptsSnap = await getDocs(receiptsQuery)
      const receipts = receiptsSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as object),
      }))

      const storeRevenue = receipts.reduce((sum, r: any) => sum + (r.total || 0), 0)
      const storeSales = receipts.length
      const storeItems = receipts.reduce((sum, r: any) => sum + (r.itemsCount || 0), 0)

      totalRevenue += storeRevenue
      totalSales += storeSales
      totalItems += storeItems

      storeBreakdown.push({
        id: store.id,
        name: store.name || store.branchName || store.id,
        revenue: storeRevenue,
        sales: storeSales,
        items: storeItems,
      })
    }

    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    consolidatedReport.value = {
      totalRevenue,
      totalSales,
      totalItems,
      avgOrderValue,
      storeBreakdown,
    }
  } catch (error: any) {
    console.error('Failed to load consolidated report:', error)
    toast.error('Failed to load consolidated report: ' + error.message)
  }
}

const exportConsolidatedReport = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    // Load report data first if not already loaded
    if (consolidatedReport.value.totalSales === 0 && consolidatedReport.value.storeBreakdown.length === 0) {
      await loadConsolidatedReports()
    }

    // Generate PDF using jsPDF
    const { default: jsPDF } = await import('jspdf')

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('Consolidated Report', 14, 20)
    
    // Add date range
    doc.setFontSize(10)
    const dateRangeText = reportFilters.value.dateRange === 'all' 
      ? 'All Time' 
      : `Last ${reportFilters.value.dateRange} days`
    doc.text(`Date Range: ${dateRangeText}`, 14, 30)
    
    // Add summary
    doc.setFontSize(12)
    doc.text('Summary', 14, 40)
    doc.setFontSize(10)
    doc.text(`Total Revenue: ${formatCurrency(consolidatedReport.value.totalRevenue)}`, 14, 48)
    doc.text(`Total Sales: ${consolidatedReport.value.totalSales}`, 14, 54)
    doc.text(`Total Items: ${consolidatedReport.value.totalItems}`, 14, 60)
    doc.text(`Average Order Value: ${formatCurrency(consolidatedReport.value.avgOrderValue)}`, 14, 66)

    // Add store breakdown table (simple table without autoTable)
    if (consolidatedReport.value.storeBreakdown.length > 0) {
      let yPos = 80
      doc.setFontSize(12)
      doc.text('Store Breakdown', 14, yPos)
      yPos += 8
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Store', 14, yPos)
      doc.text('Revenue', 70, yPos)
      doc.text('Sales', 120, yPos)
      doc.text('Items', 150, yPos)
      yPos += 6
      
      // Table rows
      doc.setFont('helvetica', 'normal')
      for (const store of consolidatedReport.value.storeBreakdown) {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
      doc.text(store.name || '', 14, yPos)
      doc.text(formatCurrency(store.revenue || 0), 70, yPos)
      doc.text((store.sales || 0).toString(), 120, yPos)
      doc.text((store.items || 0).toString(), 150, yPos)
        yPos += 6
      }
    }

    // Save PDF
    const fileName = `consolidated-report-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    toast.success('Report exported successfully!')
  } catch (error: any) {
    console.error('Export error:', error)
    toast.error('Export failed: ' + error.message)
  }
}

const getStoreName = (storeId: string) => {
  const store = stores.value.find(s => s.id === storeId)
  return store?.name || store?.branchName || storeId
}

const formatDate = (date: any) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Lifecycle
onMounted(async () => {
  if (canAccess.value) {
    await loadStores()
    // Load transfer history after a short delay to ensure user data is loaded
    setTimeout(async () => {
      await loadTransferHistory()
    }, 500)
    await loadConsolidatedReports()
  }
})
</script>
