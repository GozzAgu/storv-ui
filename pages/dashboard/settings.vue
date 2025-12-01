<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage your store and application preferences</p>
    </div>

    <div class="space-y-6">
      <!-- Store Information -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Store Information</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your business details</p>
          </div>
          <button 
            v-if="!isEditingStore"
            @click="enableEditing('store')"
            class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Edit
          </button>
          <div v-else class="flex gap-2">
            <button 
              @click="cancelEditing('store')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveStoreInfo"
              class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white dark:text-white rounded-lg transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Store Name
            </label>
            <input
              v-model="storeInfo.name"
              type="text"
              :disabled="!isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter store name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Type
            </label>
            <input
              v-model="storeInfo.businessType"
              type="text"
              :disabled="!isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter business type"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              v-model="storeInfo.email"
              type="email"
              :disabled="!isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter store email"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              v-model="storeInfo.phone"
              type="tel"
              :disabled="!isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter phone number"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              v-model="storeInfo.address"
              rows="2"
              :disabled="!isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter store address"
            ></textarea>
          </div>
        </div>
      </Card>

      <!-- Inventory Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure inventory management preferences</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Low Stock Alert Threshold</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive alerts when stock falls below this quantity</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model.number="inventorySettings.lowStockThreshold"
                type="number"
                min="1"
                class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">units</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-reorder Enabled</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically create purchase orders when stock is low</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="inventorySettings.autoReorder"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between py-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Default Category</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Default category for new products</p>
            </div>
            <select
              v-model="inventorySettings.defaultCategory"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="office">Office Supplies</option>
            </select>
          </div>
        </div>
      </Card>

      <!-- Receipt & Invoice Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Receipt & Invoice Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize receipt and invoice preferences</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Receipt Prefix</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Prefix for receipt numbers (e.g., REC-)</p>
            </div>
            <input
              v-model="receiptSettings.prefix"
              type="text"
              class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="REC-"
            />
          </div>

          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Next Receipt Number</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Starting number for next receipt</p>
            </div>
            <input
              v-model.number="receiptSettings.nextNumber"
              type="number"
              min="1"
              class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div class="flex items-center justify-between py-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Print Receipt Automatically</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically print receipt after sale</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="receiptSettings.autoPrint"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </Card>

      <!-- Tax & Payment Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tax & Payment Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure tax rates and payment methods</p>
        </div>
      </div>

            <div class="space-y-6">
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Default Tax Rate</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Default tax percentage applied to sales</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model.number="taxSettings.defaultRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">%</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Tax Included in Price</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Prices shown include tax</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="taxSettings.taxIncluded"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div class="py-4">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Payment Methods</p>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="taxSettings.paymentMethods"
                  type="checkbox"
                  value="cash"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Cash</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="taxSettings.paymentMethods"
                  type="checkbox"
                  value="card"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Card Payment</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="taxSettings.paymentMethods"
                  type="checkbox"
                  value="mobile"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Mobile Money</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="taxSettings.paymentMethods"
                  type="checkbox"
                  value="bank"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Bank Transfer</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <!-- Data Management -->
      <Card>
        <div class="flex items-center justify-between mb-6">
              <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Management</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Backup, export, and manage your data</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Export Section -->
          <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ArrowDownTrayIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Export Data</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Download your data as CSV or JSON</p>
              </div>
            </div>
            <div class="ml-13 space-y-2">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Available exports:</p>
              <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Products/Inventory
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Customers
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Sales/Receipts
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Returns
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Suppliers
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  All Data (Backup)
                </div>
              </div>
            </div>
            <div class="ml-13 mt-4">
              <button 
                @click="handleExport"
                class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Export All Data
              </button>
            </div>
          </div>

          <!-- Import Section -->
          <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUpTrayIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Import Data</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Import data from CSV or JSON file</p>
              </div>
            </div>
            <div class="ml-13 space-y-2">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Supported imports:</p>
              <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Products/Inventory (CSV)
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Customers (CSV)
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Full Backup (JSON)
                </div>
              </div>
            </div>
            <div class="ml-13 mt-4">
              <input
                ref="importFileInput"
                type="file"
                accept=".csv,.json"
                @change="handleImport"
                class="hidden"
              />
              <button 
                @click="triggerImport"
                class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Choose File to Import
              </button>
            </div>
          </div>

          <!-- Delete Section -->
          <div class="flex items-center justify-between py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrashIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Delete All Data</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Permanently delete all store data (cannot be undone)</p>
              </div>
            </div>
            <button 
              @click="handleDeleteAll"
              class="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete All
            </button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useUserStore } from '~/stores/user'
import { collection, query, where, getDocs } from 'firebase/firestore'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Settings - Storv',
})

// Store information
const storeInfo = reactive({
  name: '',
  businessType: '',
  email: '',
  phone: '',
  address: '',
})

const backupStoreInfo = reactive({ ...storeInfo })
const isEditingStore = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
const isLoadingStoreInfo = ref(true)

// Get user data and load store info
const { currentUser } = useFirebaseAuth()
const { getUserDocument, updateStoreDetails } = useUser()
const { getFirestoreInstance } = useFirestore()
const userStore = useUserStore()

