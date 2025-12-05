<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">Manage your store and application preferences</p>
        </div>
        <div v-if="!canEditSettings" class="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">View Only Mode</p>
          <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Only super admins can edit settings</p>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Stores Management (for super admins) -->
      <Card v-if="userStore.isSuperAdmin">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Stores Management</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your stores and switch between them</p>
          </div>
          <NuxtLink to="/dashboard/stores">
            <Button variant="secondary">
              Manage Stores
            </Button>
          </NuxtLink>
        </div>

        <div v-if="storesLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <p class="text-gray-600 dark:text-gray-400 mt-3 text-sm">Loading stores...</p>
        </div>

        <div v-else-if="storesError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200 text-sm">{{ storesError }}</p>
        </div>

        <div v-else-if="stores.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 class="mt-4 text-sm font-medium text-gray-900 dark:text-gray-50">No stores yet</h3>
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">Get started by creating your first store.</p>
          <div class="mt-4">
            <NuxtLink to="/dashboard/stores">
              <Button size="sm">Create Store</Button>
            </NuxtLink>
          </div>
        </div>

        <div v-else class="space-y-3">
          <!-- Current Store -->
          <div v-if="currentStore" class="p-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-600 rounded-xl">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">Current Store</span>
                  <span class="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                    Active
                  </span>
                </div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-gray-50">{{ currentStore.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1" v-if="currentStore.description">
                  {{ currentStore.description }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="currentStore.address">
                    <svg class="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ currentStore.address }}
                  </span>
                  <span v-if="currentStore.phone">
                    <svg class="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {{ currentStore.phone }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Other Stores -->
          <div v-if="otherStores.length > 0" class="space-y-2">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Other Stores</p>
            <div
              v-for="store in otherStores"
              :key="store.id"
              @click="switchStore(store.id)"
              class="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50">{{ store.name }}</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1" v-if="store.description">
                    {{ store.description }}
                  </p>
                </div>
                <span
                  v-if="!store.isActive"
                  class="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  Inactive
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Store Information -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Store Information</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your business details</p>
          </div>
          <button 
            v-if="canEditSettings && !isEditingStore"
            @click="enableEditing('store')"
            class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Edit
          </button>
          <div v-else-if="canEditSettings && isEditingStore" class="flex gap-2">
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
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
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
              :disabled="!canEditSettings || !isEditingStore"
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
              :disabled="!canEditSettings || !isEditingStore"
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
              :disabled="!canEditSettings || !isEditingStore"
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
              :disabled="!canEditSettings || !isEditingStore"
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
              :disabled="!canEditSettings || !isEditingStore"
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
          <Button 
            v-if="canEditSettings"
            @click="saveInventorySettings" 
            variant="primary"
          >
            Save Changes
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
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
                :disabled="!canEditSettings"
                :class="[
                  'w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  canEditSettings
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
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
                :disabled="!canEditSettings"
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
              :disabled="!canEditSettings"
              :class="[
                'px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                canEditSettings
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
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
          <Button 
            v-if="canEditSettings"
            @click="saveReceiptSettings" 
            variant="primary"
          >
            Save Changes
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
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
              :disabled="!canEditSettings"
              :class="[
                'w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                canEditSettings
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
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
              :disabled="!canEditSettings"
              :class="[
                'w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                canEditSettings
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
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
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </Card>

      <!-- Payment Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure available payment methods</p>
          </div>
          <Button 
            v-if="canEditSettings"
            @click="savePaymentSettings" 
            variant="primary"
          >
            Save Changes
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
          </div>
      </div>

            <div class="space-y-6">
          <div class="py-4">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Available Payment Methods</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Select the payment methods you accept for sales transactions</p>
            <div class="space-y-3">
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="cash"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Cash</span>
              </label>
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="card"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Card Payment</span>
              </label>
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="mobile"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Mobile Money</span>
              </label>
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="bank"
                  :disabled="!canEditSettings"
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
                :disabled="!canEditSettings"
                :class="[
                  'px-4 py-2 text-sm font-medium border rounded-lg transition-colors',
                  canEditSettings
                    ? 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-60'
                ]"
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
                :disabled="!canEditSettings"
                :class="[
                  'px-4 py-2 text-sm font-medium border rounded-lg transition-colors',
                  canEditSettings
                    ? 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-60'
                ]"
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
              v-if="canEditSettings"
              @click="handleDeleteAll"
              class="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete All
            </button>
            <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
              View Only
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useToast } from '~/composables/useToast'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
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
const storesStore = useStoresStore()
const toast = useToast()

// Check if user is super admin (only super admins can edit settings)
const canEditSettings = computed(() => {
  return userStore.isSuperAdmin
})

// Stores management
const storesLoading = computed(() => storesStore.loading)
const storesError = computed(() => storesStore.error)
const stores = computed(() => storesStore.stores)
const currentStore = computed(() => storesStore.currentStore)
const otherStores = computed(() => {
  const allStores = stores.value
  const current = currentStore.value
  return current ? allStores.filter(s => s.id !== current.id) : allStores
})

const switchStore = async (storeId: string) => {
  try {
    toast.info('Switching store...')
    await storesStore.setCurrentStore(storeId)
    toast.success('Store switched successfully')
  } catch (err: any) {
    toast.error(err.message || 'Failed to switch store')
  }
}

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