// Helper function to get the correct user ID (super admin UID if staff)
const getTargetUserId = async (): Promise<string | null> => {
  if (!currentUser.value) return null
  
  // Fetch user data if not loaded
  if (!userStore.userData) {
    await userStore.fetchUserData(currentUser.value.uid)
  }
  
  let userId = currentUser.value.uid
  
  // If the current user is staff, get the super admin UID from the staff document
  if (userStore.userData?.role === 'staff') {
    try {
      const db = getFirestoreInstance()
      if (!db) {
        console.warn('[Settings] Firestore not initialized')
        return userId
      }
      
      // Find the staff document for this user
      const staffRef = collection(db, 'staff')
      const staffQuery = query(staffRef, where('authUid', '==', userId))
      const staffSnapshot = await getDocs(staffQuery)
      
      if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
        const staffDoc = staffSnapshot.docs[0]
        if (staffDoc) {
          const staffData = staffDoc.data()
          // Use the super admin's UID who created this staff member
          if (staffData.createdBy) {
            userId = staffData.createdBy
            console.log('[Settings] Staff user detected, using super admin UID:', userId)
          }
        }
      }
    } catch (error: any) {
      console.warn('[Settings] Could not fetch staff document, using current user UID:', error.message)
    }
  }
  
  return userId
}

// Load store information from Firestore
onMounted(async () => {
  if (currentUser.value) {
    try {
      const targetUserId = await getTargetUserId()
      if (!targetUserId) {
        isLoadingStoreInfo.value = false
        return
      }
      
      const userData = await getUserDocument(targetUserId)
      if (userData?.storeDetails) {
        storeInfo.name = userData.storeDetails.storeName || ''
        storeInfo.email = userData.storeDetails.storeEmail || ''
        storeInfo.phone = userData.storeDetails.storePhone || ''
        storeInfo.address = userData.storeDetails.storeAddress || ''
        storeInfo.businessType = userData.storeDetails.storeDescription || ''
        
        // Update backup
        Object.assign(backupStoreInfo, { ...storeInfo })
      }
    } catch (error) {
      console.error('Error loading store info:', error)
    } finally {
      isLoadingStoreInfo.value = false
    }
  } else {
    isLoadingStoreInfo.value = false
  }
})

// Inventory settings
const inventorySettings = reactive({
  lowStockThreshold: 10,
  autoReorder: false,
  defaultCategory: 'general',
})

// Receipt settings
const receiptSettings = reactive({
  prefix: 'REC-',
  nextNumber: 1001,
  autoPrint: false,
})

// Tax settings
const taxSettings = reactive({
  defaultRate: 7.5,
  taxIncluded: false,
  paymentMethods: ['cash', 'card'],
})


// Functions
const enableEditing = (section: string) => {
  if (section === 'store') {
    isEditingStore.value = true
    Object.assign(backupStoreInfo, { ...storeInfo })
  }
}

const cancelEditing = (section: string) => {
  if (section === 'store') {
    isEditingStore.value = false
    Object.assign(storeInfo, { ...backupStoreInfo })
  }
}

const saveStoreInfo = async () => {
  if (!currentUser.value) {
    alert('You must be signed in to save store information')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      alert('Unable to determine target user. Please try again.')
      return
    }
    
    await updateStoreDetails(targetUserId, {
      storeName: storeInfo.name,
      storeEmail: storeInfo.email,
      storePhone: storeInfo.phone,
      storeAddress: storeInfo.address,
      storeDescription: storeInfo.businessType,
    })
    
    isEditingStore.value = false
    Object.assign(backupStoreInfo, { ...storeInfo })
    alert('Store information updated successfully!')
  } catch (error: any) {
    console.error('Error saving store info:', error)
    alert(error.message || 'Failed to save store information. Please try again.')
  }
}

// Data Management Functions
const handleExport = () => {
  // In production, this would generate and download files
  const exportData = {
    products: 'Export includes: Name, SKU, Category, Price, Quantity, Cost, Supplier, etc.',
    customers: 'Export includes: Name, Email, Phone, Address, Total Orders, Total Spent, etc.',
    receipts: 'Export includes: Receipt #, Date, Customer, Items, Total, Tax, Payment Method, etc.',
    returns: 'Export includes: Return #, Original Receipt, Items, Reason, Date, Status, etc.',
    suppliers: 'Export includes: Name, Contact, Email, Products Supplied, Payment Terms, etc.',
    settings: 'Export includes: Store Info, Inventory Settings, Tax Rates, Payment Methods, etc.',
  }
  
  console.log('Exporting data:', exportData)
  // Simulate download
  alert('Data export started! This would download:\n- Products.csv\n- Customers.csv\n- Receipts.csv\n- Returns.csv\n- Suppliers.csv\n- Settings.json\n\nAll files would be downloaded as a ZIP archive.')
}

const triggerImport = () => {
  importFileInput.value?.click()
}

const handleImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const fileType = file.name.split('.').pop()?.toLowerCase()
    console.log('Importing file:', file.name, 'Type:', fileType)
    
    if (fileType === 'csv') {
      alert(`Importing ${file.name}...\n\nCSV files should have columns matching:\n- Products: Name, SKU, Category, Price, Quantity\n- Customers: Name, Email, Phone, Address`)
    } else if (fileType === 'json') {
      alert(`Importing backup file ${file.name}...\n\nThis will restore all data from the backup file.`)
    } else {
      alert('Unsupported file type. Please use CSV or JSON files.')
    }
    
    // Reset file input
    if (target) target.value = ''
  }
}

const handleDeleteAll = () => {
  const confirmed = confirm(
    '⚠️ WARNING: This will permanently delete ALL your data!\n\n' +
    'This includes:\n' +
    '- All products/inventory\n' +
    '- All customers\n' +
    '- All receipts and sales history\n' +
    '- All returns\n' +
    '- All suppliers\n\n' +
    'This action CANNOT be undone. Are you absolutely sure?'
  )
  
  if (confirmed) {
    const doubleConfirm = confirm('Last chance! Type "DELETE" in the next prompt to confirm.')
    if (doubleConfirm) {
      console.log('Deleting all data...')
      alert('All data has been deleted. (This is a demo - no data was actually deleted)')
    }
  }
}
</script>