// Load store information and settings from Firestore
onMounted(async () => {
  if (currentUser.value) {
    try {
      // Fetch current user data first to check permissions
      if (!userStore.userData) {
        await userStore.fetchUserData(currentUser.value.uid)
      }

      // Load stores if super admin
      if (userStore.isSuperAdmin) {
        await storesStore.fetchStores()
        await storesStore.initializeCurrentStore()
      }
      
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
        
        // Load settings
        if (userData.storeDetails.settings) {
          const settings = userData.storeDetails.settings
          
          if (settings.inventory) {
            inventorySettings.lowStockThreshold = settings.inventory.lowStockThreshold ?? 10
            inventorySettings.autoReorder = settings.inventory.autoReorder ?? false
            inventorySettings.defaultCategory = settings.inventory.defaultCategory || 'general'
          }
          
          if (settings.receipt) {
            receiptSettings.prefix = settings.receipt.prefix || 'REC-'
            receiptSettings.nextNumber = settings.receipt.nextNumber ?? 1001
            receiptSettings.autoPrint = settings.receipt.autoPrint ?? false
          }
          
          if (settings.payment) {
            paymentSettings.paymentMethods = settings.payment.paymentMethods || ['cash', 'card']
          }
        }
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

// Payment settings
const paymentSettings = reactive({
  paymentMethods: ['cash', 'card'],
})


// Functions
const enableEditing = (section: string) => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
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

// Helper function to update store settings
const updateStoreSettings = async (settings: any) => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save settings')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
      return
    }
    
    const userData = await getUserDocument(targetUserId)
    const currentStoreDetails = userData?.storeDetails || {}
    const currentSettings = (currentStoreDetails as any).settings || {}
    
    const { updateUserDocument } = useUser()
    await updateUserDocument(targetUserId, {
      storeDetails: {
        ...currentStoreDetails,
        settings: {
          ...currentSettings,
          ...settings,
        },
      },
    } as any)
    
    toast.success('Settings saved successfully!')
  } catch (error: any) {
    console.error('Error saving settings:', error)
    toast.error(error.message || 'Failed to save settings. Please try again.')
  }
}

const saveStoreInfo = async () => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save store information')
    return
  }

  if (!canEditSettings.value) {
    toast.error('Only super admins can edit store settings')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
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
    toast.success('Store information updated successfully!')
  } catch (error: any) {
    console.error('Error saving store info:', error)
    toast.error(error.message || 'Failed to save store information. Please try again.')
  }
}

// Save inventory settings
const saveInventorySettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  await updateStoreSettings({
    inventory: {
      lowStockThreshold: inventorySettings.lowStockThreshold,
      autoReorder: inventorySettings.autoReorder,
      defaultCategory: inventorySettings.defaultCategory,
    },
  })
}

// Save receipt settings
const saveReceiptSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  await updateStoreSettings({
    receipt: {
      prefix: receiptSettings.prefix,
      nextNumber: receiptSettings.nextNumber,
      autoPrint: receiptSettings.autoPrint,
    },
  })
}

// Save payment settings
const savePaymentSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  await updateStoreSettings({
    payment: {
      paymentMethods: paymentSettings.paymentMethods,
    },
  })
}

// Data Management Functions
const handleExport = () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can export data')
    return
  }
  
  // In production, this would generate and download files
  const exportData = {
    products: 'Export includes: Name, SKU, Category, Price, Quantity, Cost, Supplier, etc.',
    customers: 'Export includes: Name, Email, Phone, Address, Total Orders, Total Spent, etc.',
    receipts: 'Export includes: Receipt #, Date, Customer, Items, Total, Payment Method, etc.',
    returns: 'Export includes: Return #, Original Receipt, Items, Reason, Date, Status, etc.',
    suppliers: 'Export includes: Name, Contact, Email, Products Supplied, Payment Terms, etc.',
    settings: 'Export includes: Store Info, Inventory Settings, Payment Methods, etc.',
  }
  
  console.log('Exporting data:', exportData)
  // Simulate download
  toast.info('Data export started! This would download:\n- Products.csv\n- Customers.csv\n- Receipts.csv\n- Returns.csv\n- Suppliers.csv\n- Settings.json\n\nAll files would be downloaded as a ZIP archive.', 5000)
}

const triggerImport = () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can import data')
    return
  }
  importFileInput.value?.click()
}

const handleImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const fileType = file.name.split('.').pop()?.toLowerCase()
    console.log('Importing file:', file.name, 'Type:', fileType)
    
    if (fileType === 'csv') {
      toast.info(`Importing ${file.name}...\n\nCSV files should have columns matching:\n- Products: Name, SKU, Category, Price, Quantity\n- Customers: Name, Email, Phone, Address`, 5000)
    } else if (fileType === 'json') {
      toast.info(`Importing backup file ${file.name}...\n\nThis will restore all data from the backup file.`, 5000)
    } else {
      toast.error('Unsupported file type. Please use CSV or JSON files.')
    }
    
    // Reset file input
    if (target) target.value = ''
  }
}

const handleDeleteAll = () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can delete data')
    return
  }
  
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

